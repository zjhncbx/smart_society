import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('upsert-member called');

  try {
    const record = event.body ? JSON.parse(event.body) : event;
    if (!record || !record.id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Member> = db.collection(Member);
    const obj = Member.parseFrom(record);
    await col.upsert([obj]);

    logger.info(`upsert-member done: id=${record.id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`upsert-member error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
