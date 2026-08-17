import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Plugin } from 'vite';

/**
 * 开发态 Mock API：按统一 { ret } 契约返回真实业务形状的数据，
 * 供 W1 页面在未接入 AGC 网关前本地开发验证。
 * 生产环境不加载（apply: 'serve'）。
 */

interface MockWorkItem {
  id: string;
  orgId: string;
  workItemType: string;
  originType: string;
  originId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'done' | 'cancelled';
  deadline: string;
  slaDeadline: string;
  escalationLevel: number;
  completionCondition: string;
  sourceRuleId: string;
  sourceRuleName: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

const now = Date.now();
const iso = (offsetMs: number): string => new Date(now + offsetMs).toISOString();

const workItems: MockWorkItem[] = [
  {
    id: 'wi_demo_approval_1',
    orgId: 'org_demo',
    workItemType: 'approval',
    originType: 'approval',
    originId: 'ai_demo_1',
    title: '审批：购置办公设备费用报销',
    description: '流程「费用报销」待处理，当前节点：财务负责人审批',
    ownerId: '',
    ownerName: '当前节点处理人',
    priority: 'medium',
    status: 'open',
    deadline: iso(2 * 86400000),
    slaDeadline: iso(2 * 86400000),
    escalationLevel: 0,
    completionCondition: '流程审批通过',
    sourceRuleId: 'WF-approval',
    sourceRuleName: '审批流程',
    correlationId: 'c_demo_approval_1',
    createdAt: iso(-3600000),
    updatedAt: iso(-3600000),
  },
  {
    id: 'wi_demo_auto_1',
    orgId: 'org_demo',
    workItemType: 'auto_task',
    originType: 'auto_task',
    originId: 'at_demo_1',
    title: '任务逾期：完成项目章程评审',
    description: '项目「组织数字画像」的任务已逾期 5 天，请及时处理。',
    ownerId: 'm_demo_1',
    ownerName: '张三',
    priority: 'high',
    status: 'open',
    deadline: iso(-5 * 86400000),
    slaDeadline: iso(-2 * 86400000),
    escalationLevel: 1,
    completionCondition: '任务完成并通过来源规则校验',
    sourceRuleId: 'GR-01',
    sourceRuleName: '任务逾期自动升级',
    correlationId: 'c_demo_auto_1',
    createdAt: iso(-6 * 86400000),
    updatedAt: iso(-86400000),
  },
  {
    id: 'wi_demo_project_1',
    orgId: 'org_demo',
    workItemType: 'project_task',
    originType: 'project_task',
    originId: 'p_demo_1:t_demo_1',
    title: '整理年度会员数据',
    description: '项目「会员数据治理」任务待处理',
    ownerId: 'm_demo_2',
    ownerName: '李四',
    priority: 'medium',
    status: 'open',
    deadline: iso(3 * 86400000),
    slaDeadline: iso(3 * 86400000),
    escalationLevel: 0,
    completionCondition: '任务完成',
    sourceRuleId: 'project',
    sourceRuleName: '项目任务',
    correlationId: 'c_demo_project_1',
    createdAt: iso(-2 * 86400000),
    updatedAt: iso(-2 * 86400000),
  },
  {
    id: 'wi_demo_risk_1',
    orgId: 'org_demo',
    workItemType: 'risk',
    originType: 'risk',
    originId: 'ra_demo_1',
    title: '项目「会员数据治理」任务严重逾期',
    description: '任务已逾期 16 天，超过 14 天升级为风险，需管理层介入。',
    ownerId: 'm_demo_2',
    ownerName: '李四',
    priority: 'high',
    status: 'open',
    deadline: iso(3 * 86400000),
    slaDeadline: iso(3 * 86400000),
    escalationLevel: 0,
    completionCondition: '风险处置完成并经规则校验',
    sourceRuleId: 'GR-01',
    sourceRuleName: '任务逾期自动升级',
    correlationId: 'c_demo_risk_1',
    createdAt: iso(-86400000),
    updatedAt: iso(-3600000),
  },
  {
    id: 'wi_demo_dq_1',
    orgId: 'org_demo',
    workItemType: 'data_quality',
    originType: 'data_quality',
    originId: 'dq_demo_1',
    title: '修复数据问题：成员必填缺失',
    description: '成员必填缺失：8 名会员缺少有效联系方式',
    ownerId: '',
    ownerName: '秘书处',
    priority: 'medium',
    status: 'open',
    deadline: '',
    slaDeadline: iso(7 * 86400000),
    escalationLevel: 0,
    completionCondition: '问题修复并通过数据质量校验',
    sourceRuleId: 'DQ-001',
    sourceRuleName: '成员必填缺失',
    correlationId: 'c_demo_dq_1',
    createdAt: iso(-3 * 86400000),
    updatedAt: iso(-3 * 86400000),
  },
];

interface MockRisk {
  id: string;
  orgId: string;
  kind: 'risk' | 'warning';
  title: string;
  description: string;
  sourceRuleId: string;
  sourceRuleName: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceEntityName: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'monitoring' | 'resolved';
  ownerId: string;
  ownerName: string;
  deadline: string;
  correlationId: string;
  createdAt: string;
}

const risks: MockRisk[] = [
  {
    id: 'ra_demo_1',
    orgId: 'org_demo',
    kind: 'risk',
    title: '项目「会员数据治理」任务严重逾期',
    description: '任务已逾期 16 天，需管理层介入并安排资源。',
    sourceRuleId: 'GR-01',
    sourceRuleName: '任务逾期自动升级',
    sourceEntityType: 'task',
    sourceEntityId: 'p_demo_1:t_demo_1',
    sourceEntityName: '整理年度会员数据',
    severity: 'high',
    status: 'open',
    ownerId: 'm_demo_2',
    ownerName: '李四',
    deadline: iso(3 * 86400000),
    correlationId: 'c_demo_risk_1',
    createdAt: iso(-86400000),
  },
  {
    id: 'ra_demo_2',
    orgId: 'org_demo',
    kind: 'warning',
    title: '项目「组织数字画像」进度落后',
    description: '项目已执行 72% 时间，完成率仅 35%，预计延期。',
    sourceRuleId: 'GR-02',
    sourceRuleName: '项目进度偏差',
    sourceEntityType: 'project',
    sourceEntityId: 'p_demo_2',
    sourceEntityName: '组织数字画像',
    severity: 'medium',
    status: 'open',
    ownerId: 'm_demo_1',
    ownerName: '张三',
    deadline: iso(7 * 86400000),
    correlationId: 'c_demo_warning_1',
    createdAt: iso(-2 * 86400000),
  },
  {
    id: 'ra_demo_3',
    orgId: 'org_demo',
    kind: 'warning',
    title: '审批阻塞：购置办公设备费用报销',
    description: '流程「费用报销」已停留 4 天未处理，请尽快处理。',
    sourceRuleId: 'GR-03',
    sourceRuleName: '审批SLA超时',
    sourceEntityType: 'approval',
    sourceEntityId: 'ai_demo_1',
    sourceEntityName: '购置办公设备费用报销',
    severity: 'medium',
    status: 'open',
    ownerId: '',
    ownerName: '当前节点处理人',
    deadline: iso(5 * 86400000),
    correlationId: 'c_demo_approval_1',
    createdAt: iso(-4 * 86400000),
  },
];

interface MockIssue {
  id: string;
  orgId: string;
  ruleId: string;
  ruleName: string;
  category: string;
  entityName: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved' | 'ignored';
  description: string;
  checkCount: number;
  createdAt: string;
}

const issues: MockIssue[] = [
  {
    id: 'dq_demo_1',
    orgId: 'org_demo',
    ruleId: 'DQ-001',
    ruleName: '成员必填缺失',
    category: 'member',
    entityName: '8 名会员',
    severity: 'medium',
    status: 'open',
    description: '缺少有效联系方式（手机/邮箱）',
    checkCount: 3,
    createdAt: iso(-3 * 86400000),
  },
  {
    id: 'dq_demo_2',
    orgId: 'org_demo',
    ruleId: 'DQ-007',
    ruleName: '任务逾期未完成',
    category: 'project',
    entityName: '整理年度会员数据',
    severity: 'medium',
    status: 'open',
    description: '任务逾期：2026-08-10',
    checkCount: 2,
    createdAt: iso(-2 * 86400000),
  },
  {
    id: 'dq_demo_3',
    orgId: 'org_demo',
    ruleId: 'DQ-010',
    ruleName: '预算执行异常',
    category: 'finance',
    entityName: '会员数据治理',
    severity: 'medium',
    status: 'open',
    description: '项目支出已超过预算 8%',
    checkCount: 1,
    createdAt: iso(-86400000),
  },
];

const snapshot = {
  score: 86,
  dimensions: { member: 92, project: 88, finance: 84, org: 100 },
  counts: { open: 3, resolved: 12, total: 15 },
  checkedAt: iso(-3600000),
};

const automationLogs = [
  {
    id: 'arl_demo_1',
    ruleId: 'GR-ALL',
    ruleName: '规则引擎批量运行',
    status: 'success',
    actions: { taskCreated: 1, riskCreated: 2, taskAutoClosed: 0, riskAutoResolved: 0 },
    runBy: '管理员',
    runAt: iso(-3600000),
    durationMs: 812,
    correlationId: 'c_demo_run_1',
  },
  {
    id: 'arl_demo_2',
    ruleId: 'GR-ALL',
    ruleName: '规则引擎批量运行',
    status: 'success',
    actions: { taskCreated: 0, riskCreated: 1, taskAutoClosed: 2, riskAutoResolved: 1 },
    runBy: '系统',
    runAt: iso(-86400000),
    durationMs: 654,
    correlationId: 'c_demo_run_2',
  },
];

const auditLogs = [
  {
    id: 'al_demo_1',
    orgId: 'org_demo',
    action: 'submit',
    entityType: 'finance',
    entityId: 'f_demo_1',
    entityName: '购置办公设备费用报销',
    actorId: 'u_demo_1',
    actorName: '张三',
    before: 'null',
    after: '{}',
    changeReason: '',
    correlationId: 'c_demo_approval_1',
    createdAt: iso(-3600000),
  },
  {
    id: 'al_demo_2',
    orgId: 'org_demo',
    action: 'update',
    entityType: 'project',
    entityId: 'p_demo_1',
    entityName: '会员数据治理',
    actorId: 'u_demo_1',
    actorName: '张三',
    before: '{"progress":30}',
    after: '{"progress":40}',
    changeReason: '进度更新',
    correlationId: 'c_demo_project_1',
    createdAt: iso(-2 * 3600000),
  },
  {
    id: 'al_demo_3',
    orgId: 'org_demo',
    action: 'run',
    entityType: 'automation',
    entityId: 'arl_demo_1',
    entityName: '规则引擎批量运行',
    actorId: 'system',
    actorName: '自动化规则',
    before: 'null',
    after: '{}',
    changeReason: '',
    correlationId: 'c_demo_run_1',
    createdAt: iso(-3600000),
  },
];

const events = [
  {
    id: 'ev_demo_1',
    orgId: 'org_demo',
    eventType: 'submitted',
    entityType: 'finance',
    entityId: 'f_demo_1',
    entityName: '购置办公设备费用报销',
    actorId: 'u_demo_1',
    actorName: '张三',
    level: 'info',
    correlationId: 'c_demo_approval_1',
    occurredAt: iso(-3600000),
  },
  {
    id: 'ev_demo_2',
    orgId: 'org_demo',
    eventType: 'notified',
    entityType: 'risk',
    entityId: 'ra_demo_1',
    entityName: '项目「会员数据治理」任务严重逾期',
    actorId: 'system',
    actorName: '自动化规则',
    level: 'risk',
    correlationId: 'c_demo_risk_1',
    occurredAt: iso(-86400000),
  },
  {
    id: 'ev_demo_3',
    orgId: 'org_demo',
    eventType: 'status_changed',
    entityType: 'task',
    entityId: 'p_demo_1:t_demo_2',
    entityName: '整理年度会员数据',
    actorId: 'u_demo_2',
    actorName: '李四',
    level: 'info',
    correlationId: 'c_demo_project_1',
    occurredAt: iso(-2 * 3600000),
  },
];

function json(res: ServerResponse, data: unknown, code = 0, message = 'ok'): void {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ret: { code, message, data } }));
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function posture() {
  const openItems = workItems.filter((w) => w.status === 'open');
  const openRisks = risks.filter((r) => r.status === 'open');
  const riskCount = openRisks.filter((r) => r.kind === 'risk').length;
  const warningCount = openRisks.filter((r) => r.kind === 'warning').length;
  const dqOpen = issues.filter((i) => i.status === 'open').length;
  const escalated = openItems.filter((w) => w.escalationLevel > 0).length;
  return {
    status: riskCount > 0 ? '需介入' : warningCount > 0 || dqOpen > 0 ? '关注' : '正常',
    pendingCount: openItems.length,
    riskCount,
    warningCount,
    dqOpenCount: dqOpen,
    escalatedCount: escalated,
    topConcerns: [
      ...openRisks
        .filter((r) => r.kind === 'risk')
        .slice(0, 2)
        .map((r) => ({ level: 'risk' as const, text: r.title })),
      ...issues
        .filter((i) => i.status === 'open' && i.severity === 'high')
        .slice(0, 2)
        .map((i) => ({ level: 'data' as const, text: `${i.ruleName}：${i.entityName}` })),
    ],
  };
}

