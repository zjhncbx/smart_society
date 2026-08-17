import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { DataQualityIssue } from './DataQualityIssue';
import { DataQualitySnapshot } from './DataQualitySnapshot';
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-data-quality called');

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

    const snapshotCol: CloudDBCollection<DataQualitySnapshot> = db.collection(DataQualitySnapshot);
    const snapshots = await snapshotCol.query().equalTo('id', `dq_${orgId}`).get();
    const snapshot = snapshots.length > 0 ? snapshots[0] : null;

    const category = String(params?.category || '');
    const status = String(params?.status || '');
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 50));

    const issueCol: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
    let query = issueCol.query().equalTo('orgId', orgId);
    if (category) query = query.equalTo('category', category);
    if (status) {
      query = query.equalTo('status', status);
    } else {
      query = query.orderByDesc('createdAt');
    }
    const rows = await query.limit(pageSize, page * pageSize).get();
    const issues = rows.map((i) => ({
      id: i.id,
      orgId: i.orgId,
      ruleId: i.ruleId,
      ruleName: i.ruleName,
      category: i.category,
      entityType: i.entityType,
      entityId: i.entityId,
      entityName: i.entityName,
      severity: i.severity,
      description: i.description,
      detail: i.detail,
      status: i.status,
      assignedTo: i.assignedTo,
      assignedToName: i.assignedToName,
      checkCount: i.checkCount,
      lastCheckedAt: i.lastCheckedAt ? i.lastCheckedAt.toISOString() : '',
      resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : '',
      resolvedBy: i.resolvedBy,
      resolvedByName: i.resolvedByName,
      createdAt: i.createdAt ? i.createdAt.toISOString() : '',
      updatedAt: i.updatedAt ? i.updatedAt.toISOString() : '',
    }));
    const total = await issueCol.query().equalTo('orgId', orgId).countQuery('id');
    const openTotal = await issueCol.query().equalTo('orgId', orgId).equalTo('status', 'open').countQuery('id');

    let dimensions: Record<string, number> = {};
    let counts: Record<string, any> = {};
    let score = 100;
    let checkedAt = '';
    let issueCount = 0;
    if (snapshot) {
      try {
        dimensions = JSON.parse(snapshot.dimensions || '{}');
      } catch { dimensions = {}; }
      try {
        counts = JSON.parse(snapshot.counts || '{}');
      } catch { counts = {}; }
      score = snapshot.score;
      checkedAt = snapshot.checkedAt ? snapshot.checkedAt.toISOString() : '';
      issueCount = snapshot.issueCount;
    }

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          snapshot: {
            score,
            dimensions,
            counts,
            checkedAt,
            ruleCount: snapshot ? snapshot.ruleCount : 0,
            issueCount,
          },
          issues,
          total,
          openTotal,
          hasMore: page * pageSize + rows.length < total,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-data-quality error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
