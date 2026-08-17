import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { Notice } from './Notice';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';

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
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

async function recordEvent(
  col: CloudDBCollection<BusinessEvent>,
  orgId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  metadata: any,
): Promise<void> {
  const now = new Date();
  const ev = new BusinessEvent();
  ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
  ev.orgId = orgId;
  ev.eventType = eventType;
  ev.entityType = entityType;
  ev.entityId = entityId;
  ev.entityName = entityName || '';
  ev.actorId = actorId || 'system';
  ev.actorName = actorName || '系统';
  ev.level = 'warning';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('unclose-period called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = (params?.userName as string) || '管理员';
    const year = String(params?.year || '');
    if (!orgId || !userId || !/^\d{4}$/.test(year)) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/year 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以反结账' } });
      return;
    }

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const rows = await queryAllByOrg(recordCol, orgId);
    const closing = rows.filter((r) => r.type === 'closing' && r.period === year);
    if (closing.length === 0) {
      callback({ ret: { code: -1, message: `${year} 年度尚未结账` } });
      return;
    }
    await recordCol.delete(closing);

    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
    const notice = new Notice();
    notice.id = 'fn' + Date.now() + Math.floor(Math.random() * 1000);
    notice.orgId = orgId;
    notice.title = `【财务】${year} 年度已反结账`;
    notice.content = `${userName} 已撤销 ${year} 年度期末结账，可继续录入该年度凭证。`;
    notice.publisher = '财务结账';
    notice.publishTime = new Date();
    notice.isRead = false;
    notice.isImportant = true;
    notice.updatedAt = new Date();
    await noticeCol.upsert([notice]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'updated', 'finance', `unclose-${year}`, `${year} 年度反结账`,
      userId, userName,
      { year, removed: closing.length },
    );

    logger.info(`unclose-period done: orgId=${orgId}, year=${year}, vouchers=${closing.length}`);
    callback({
      ret: { code: 0, message: 'ok', data: { removed: closing.length } },
    });
  } catch (err: any) {
    logger.error(`unclose-period error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
