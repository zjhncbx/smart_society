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
  logger.info('set-org-relationship called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const relatedOrgId = params?.relatedOrgId as string;
    const relType = params?.relType as string || 'partner';
    const shareMembers = params?.shareMembers ?? false;
    const shareActivities = params?.shareActivities ?? false;
    const shareNotices = params?.shareNotices ?? false;
    const userId = params?.userId as string;

    if (!orgId || !relatedOrgId) {
      callback({ ret: { code: -1, message: '缺少组织标识' } });
      return;
    }
    if (!['child', 'partner'].includes(relType)) {
      callback({ ret: { code: -1, message: '无效的关系类型' } });
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
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可设置组织关系' } });
      return;
    }
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);

    // 验证两个组织都存在
    const [org1, org2] = await Promise.all([
      orgCol.query().equalTo('orgId', orgId).get(),
      orgCol.query().equalTo('orgId', relatedOrgId).get(),
    ]);
    if (org1.length === 0 || org2.length === 0) {
      callback({ ret: { code: -1, message: '组织不存在' } });
      return;
    }

    const relCol: CloudDBCollection<OrganizationRelationship> = db.collection(OrganizationRelationship);
    const relId = `${orgId}_${relatedOrgId}`;
    const rel = new OrganizationRelationship();
    rel.relId = relId;
    rel.orgId = orgId;
    rel.relatedOrgId = relatedOrgId;
    rel.relType = relType;
    rel.shareMembers = shareMembers;
    rel.shareActivities = shareActivities;
    rel.shareNotices = shareNotices;
    await relCol.upsert([rel]);

    // 如果是父子关系，更新子组织的 parentOrgId
    if (relType === 'child') {
      const child = org2[0];
      child.parentOrgId = orgId;
      await orgCol.upsert([child]);
    }

    logger.info(`set-org-relationship done: ${relId}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`set-org-relationship error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