function search(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (text: string) => text.toLowerCase().includes(q);
  return [
    ...workItems
      .filter((w) => hit(w.title) || hit(w.description))
      .slice(0, 5)
      .map((w) => ({
        type: 'work_item',
        id: w.id,
        title: w.title,
        subtitle: `${w.sourceRuleId} · ${w.ownerName || '未指派'}`,
      })),
    ...risks
      .filter((r) => hit(r.title) || hit(r.description))
      .slice(0, 5)
      .map((r) => ({
        type: 'risk',
        id: r.id,
        title: r.title,
        subtitle: `${r.sourceRuleId} · ${r.kind === 'risk' ? '风险' : '预警'}`,
      })),
    ...events
      .filter((e) => hit(e.entityName) || hit(e.eventType))
      .slice(0, 5)
      .map((e) => ({
        type: 'event',
        id: e.id,
        title: `「${e.entityName}」${e.eventType}`,
        subtitle: e.actorName,
      })),
  ];
}

/** 独立可测试的 Mock handler（Vite 中间件与 smoke 脚本共用） */
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const path = (req.url ?? '').split('?')[0];
  const body = await readBody(req);
  const page = Number(body.page ?? 0);
  const pageSize = Number(body.pageSize ?? 20);

  if (path === '/permissions/mine') {
    json(res, {
      roleId: 'org_admin',
      roleName: '组织管理员',
      permissions: ['*'],
      dataScope: 'org',
      isAdmin: true,
    });
    return;
  }
  if (path === '/sensing/posture') {
    json(res, posture());
    return;
  }
  if (path === '/work-items') {
    const filtered = workItems.filter(
      (w) =>
        (!body.status || w.status === body.status) &&
        (!body.workItemType || w.workItemType === body.workItemType),
    );
    const items = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, {
      items,
      total: filtered.length,
      openCount: workItems.filter((w) => w.status === 'open').length,
      dataScope: 'org',
      hasMore: (page + 1) * pageSize < filtered.length,
    });
    return;
  }
  if (path === '/work-items/refresh') {
    json(res, { upserted: workItems.length, autoClosed: 0 });
    return;
  }
  if (path === '/work-items/act') {
    const item = workItems.find((w) => w.id === body.id);
    if (!item) {
      json(res, null, -1, '工作项不存在');
      return;
    }
    item.status = body.action === 'reopen' ? 'open' : body.action === 'done' ? 'done' : 'cancelled';
    item.updatedAt = new Date().toISOString();
    json(res, { id: item.id, status: item.status });
    return;
  }
  if (path === '/risks') {
    const filtered = risks.filter(
      (r) => (!body.kind || r.kind === body.kind) && (!body.status || r.status === body.status),
    );
    json(res, {
      risks: filtered,
      riskCount: filtered.filter((r) => r.kind === 'risk').length,
      warningCount: filtered.filter((r) => r.kind === 'warning').length,
    });
    return;
  }
  if (path === '/risks/act') {
    const risk = risks.find((r) => r.id === body.id);
    if (!risk) {
      json(res, null, -1, '风险/预警不存在');
      return;
    }
    risk.status =
      body.action === 'resolve' ? 'resolved' : body.action === 'ack' ? 'monitoring' : 'open';
    json(res, { id: risk.id, status: risk.status });
    return;
  }
  if (path === '/data-quality') {
    json(res, {
      snapshot,
      issues,
      openTotal: issues.filter((i) => i.status === 'open').length,
    });
    return;
  }
  if (path === '/data-quality/run') {
    snapshot.score = snapshot.score >= 100 ? 86 : snapshot.score + 1;
    snapshot.checkedAt = new Date().toISOString();
    json(res, { score: snapshot.score, open: issues.filter((i) => i.status === 'open').length });
    return;
  }
  if (path === '/data-quality/act') {
    const issue = issues.find((i) => i.id === body.id);
    if (!issue) {
      json(res, null, -1, '数据问题不存在');
      return;
    }
    issue.status =
      body.action === 'resolve' ? 'resolved' : body.action === 'ignore' ? 'ignored' : 'open';
    json(res, { id: issue.id, status: issue.status });
    return;
  }
  if (path === '/automation') {
    json(res, {
      logs: automationLogs,
      counts: {
        todayRuns: 12,
        successRate: 98,
        failed: 1,
        retries: 2,
        blocked: 0,
      },
    });
    return;
  }
  if (path === '/automation/run') {
    automationLogs.unshift({
      id: 'arl_' + Date.now(),
      ruleId: 'GR-ALL',
      ruleName: '规则引擎批量运行',
      status: 'success',
      actions: { taskCreated: 1, riskCreated: 0, taskAutoClosed: 1, riskAutoResolved: 1 },
      runBy: '管理员',
      runAt: new Date().toISOString(),
      durationMs: 720,
      correlationId: 'c_demo_run_' + Date.now(),
    });
    json(res, { taskCreated: 1, riskCreated: 0, durationMs: 720 });
    return;
  }
  if (path === '/audit/logs') {
    const filtered = auditLogs.filter(
      (l) =>
        (!body.entityType || l.entityType === body.entityType) &&
        (!body.action || l.action === body.action),
    );
    const logs = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { logs, total: filtered.length, hasMore: (page + 1) * pageSize < filtered.length });
    return;
  }
  if (path === '/events') {
    const filtered = events.filter(
      (e) =>
        (!body.entityType || e.entityType === body.entityType) &&
        (!body.level || e.level === body.level),
    );
    const list = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { events: list, total: filtered.length, hasMore: (page + 1) * pageSize < filtered.length });
    return;
  }
  if (path === '/search') {
    json(res, search(String(body.query ?? '')));
    return;
  }
  json(res, null, -1, `Mock 未实现：${path}`);
}

export function devApiPlugin(): Plugin {
  return {
    name: 'smart-society-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        void handleApi(req, res);
      });
    },
  };
}
