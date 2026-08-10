import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';
import { Activity } from './Activity';
import { Notice } from './Notice';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-all-data called');

  try {
    const db = cloud.database({ zoneName: ZONE_NAME });

    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const activityCol: CloudDBCollection<Activity> = db.collection(Activity);
    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);

    const [memberRes, activityRes, noticeRes] = await Promise.all([
      memberCol.query().get(),
      activityCol.query().get(),
      noticeCol.query().get(),
    ]);

    logger.info(`get-all-data done: members=${memberRes.length}, activities=${activityRes.length}, notices=${noticeRes.length}`);

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          Member: memberRes,
          Activity: activityRes,
          Notice: noticeRes,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-all-data error: ${err.message}`);
    callback({
      ret: { code: -1, message: err.message },
    });
  }
};

export { myHandler };
