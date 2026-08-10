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
  logger.info('save-org-settings called');

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

    // 1. 用户必须是该组织成员且为管理员
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以修改设置' } });
      return;
    }

    // 2. 读现有设置，合并字段后保存
    const col: CloudDBCollection<OrgSettings> = db.collection(OrgSettings);
    const rows = await col.query().equalTo('orgId', orgId).get();
    const s = rows.length > 0 ? rows[0] : new OrgSettings();
    s.orgId = orgId;

    if (params.roleLabels !== undefined) {
      if (typeof params.roleLabels === 'string') {
        // 兼容已序列化传入
        try { JSON.parse(params.roleLabels); s.roleLabels = params.roleLabels; } catch { s.roleLabels = '{}'; }
      } else {
        s.roleLabels = JSON.stringify(params.roleLabels || {});
      }
    }
    if (params.dingtalkClientId !== undefined) s.dingtalkClientId = String(params.dingtalkClientId || '');
    if (params.dingtalkClientSecret !== undefined) s.dingtalkClientSecret = String(params.dingtalkClientSecret || '');
    if (params.dingtalkLastSyncAt !== undefined) s.dingtalkLastSyncAt = Number(params.dingtalkLastSyncAt) || 0;
    if (params.dingtalkLastResult !== undefined) s.dingtalkLastResult = String(params.dingtalkLastResult || '');

    await col.upsert([s]);

    logger.info(`save-org-settings done: orgId=${orgId}, userId=${userId}`);
    callback({ ret: { code: 0, message: 'ok', data: { ok: true } } });
  } catch (err: any) {
    logger.error(`save-org-settings error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
