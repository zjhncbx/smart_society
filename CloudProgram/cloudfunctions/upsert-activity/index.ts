import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Activity } from './Activity';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('upsert-activity called');

  try {
    const record = event.body ? JSON.parse(event.body) : event;
    if (!record || !record.id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }
    if (!record.orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Activity> = db.collection(Activity);
    const obj = Activity.parseFrom(record);
    obj.updatedAt = new Date();
    await col.upsert([obj]);

    logger.info(`upsert-activity done: id=${record.id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`upsert-activity error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
