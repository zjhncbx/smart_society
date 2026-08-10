import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Notice } from './Notice';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('upsert-notice called');

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
    const col: CloudDBCollection<Notice> = db.collection(Notice);
    const obj = Notice.parseFrom(record);
    obj.updatedAt = new Date();
    await col.upsert([obj]);

    logger.info(`upsert-notice done: id=${record.id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`upsert-notice error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
