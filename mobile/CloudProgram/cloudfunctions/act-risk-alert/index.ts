import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { RiskAlert } from './RiskAlert';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';

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
  logger.info('act-risk-alert called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const id = params?.id as string;
    const action = String(params?.action || 'resolve');
    const note = String(params?.note || '');
    if (!orgId || !userId || !id) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/id 参数' } });
      return;
    }
    if (!['resolve', 'ack', 'reopen'].includes(action)) {
      callback({ ret: { code: -1, message: 'action 不合法' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const col: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '风险/预警不存在' } });
      return;
    }
    const risk = rows[0];
    if (risk.orgId !== orgId) {
      callback({ ret: { code: -1, message: '风险/预警不属于该组织' } });
      return;
    }

    const now = new Date();
    if (action === 'resolve') {
      risk.status = 'resolved';
      risk.resolvedAt = now;
      risk.resolvedBy = userId;
      risk.resolvedByName = userName;
    } else if (action === 'ack') {
      risk.status = 'monitoring';
    } else {
      risk.status = 'open';
      risk.resolvedAt = null;
      risk.resolvedBy = '';
      risk.resolvedByName = '';
    }
    if (note) {
      try {
        const metadata = JSON.parse(risk.metadata || '{}');
        metadata.lastNote = note;
        metadata.lastNoteBy = userName;
        metadata.lastNoteAt = now.toISOString();
        risk.metadata = JSON.stringify(metadata);
      } catch {
        risk.metadata = JSON.stringify({ lastNote: note, lastNoteBy: userName, lastNoteAt: now.toISOString() });
      }
    }
    risk.updatedAt = now;
    await col.upsert([risk]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = action === 'resolve' ? 'resolved' : 'updated';
    ev.entityType = 'risk';
    ev.entityId = risk.id;
    ev.entityName = risk.title;
    ev.actorId = userId;
    ev.actorName = userName;
    ev.level = 'info';
    ev.metadata = JSON.stringify({ action, note, sourceRuleId: risk.sourceRuleId });
    ev.sourceType = 'manual';
    ev.sourceId = '';
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;
    await eventCol.upsert([ev]);

    logger.info(`act-risk-alert done: id=${id}, action=${action}`);
    callback({
      ret: { code: 0, message: 'ok', data: { id: risk.id, status: risk.status } },
    });
  } catch (err: any) {
    logger.error(`act-risk-alert error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
