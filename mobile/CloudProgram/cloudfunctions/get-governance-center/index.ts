import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AutoTask } from './AutoTask';
import { RiskAlert } from './RiskAlert';
import { AutomationRunLog } from './AutomationRunLog';
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

function toTaskJson(t: AutoTask): any {
  return {
    id: t.id,
    orgId: t.orgId,
    title: t.title,
    description: t.description,
    sourceType: t.sourceType,
    sourceRuleId: t.sourceRuleId,
    sourceRuleName: t.sourceRuleName,
    sourceEntityType: t.sourceEntityType,
    sourceEntityId: t.sourceEntityId,
    sourceEntityName: t.sourceEntityName,
    correlationId: t.correlationId,
    triggerEventId: t.triggerEventId,
    assigneeId: t.assigneeId,
    assigneeName: t.assigneeName,
    priority: t.priority,
    status: t.status,
    slaDeadline: t.slaDeadline ? t.slaDeadline.toISOString() : '',
    escalationLevel: t.escalationLevel,
    escalatedAt: t.escalatedAt ? t.escalatedAt.toISOString() : '',
    completedAt: t.completedAt ? t.completedAt.toISOString() : '',
    completedBy: t.completedBy,
    completedByName: t.completedByName,
    createdAt: t.createdAt ? t.createdAt.toISOString() : '',
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : '',
  };
}

function toRiskJson(r: RiskAlert): any {
  return {
    id: r.id,
    orgId: r.orgId,
    kind: r.kind,
    title: r.title,
    description: r.description,
    sourceRuleId: r.sourceRuleId,
    sourceRuleName: r.sourceRuleName,
    sourceEntityType: r.sourceEntityType,
    sourceEntityId: r.sourceEntityId,
    sourceEntityName: r.sourceEntityName,
    triggerEventId: r.triggerEventId,
    severity: r.severity,
    status: r.status,
    ownerId: r.ownerId,
    ownerName: r.ownerName,
    deadline: r.deadline ? r.deadline.toISOString() : '',
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : '',
    resolvedBy: r.resolvedBy,
    resolvedByName: r.resolvedByName,
    metadata: r.metadata,
    correlationId: r.correlationId,
    createdAt: r.createdAt ? r.createdAt.toISOString() : '',
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : '',
  };
}

function toLogJson(l: AutomationRunLog): any {
  return {
    id: l.id,
    orgId: l.orgId,
    ruleId: l.ruleId,
    ruleName: l.ruleName,
    triggerEventType: l.triggerEventType,
    status: l.status,
    actions: l.actions,
    runBy: l.runBy,
    runAt: l.runAt ? l.runAt.toISOString() : '',
    durationMs: l.durationMs,
    errorMessage: l.errorMessage,
    metadata: l.metadata,
  };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-governance-center called');

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

    const taskCol: CloudDBCollection<AutoTask> = db.collection(AutoTask);
    const riskCol: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
    const logCol: CloudDBCollection<AutomationRunLog> = db.collection(AutomationRunLog);

    const openTasks = await taskCol.query().equalTo('orgId', orgId).equalTo('status', 'open').orderByDesc('createdAt').limit(200).get();
    const recentTasks = await taskCol.query().equalTo('orgId', orgId).equalTo('status', 'done').orderByDesc('completedAt').limit(30).get();
    const openRisks = await riskCol.query().equalTo('orgId', orgId).equalTo('status', 'open').orderByDesc('createdAt').limit(200).get();
    const resolvedRisks = await riskCol.query().equalTo('orgId', orgId).equalTo('status', 'resolved').orderByDesc('resolvedAt').limit(30).get();
    const logs = await logCol.query().equalTo('orgId', orgId).orderByDesc('runAt').limit(20).get();

    const riskCount = openRisks.filter((r) => r.kind === 'risk').length;
    const warningCount = openRisks.filter((r) => r.kind === 'warning').length;

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          tasks: {
            open: openTasks.map(toTaskJson),
            recent: recentTasks.map(toTaskJson),
            openCount: openTasks.length,
          },
          risks: {
            open: openRisks.map(toRiskJson),
            resolved: resolvedRisks.map(toRiskJson),
            riskCount,
            warningCount,
          },
          logs: logs.map(toLogJson),
          counts: {
            openTasks: openTasks.length,
            riskCount,
            warningCount,
          },
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-governance-center error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
