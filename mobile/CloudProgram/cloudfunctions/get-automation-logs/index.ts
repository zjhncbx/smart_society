import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AutomationRunLog } from './AutomationRunLog';
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

function toLogJson(l: AutomationRunLog): any {
  let actions: any = {};
  try {
    actions = JSON.parse(l.actions || '{}');
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) actions = {};
  } catch {
    actions = {};
  }
  return {
    id: l.id,
    orgId: l.orgId,
    ruleId: l.ruleId,
    ruleName: l.ruleName,
    status: l.status,
    actions,
    runBy: l.runBy,
    runAt: l.runAt ? l.runAt.toISOString() : '',
    durationMs: l.durationMs,
    errorMessage: l.errorMessage || '',
  };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-automation-logs called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.max(1, Math.min(Number(params?.pageSize) || 20, 100));
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    // 成员校验：非本组织成员拒绝
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    // AutomationRunLog 按 orgId 分页、runAt 倒序
    const logCol: CloudDBCollection<AutomationRunLog> = db.collection(AutomationRunLog);
    const query = logCol.query().equalTo('orgId', orgId);
    const total = await query.orderByDesc('runAt').countQuery('id');
    const rows = await query.orderByDesc('runAt').limit(pageSize, page * pageSize).get();
    const logs = rows.map(toLogJson);

    logger.info(`get-automation-logs done: orgId=${orgId}, total=${total}, page=${page}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { logs, total, page, pageSize, hasMore: (page + 1) * pageSize < total },
      },
    });
  } catch (err: any) {
    logger.error(`get-automation-logs error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
