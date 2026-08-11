import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { OrgSettings } from './OrgSettings';
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
  logger.info('get-org-settings called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 1. 用户必须是该组织成员
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const myRole = mine[0].role;

    // 2. 读组织设置（无记录按空处理）
    const col: CloudDBCollection<OrgSettings> = db.collection(OrgSettings);
    const rows = await col.query().equalTo('orgId', orgId).get();
    const s = rows.length > 0 ? rows[0] : null;

    let roleLabels: any = {};
    if (s && s.roleLabels) {
      try { roleLabels = JSON.parse(s.roleLabels); } catch { roleLabels = {}; }
    }

    const configured = !!s && !!s.dingtalkClientId && !!s.dingtalkClientSecret;
    const themeIndex = s ? s.themeIndex : 0;
    const lastSyncAt = s && s.dingtalkLastSyncAt ? s.dingtalkLastSyncAt : null;
    const lastResult = s && s.dingtalkLastResult ? s.dingtalkLastResult : null;

    let dingtalk: any = { configured, lastSyncAt, lastResult };
    // 钉钉凭证仅组织管理员可见
    if (myRole === 'admin') {
      dingtalk.clientId = s ? s.dingtalkClientId : '';
      dingtalk.clientSecret = s ? s.dingtalkClientSecret : '';
    }

    logger.info(`get-org-settings done: orgId=${orgId}, role=${myRole}, configured=${configured}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { orgId, themeIndex, roleLabels, dingtalk },
      },
    });
  } catch (err: any) {
    logger.error(`get-org-settings error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
