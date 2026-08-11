import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
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
  logger.info('join-org called');

  try {
    const params = parseParams(event);
    const userId = params?.userId as string;
    const orgId = params?.orgId as string;

    if (!userId) {
      callback({ ret: { code: -1, message: '缺少用户标识' } });
      return;
    }
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少组织标识' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });

    // 检查组织是否存在
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
    const orgList = await orgCol.query().equalTo('orgId', orgId).get();
    if (orgList.length === 0) {
      callback({ ret: { code: -1, message: '组织不存在' } });
      return;
    }

    // 检查用户是否已加入
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const existing = await uoCol.query().equalTo('userId', userId).equalTo('orgId', orgId).get();
    if (existing.length > 0) {
      callback({ ret: { code: -1, message: '您已是该组织成员' } });
      return;
    }

    const uo = new UserOrganization();
    uo.id = `${orgId}_${userId}`;
    uo.userId = userId;
    uo.orgId = orgId;
    uo.role = 'member';
    uo.joinedAt = new Date();
    await uoCol.upsert([uo]);

    logger.info(`join-org done: userId=${userId}, orgId=${orgId}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`join-org error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
