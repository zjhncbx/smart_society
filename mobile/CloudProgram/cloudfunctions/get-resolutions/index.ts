import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Resolution } from './Resolution';
import { UserOrganization } from './UserOrganization';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
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
const PAGE_SIZE = 100;

function toJson(r: Resolution): any {
  return {
    id: r.id,
    orgId: r.orgId,
    code: r.code,
    title: r.title,
    content: r.content,
    status: r.status,
    responsibleMemberId: r.responsibleMemberId,
    responsibleName: r.responsibleName,
    deadline: r.deadline ? r.deadline.toISOString() : '',
    meetingId: r.meetingId,
    sourceRuleId: r.sourceRuleId,
    correlationId: r.correlationId,
    createdAt: r.createdAt ? r.createdAt.toISOString() : '',
    createdBy: r.createdBy,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : '',
    updatedBy: r.updatedBy,
  };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-resolutions called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const status = String(params?.status || '');
    const responsibleMemberId = String(params?.responsibleMemberId || '');
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 30));
    const col: CloudDBCollection<Resolution> = db.collection(Resolution);
    let query = col.query().equalTo('orgId', orgId);
    if (status) query = query.equalTo('status', status);
    if (responsibleMemberId) query = query.equalTo('responsibleMemberId', responsibleMemberId);
    const rows = await query.orderByDesc('createdAt').limit(pageSize, page * pageSize).get();
    const total = await query.orderByDesc('createdAt').countQuery('id');

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          resolutions: rows.map(toJson),
          total,
          hasMore: page * pageSize + rows.length < total,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-resolutions error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
