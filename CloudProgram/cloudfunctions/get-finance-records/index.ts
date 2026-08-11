import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalInstance } from './ApprovalInstance';
import { UserOrganization } from './UserOrganization';

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
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;
const LIST_PAGE_SIZE = 100;

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

function actorsInclude(snapRaw: string, histRaw: string, myIds: Set<string>): boolean {
  let snap: any = {};
  try {
    snap = JSON.parse(snapRaw || '{}');
  } catch {
    snap = {};
  }
  const mids: string[] = Array.isArray(snap.actorMemberIds) ? snap.actorMemberIds : [];
  const uids: string[] = Array.isArray(snap.actorUserIds) ? snap.actorUserIds : [];
  for (const id of mids.concat(uids)) {
    if (myIds.has(id)) return true;
  }
  let hist: any[] = [];
  try {
    hist = JSON.parse(histRaw || '[]');
  } catch {
    hist = [];
  }
  for (const h of hist) {
    if (h && h.actorId && myIds.has(h.actorId)) return true;
  }
  return false;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-finance-records called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const id = params?.id as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const isAdmin = mine[0].role === 'admin';
    const myMemberId = mine[0].memberId || '';
    const myIds = new Set<string>([userId]);
    if (myMemberId) myIds.add(myMemberId);

    const col: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    if (id) {
      const rows = await col.query().equalTo('id', id).get();
      if (rows.length === 0 || rows[0].orgId !== orgId) {
        callback({ ret: { code: -1, message: '单据不存在' } });
        return;
      }
      const record = rows[0];
      let instance: ApprovalInstance | null = null;
      if (record.instanceId) {
        const instCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
        const insts = await instCol.query().equalTo('id', record.instanceId).get();
        if (insts.length > 0) instance = insts[0];
      }
      // 权限：管理员全量；普通成员仅自己创建或参与审批的单据
      const visible = isAdmin || record.createdBy === userId ||
        (instance != null && actorsInclude(instance.nodeSnapshot, instance.history, myIds));
      if (!visible) {
        callback({ ret: { code: -1, message: '无权查看该单据' } });
        return;
      }
      let canAct = false;
      if (instance && instance.status === 'running') {
        let snap: any = {};
        try {
          snap = JSON.parse(instance.nodeSnapshot || '{}');
        } catch {
          snap = {};
        }
        const mids: string[] = Array.isArray(snap.actorMemberIds) ? snap.actorMemberIds : [];
        const uids: string[] = Array.isArray(snap.actorUserIds) ? snap.actorUserIds : [];
        canAct = (mine[0].memberId && mids.includes(mine[0].memberId)) || uids.includes(userId);
      }
      callback({ ret: { code: 0, message: 'ok', data: { record, instance, canAct } } });
      return;
    }

    const status = params?.status as string;
    const projectId = params?.projectId as string;
    const page = Math.max(0, Number(params?.page) || 0);
    const all = await queryAllByOrg(col, orgId);
    let filtered = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (!isAdmin) {
      const instCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
      const visibleBiz = new Set<string>();
      const insts = await queryAllByOrg(instCol, orgId);
      for (const inst of insts) {
        if (inst.bizId && actorsInclude(inst.nodeSnapshot, inst.history, myIds)) {
          visibleBiz.add(inst.bizId);
        }
      }
      filtered = filtered.filter(
        (r) => r.createdBy === userId || (r.instanceId && visibleBiz.has(r.instanceId)),
      );
    }
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (projectId) filtered = filtered.filter((r) => r.projectId === projectId);
    const start = page * LIST_PAGE_SIZE;
    const records = filtered.slice(start, start + LIST_PAGE_SIZE);
    const hasMore = start + LIST_PAGE_SIZE < filtered.length;

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { records, total: filtered.length, hasMore },
      },
    });
  } catch (err: any) {
    logger.error(`get-finance-records error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
