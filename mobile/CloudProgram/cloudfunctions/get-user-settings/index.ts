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
  logger.info('get-user-settings called');

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
    const s = rows.length > 0 ? rows[0] : null;

    logger.info(`get-user-settings done: userId=${userId}, exists=${!!s}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          nickname: s && s.nickname ? s.nickname : null,
          darkMode: s ? s.darkMode : null,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-user-settings error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
