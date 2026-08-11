import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';
import { UserOrganization } from './UserOrganization';
import * as https from 'https';

// 兼容多种入参形态：event.body 字符串/对象、SDK 额外包裹 data、双层编码
function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return {}; }
  }
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return {}; }
  }
  if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && 'data' in body) {
    body = body.data;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return {}; }
    }
  }
  return body ?? {};
}

const ZONE_NAME = 'default';
const DINGTALK_HOST = 'oapi.dingtalk.com';
const CONCURRENCY = 20;
const UPSERT_BATCH = 100;
const HTTP_TIMEOUT = 10000;
const QUERY_PAGE_SIZE = 1000;
const QUERY_MAX_PAGES = 50;
const USER_LIST_MAX_PAGES = 100;
const USER_GET_RETRIES = 3;

function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: HTTP_TIMEOUT }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e: any) {
          reject(new Error(`钉钉接口返回非JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`钉钉接口请求失败: ${e.message}`)));
    req.on('timeout', () => { req.destroy(new Error('钉钉接口请求超时')); });
  });
}

function httpsPost(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: HTTP_TIMEOUT,
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e: any) {
          reject(new Error(`钉钉接口返回非JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`钉钉接口请求失败: ${e.message}`)));
    req.on('timeout', () => { req.destroy(new Error('钉钉接口请求超时')); });
    req.write(payload);
    req.end();
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 并发限制执行器：fn 并发最多 limit 个 */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

// Cloud DB caps a single query result at 1000 records; paginate so members
// beyond the first 1000 are not missed when preserving joinedAt / deleting removed.
async function queryAllMembersByOrg(col: CloudDBCollection<Member>, orgId: string): Promise<Member[]> {
  const all: Member[] = [];
  for (let page = 0; page < QUERY_MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(QUERY_PAGE_SIZE, page * QUERY_PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < QUERY_PAGE_SIZE) break;
  }
  return all;
}

