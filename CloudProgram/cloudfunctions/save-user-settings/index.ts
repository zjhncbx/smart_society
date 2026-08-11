import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { UserSettings } from './UserSettings';

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
  logger.info('save-user-settings called');

  try {
    const params = parseParams(event);
    const userId = params?.userId as string;
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<UserSettings> = db.collection(UserSettings);
    const rows = await col.query().equalTo('userId', userId).get();
    const s = rows.length > 0 ? rows[0] : new UserSettings();
    s.userId = userId;

    if (params.nickname !== undefined) s.nickname = String(params.nickname || '');
    if (params.darkMode !== undefined) s.darkMode = params.darkMode === true;

    await col.upsert([s]);

    logger.info(`save-user-settings done: userId=${userId}`);
    callback({ ret: { code: 0, message: 'ok', data: { ok: true } } });
  } catch (err: any) {
    logger.error(`save-user-settings error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
