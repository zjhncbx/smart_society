import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
import { OrganizationRelationship } from './OrganizationRelationship';
import { UserOrganization } from './UserOrganization';

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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-org-hierarchy called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');

    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
    const relCol: CloudDBCollection<OrganizationRelationship> = db.collection(OrganizationRelationship);

    const [orgList, relList] = await Promise.all([
      orgCol.query().get(),
      relCol.query().get(),
    ]);

    // 构建关系图
    const children = relList.filter((r: any) => r.orgId === orgId && r.relType === 'child');
    const partners = relList.filter((r: any) => r.orgId === orgId && r.relType === 'partner');
    const parents = relList.filter((r: any) => r.relatedOrgId === orgId && r.relType === 'child');

    const findOrg = (id: string) => orgList.find((o: any) => o.orgId === id);

    const result: any = {};
    const currentOrg = findOrg(orgId);
    if (currentOrg) result.org = currentOrg;
    if (parents.length > 0) result.parents = parents.map((r: any) => findOrg(r.orgId)).filter(Boolean);
    result.children = children.map((r: any) => ({ org: findOrg(r.relatedOrgId), shareMembers: r.shareMembers, shareActivities: r.shareActivities, shareNotices: r.shareNotices })).filter((x: any) => x.org);
    result.partners = partners.map((r: any) => ({ org: findOrg(r.relatedOrgId), shareMembers: r.shareMembers, shareActivities: r.shareActivities, shareNotices: r.shareNotices })).filter((x: any) => x.org);

    logger.info(`get-org-hierarchy done: orgId=${orgId}`);
    callback({ ret: { code: 0, message: 'ok', data: result } });
  } catch (err: any) {
    logger.error(`get-org-hierarchy error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
