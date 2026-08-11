import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
import { UserOrganization } from './UserOrganization';
import { OrganizationRelationship } from './OrganizationRelationship';
import { Member } from './Member';
import { Notice } from './Notice';
import { Project } from './Project';
import { OrgSettings } from './OrgSettings';

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
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

async function deleteWhere(col: any, field: string, value: string, logger: any): Promise<number> {
  let deleted = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo(field, value).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    if (rows.length === 0) break;
    if (page === MAX_PAGES - 1) {
      throw new Error(`数据量超过 ${PAGE_SIZE * MAX_PAGES} 条，请先在 AGC 控制台清理`);
    }
    for (let i = 0; i < rows.length; i += PAGE_SIZE) {
      const batch = rows.slice(i, i + PAGE_SIZE);
      try {
        await col.delete(batch);
      } catch (e: any) {
        // 分批幂等：单批失败不中断整体删除
        logger.error(`delete ${field}=${value} batch failed: ${e.message}`);
      }
    }
    deleted += rows.length;
  }
  return deleted;
}

/// 删除某组织全部数据（两云函数共用逻辑，目录内各保留一份）
async function deleteOrgData(db: any, orgId: string, logger: any): Promise<void> {
  const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
  const memberCol: CloudDBCollection<Member> = db.collection(Member);
  const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
  const projectCol: CloudDBCollection<Project> = db.collection(Project);
  const relCol: CloudDBCollection<OrganizationRelationship> = db.collection(OrganizationRelationship);
  const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
  const settingsCol: CloudDBCollection<OrgSettings> = db.collection(OrgSettings);

  await deleteWhere(uoCol, 'orgId', orgId, logger);
  await deleteWhere(memberCol, 'orgId', orgId, logger);
  await deleteWhere(noticeCol, 'orgId', orgId, logger);
  await deleteWhere(projectCol, 'orgId', orgId, logger);
  await deleteWhere(relCol, 'orgId', orgId, logger);
  await deleteWhere(relCol, 'relatedOrgId', orgId, logger);
  await deleteWhere(settingsCol, 'orgId', orgId, logger);

  // 清理子组织的孤儿 parentOrgId 引用
  const children = await orgCol.query().equalTo('parentOrgId', orgId).limit(PAGE_SIZE).get();
  for (const child of children) {
    child.parentOrgId = '';
    await orgCol.upsert([child]);
  }

  const org = new Organization();
  org.orgId = orgId;
  await orgCol.delete([org]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('delete-org called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 管理员校验：id 是主键（带索引），单次查询
    const membership = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (membership.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (membership[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以注销组织' } });
      return;
    }

    await deleteOrgData(db, orgId, logger);

    // 级联：注销后用户若不再属于任何组织，视为用户数据一并注销
    const remaining = await uoCol.query().equalTo('userId', userId).limit(1).get();
    const userDeregistered = remaining.length === 0;

    logger.info(`delete-org done: orgId=${orgId}, userDeregistered=${userDeregistered}`);
    callback({
      ret: { code: 0, message: 'ok', data: { orgId, userDeregistered } },
    });
  } catch (err: any) {
    logger.error(`delete-org error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
