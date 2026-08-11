import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
import { UserOrganization } from './UserOrganization';
import { OrganizationRelationship } from './OrganizationRelationship';
import { Member } from './Member';
import { Notice } from './Notice';
import { Project } from './Project';
import { OrgSettings } from './OrgSettings';
import { UserSettings } from './UserSettings';
import { AppUser } from './AppUser';

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
  logger.info('delete-user called');

  try {
    const params = parseParams(event);
    const userId = params?.userId as string;
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 删除用户级设置（用户数据）
    const usCol: CloudDBCollection<UserSettings> = db.collection(UserSettings);
    const us = new UserSettings();
    us.userId = userId;
    await usCol.delete([us]);

    // 手机号/邮箱注册的账号一并注销
    const appUserCol: CloudDBCollection<AppUser> = db.collection(AppUser);
    const appUsers = await appUserCol.query().equalTo('id', userId).get();
    if (appUsers.length > 0) {
      await appUserCol.delete([appUsers[0]]);
    }

    const memberships = await uoCol.query().equalTo('userId', userId).limit(500).get();

    let membershipsDeleted = 0;
    let orgsDeleted = 0;
    for (const m of memberships) {
      // 先计数再删自己的成员行：唯一账号的组织跟随注销
      const count = await uoCol.query().equalTo('orgId', m.orgId).limit(2).get();
      if (count.length === 1) {
        await deleteOrgData(db, m.orgId, logger);
        orgsDeleted++;
      } else {
        const uo = new UserOrganization();
        uo.id = m.id;
        await uoCol.delete([uo]);
        membershipsDeleted++;
      }
    }

    logger.info(`delete-user done: userId=${userId}, membershipsDeleted=${membershipsDeleted}, orgsDeleted=${orgsDeleted}`);
    callback({
      ret: { code: 0, message: 'ok', data: { membershipsDeleted, orgsDeleted } },
    });
  } catch (err: any) {
    logger.error(`delete-user error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
