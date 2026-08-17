import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { WorkItem } from './WorkItem';
import { UserOrganization } from './UserOrganization';

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
const PAGE_SIZE = 100;

function toJson(item: WorkItem): any {
  return {
    id: item.id,
    orgId: item.orgId,
    code: item.code,
    workItemType: item.workItemType,
    originType: item.originType,
    originId: item.originId,
    originName: item.originName,
    title: item.title,
    description: item.description,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    priority: item.priority,
    status: item.status,
    deadline: item.deadline ? item.deadline.toISOString() : '',
    slaDeadline: item.slaDeadline ? item.slaDeadline.toISOString() : '',
    escalationLevel: item.escalationLevel,
    completionCondition: item.completionCondition,
    sourceRuleId: item.sourceRuleId,
    sourceRuleName: item.sourceRuleName,
    version: item.version,
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    createdAt: item.createdAt ? item.createdAt.toISOString() : '',
    createdBy: item.createdBy,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : '',
    updatedBy: item.updatedBy,
  };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-work-items called');

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

    const workItemType = String(params?.workItemType || '');
    const status = String(params?.status || '');
    const ownerId = String(params?.ownerId || '');
    const onlyMine = params?.onlyMine === true;
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 30));

    const col: CloudDBCollection<WorkItem> = db.collection(WorkItem);
    let query = col.query().equalTo('orgId', orgId);
    if (workItemType) query = query.equalTo('workItemType', workItemType);
    if (status) query = query.equalTo('status', status);
    if (ownerId) query = query.equalTo('ownerId', ownerId);
    const rows = await query.orderByDesc('updatedAt').limit(pageSize, page * pageSize).get();
    const total = await query.orderByDesc('updatedAt').countQuery('id');

    let items = rows.map(toJson);
    if (onlyMine) {
      const myMemberId = String(mine[0].memberId || '');
      items = items.filter((it: any) =>
        it.ownerId === userId || (myMemberId && it.ownerId === myMemberId),
      );
    }

    const counts = await col.query().equalTo('orgId', orgId).equalTo('status', 'open').countQuery('id');
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          items,
          total,
          openCount: counts,
          hasMore: page * pageSize + rows.length < total,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-work-items error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
