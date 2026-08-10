import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Activity } from './Activity';

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
  logger.info('delete-activity called');

  try {
    const params = parseParams(event);
    const id = params?.id;
    const orgId = params?.orgId;
    if (!id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Activity> = db.collection(Activity);
    const obj = new Activity();
    obj.id = id;
    obj.orgId = orgId;
    await col.delete([obj]);

    logger.info(`delete-activity done: id=${id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`delete-activity error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
