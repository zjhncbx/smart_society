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
  logger.info('get-my-orgs called');

  try {
    const params = parseParams(event);
    const userId = params?.userId as string;

    if (!userId) {
      callback({ ret: { code: -1, message: '缺少用户标识' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const memberships = await uoCol.query().equalTo('userId', userId).get();

    if (memberships.length === 0) {
      callback({ ret: { code: 0, message: 'ok', data: [] } });
      return;
    }

    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
    const orgs: Record<string, any>[] = [];
    for (const m of memberships) {
      const orgList = await orgCol.query().equalTo('orgId', m.orgId).get();
      if (orgList.length > 0) {
        orgs.push({
          ...orgList[0],
          userRole: m.role,
          joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
        });
      }
    }

    logger.info(`get-my-orgs done: userId=${userId}, count=${orgs.length}`);
    callback({ ret: { code: 0, message: 'ok', data: orgs } });
  } catch (err: any) {
    logger.error(`get-my-orgs error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
