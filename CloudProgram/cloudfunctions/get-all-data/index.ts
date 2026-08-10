import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';
import { Project } from './Project';
import { Notice } from './Notice';

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
  logger.info('get-all-data called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });

    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const projectCol: CloudDBCollection<Project> = db.collection(Project);
    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);

    const [memberRes, projectRes, noticeRes] = await Promise.all([
      memberCol.query().equalTo('orgId', orgId).get(),
      projectCol.query().equalTo('orgId', orgId).get(),
      noticeCol.query().equalTo('orgId', orgId).get(),
    ]);

    logger.info(`get-all-data done: members=${memberRes.length}, projects=${projectRes.length}, notices=${noticeRes.length}`);

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          Member: memberRes,
          Project: projectRes,
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
