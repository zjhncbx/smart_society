import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('delete-member called');

  try {
    const params = event.body ? JSON.parse(event.body) : event;
    const id = params?.id;
    if (!id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<Member> = db.collection(Member);
    // 构建仅含主键的对象用于删除
    const obj = new Member();
    obj.id = id;
    await col.delete([obj]);

    logger.info(`delete-member done: id=${id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`delete-member error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
