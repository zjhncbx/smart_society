import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Activity } from './Activity';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('delete-activity called');

  try {
    const params = event.body ? JSON.parse(event.body) : event;
    const id = params?.id;
    if (!id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Activity> = db.collection(Activity);
    const obj = new Activity();
    obj.id = id;
    await col.delete([obj]);

    logger.info(`delete-activity done: id=${id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`delete-activity error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