/** 解析钉钉入职时间作为入会时间：优先 hired_date_v2（毫秒时间戳），其次 hired_date（yyyy-MM-dd） */
function parseHiredDate(u: any): Date | null {
  const v2 = Number(u?.hired_date_v2);
  if (Number.isInteger(v2) && v2 > 0) return new Date(v2);
  const s = String(u?.hired_date || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00');
  return null;
}

/** 获取用户详情：失败重试，重试后仍失败则抛错中止（避免静默丢人导致数据不全） */
async function getUserDetail(token: string, userid: string): Promise<any> {
  let lastErr = '';
  for (let attempt = 0; attempt < USER_GET_RETRIES; attempt++) {
    const res = await httpsPost(
      `https://${DINGTALK_HOST}/topapi/v2/user/get?access_token=${token}`,
      { userid },
    );
    if (res.errcode === 0 && res.result) return res.result;
    lastErr = `${res.errmsg || res.errcode}`;
    if (attempt < USER_GET_RETRIES - 1) {
      await sleep(300 * (attempt + 1));
    }
  }
  throw new Error(`获取钉钉用户详情失败: ${userid}（${lastErr}）`);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('dingtalk-sync-contacts called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const clientId = params?.clientId as string;
    const clientSecret = params?.clientSecret as string;
    const roleId = params?.roleId as string;
    const roleLabel = params?.roleLabel as string;
    const selectedDeptIds = Array.isArray(params?.deptIds)
      ? (params.deptIds as any[])
          .map((v: any) => Number(v))
          .filter((v: any) => Number.isInteger(v) && v > 0)
      : [];
    const excludedDeptIds = Array.isArray(params?.excludeDeptIds)
      ? (params.excludeDeptIds as any[])
          .map((v: any) => Number(v))
          .filter((v: any) => Number.isInteger(v) && v > 0)
      : [];
    // 传了 deptIds 即为“选定部门同步”；未传为全量同步（可删除已不在钉钉的成员）
    const isSubsetSync = selectedDeptIds.length > 0;
    if (!orgId || !clientId || !clientSecret) {
      callback({ ret: { code: -1, message: '缺少 orgId/clientId/clientSecret 参数' } });
      return;
    }

    // 1. 获取 access_token
    const tokenRes = await httpsGet(
      `https://${DINGTALK_HOST}/gettoken?appkey=${encodeURIComponent(clientId)}&appsecret=${encodeURIComponent(clientSecret)}`,
    );
    if (tokenRes.errcode !== 0 || !tokenRes.access_token) {
      callback({ ret: { code: -1, message: `钉钉获取凭证失败: ${tokenRes.errmsg || tokenRes.errcode}` } });
      return;
    }
    const token = tokenRes.access_token;

    // 2. 遍历全部部门，建立 id -> name 与父->子映射（供选择/排除与部门名使用）
    const deptNames = new Map<number, string>();
    const childrenOf = new Map<number, number[]>();
    const visitNames = async (parentId: number): Promise<void> => {
      const res = await httpsPost(
        `https://${DINGTALK_HOST}/topapi/v2/department/listsub?access_token=${token}`,
        { dept_id: parentId },
      );
      if (res.errcode !== 0) {
        throw new Error(`钉钉获取部门列表失败: ${res.errmsg || res.errcode}`);
      }
      const subs: any[] = res.result || [];
      for (const d of subs) {
        deptNames.set(d.dept_id, d.name || '');
        const list = childrenOf.get(parentId) || [];
        list.push(d.dept_id);
        childrenOf.set(parentId, list);
        await visitNames(d.dept_id);
      }
    };
    await visitNames(1);

    // 3. 计算需要拉取用户的部门（全量=全部部门；选定=所选部门子树，排除选中的下级子树）
    const fetchDeptIds: number[] = [];
    if (!isSubsetSync) {
      fetchDeptIds.push(1);
      for (const id of childrenOf.keys()) {
        fetchDeptIds.push(id);
      }
    } else {
      const excluded = new Set(excludedDeptIds);
      const collect = (id: number): void => {
        if (excluded.has(id)) return;
        fetchDeptIds.push(id);
        for (const c of childrenOf.get(id) || []) {
          collect(c);
        }
      };
      for (const id of selectedDeptIds) {
        collect(id);
      }
    }
    const uniqueDeptIds = Array.from(new Set(fetchDeptIds));

    // 4. 逐部门取用户 userid（分页，带进度保护），跨部门去重
    const userIds = new Set<string>();
    for (const deptId of uniqueDeptIds) {
      let cursor = 0;
      for (let page = 0; page < USER_LIST_MAX_PAGES; page++) {
        const res = await httpsPost(
          `https://${DINGTALK_HOST}/topapi/v2/user/list?access_token=${token}`,
          { dept_id: deptId, cursor, size: 100 },
        );
        if (res.errcode !== 0) {
          throw new Error(`钉钉获取部门用户失败: ${res.errmsg || res.errcode}`);
        }
        const list: any[] = (res.result && res.result.list) || [];
        for (const u of list) {
          if (u.userid) userIds.add(u.userid);
        }
        const hasMore = res.result && res.result.has_more === true;
        if (!hasMore) break;
        const next = res.result && res.result.next_cursor;
        if (next == null || Number(next) <= cursor) break; // 防死循环
        cursor = Number(next);
      }
    }
    const allUserIds = Array.from(userIds);
    logger.info(`dingtalk users: ${allUserIds.length}, depts: ${uniqueDeptIds.length}`);

    // 5. 并发拉用户详情（失败重试，仍失败即中止，不静默丢人）
    const details = await mapWithConcurrency(allUserIds, CONCURRENCY, async (userid) => {
      return getUserDetail(token, userid);
    });
    const users = details.filter((u: any) => u && u.userid && u.active !== false) as any[];

    // 6. 查询本组织现有成员
    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Member> = db.collection(Member);
    const existing = await queryAllMembersByOrg(col, orgId);
    const existingById = new Map<string, any>();
    for (const m of existing) {
      existingById.set(m.id, m);
    }

    // 7. 构建成员记录
    const now = new Date();
    let added = 0;
    let updated = 0;
    const members: Member[] = users.map((u: any) => {
      const id = 'd' + u.userid;
      const obj = new Member();
      obj.id = id;
      obj.name = u.name || '';
      // 会员编号兜底（部分部门同步时使用）：工号 > 手机号 > 固定电话 > unionid > userid
      obj.studentNo = String(
        u.job_number || u.mobile || u.telephone || u.unionid || u.userid || '',
      );
      const deptId = Array.isArray(u.dept_id_list) && u.dept_id_list.length > 0 ? u.dept_id_list[0] : null;
      const deptName = deptId != null && deptNames.has(deptId)
        ? deptNames.get(deptId)!
        : (Array.isArray(u.department) && u.department.length > 0 ? u.department[0] : '');
      obj.phone = u.mobile || '';
      obj.email = u.email || '';
      const hired = parseHiredDate(u);
      const prev = existingById.get(id);
      if (prev) {
        obj.joinedAt = hired ?? (prev.joinedAt ? new Date(prev.joinedAt) : now);
        // 部门与角色：保留人工调整过的值，仅空时回退到钉钉数据
        obj.department = prev.department || deptName || '';
        obj.roleId = prev.roleId || (roleId || '');
        obj.roleLabel = prev.roleLabel || (roleLabel || '');
        updated++;
      } else {
        obj.joinedAt = hired ?? now;
        obj.department = deptName || '';
        obj.roleId = roleId || '';
        obj.roleLabel = roleLabel || '';
        added++;
      }
      obj.dingTalkUserId = u.userid;
      obj.syncStatus = 'synced';
      obj.lastSyncedAt = now;
      obj.orgId = orgId;
      obj.updatedAt = now;
      return obj;
    });

    // 会员编号：全量同步时按（入会时间, 姓名）排序，从 1 开始递增
    if (!isSubsetSync) {
      const sorted = [...members].sort((a, b) => {
        const d = a.joinedAt.getTime() - b.joinedAt.getTime();
        if (d !== 0) return d;
        const n = a.name.localeCompare(b.name, 'zh-CN');
        return n !== 0 ? n : a.id.localeCompare(b.id);
      });
      sorted.forEach((m, i) => {
        m.studentNo = String(i + 1);
      });
    }

    // 8. 全量同步：删除钉钉中已不存在的同步成员（先清理账号绑定），部分同步不删
    const syncedIds = new Set(members.map((m) => m.id));
    let removed = 0;
    if (!isSubsetSync) {
      const toDelete: Member[] = [];
      for (const m of existing) {
        if (m.syncStatus === 'synced' && !syncedIds.has(m.id)) {
          toDelete.push(m);
        }
      }
      if (toDelete.length > 0) {
        const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
        for (const m of toDelete) {
          const uoRows = await uoCol.query().equalTo('memberId', m.id).limit(1000).get();
          for (const uo of uoRows) {
            uo.memberId = '';
            await uoCol.upsert([uo]);
          }
        }
        for (let i = 0; i < toDelete.length; i += UPSERT_BATCH) {
          await col.delete(toDelete.slice(i, i + UPSERT_BATCH));
        }
        removed = toDelete.length;
      }
    }

    // 9. 分批 upsert
    for (let i = 0; i < members.length; i += UPSERT_BATCH) {
      await col.upsert(members.slice(i, i + UPSERT_BATCH));
    }
    logger.info(`dingtalk sync done: added=${added}, updated=${updated}, removed=${removed}`);

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          added,
          updated,
          removed,
          total: members.length,
          syncedAt: now.toISOString(),
        },
      },
    });
  } catch (err: any) {
    logger.error(`dingtalk-sync-contacts error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
