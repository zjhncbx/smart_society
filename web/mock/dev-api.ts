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

const orgProfile = {
  orgId: 'org_demo',
  name: '示例社会团体',
  orgType: 'socialOrg',
  creditCode: '91510000XXXXXXXXXX',
  description: '用于 Web W2 开发验证的示例组织',
  status: 'active',
  createdAt: iso(-90 * 86400000),
};

const relationships = [
  {
    relId: 'org_demo_org_child_1',
    orgId: 'org_demo',
    relatedOrgId: 'org_child_1',
    relatedName: '示例子组织',
    relType: 'child',
    shareMembers: true,
    shareActivities: false,
    shareNotices: true,
  },
  {
    relId: 'org_demo_org_partner_1',
    orgId: 'org_demo',
    relatedOrgId: 'org_partner_1',
    relatedName: '示例合作组织',
    relType: 'partner',
    shareMembers: false,
    shareActivities: true,
    shareNotices: false,
  },
];

const members = [
  {
    id: 'm_demo_1',
    orgId: 'org_demo',
    name: '张三',
    studentNo: 'M-2026-0001',
    department: '秘书处',
    roleId: 'chairman',
    roleLabel: '会长',
    phone: '13800000001',
    email: 'zhangsan@example.com',
    joinedAt: '2024-03-01',
    status: 'active',
    syncStatus: 'manual',
  },
  {
    id: 'm_demo_2',
    orgId: 'org_demo',
    name: '李四',
    studentNo: 'M-2026-0002',
    department: '秘书处',
    roleId: 'secretary_general',
    roleLabel: '秘书长',
    phone: '13800000002',
    email: 'lisi@example.com',
    joinedAt: '2024-03-05',
    status: 'active',
    syncStatus: 'manual',
  },
  {
    id: 'm_demo_3',
    orgId: 'org_demo',
    name: '王五',
    studentNo: 'M-2026-0003',
    department: '财务部',
    roleId: 'finance_lead',
    roleLabel: '财务负责人',
    phone: '13800000003',
    email: '',
    joinedAt: '2024-04-12',
    status: 'active',
    syncStatus: 'manual',
  },
  {
    id: 'm_demo_4',
    orgId: 'org_demo',
    name: '赵六',
    studentNo: 'M-2026-0004',
    department: '会员部',
    roleId: 'member',
    roleLabel: '会员',
    phone: '',
    email: 'zhaoliu@example.com',
    joinedAt: '2025-01-20',
    status: 'active',
    syncStatus: 'manual',
  },
];

const projects = [
  {
    id: 'p_demo_1',
    orgId: 'org_demo',
    name: '会员数据治理',
    description: '清理重复与缺失会员档案',
    managerId: 'm_demo_2',
    managerName: '李四',
    status: 1,
    statusLabel: '进行中',
    progress: 40,
    budget: 50000,
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    taskCount: 6,
    doneTaskCount: 2,
    createdAt: iso(-60 * 86400000),
  },
  {
    id: 'p_demo_2',
    orgId: 'org_demo',
    name: '组织数字画像',
    description: '建设组织管理健康度模型',
    managerId: 'm_demo_1',
    managerName: '张三',
    status: 1,
    statusLabel: '进行中',
    progress: 35,
    budget: 80000,
    startDate: '2026-05-01',
    endDate: '2026-11-30',
    taskCount: 8,
    doneTaskCount: 3,
    createdAt: iso(-70 * 86400000),
  },
  {
    id: 'p_demo_3',
    orgId: 'org_demo',
    name: '年度会员大会',
    description: '筹备年度会员大会与换届',
    managerId: 'm_demo_1',
    managerName: '张三',
    status: 0,
    statusLabel: '筹备中',
    progress: 0,
    budget: 30000,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    taskCount: 4,
    doneTaskCount: 0,
    createdAt: iso(-30 * 86400000),
  },
];

const approvals = [
  {
    id: 'ai_demo_1',
    orgId: 'org_demo',
    flowName: '费用报销',
    title: '购置办公设备费用报销',
    bizType: 'finance',
    bizId: 'f_demo_1',
    status: 'running',
    currentNode: 'approve',
    nodeName: '财务负责人审批',
    createdByName: '张三',
    createdAt: iso(-4 * 86400000),
    canAct: true,
  },
  {
    id: 'ai_demo_2',
    orgId: 'org_demo',
    flowName: '付款申请',
    title: '会员数据治理项目付款',
    bizType: 'finance',
    bizId: 'f_demo_2',
    status: 'running',
    currentNode: 'done',
    nodeName: '办理付款',
    createdByName: '李四',
    createdAt: iso(-2 * 86400000),
    canAct: true,
  },
];

const resolutions = [
  {
    id: 'res_demo_1',
    orgId: 'org_demo',
    title: '关于开展会员数据治理的决议',
    content: '同意启动会员数据治理项目，由秘书处牵头，2026 年底前完成。',
    projectId: 'p_demo_1',
    status: 'executing',
    responsibleName: '李四',
    deadline: '2026-12-31',
    correlationId: 'c_demo_res_1',
    createdAt: iso(-60 * 86400000),
  },
  {
    id: 'res_demo_2',
    orgId: 'org_demo',
    title: '关于筹备年度会员大会的决议',
    content: '同意于 2026 年 10 月召开年度会员大会。',
    status: 'pending',
    responsibleName: '张三',
    deadline: '2026-10-31',
    correlationId: 'c_demo_res_2',
    createdAt: iso(-30 * 86400000),
  },
];

const financeRecords = [
  {
    id: 'f_demo_1',
    orgId: 'org_demo',
    type: 'expense',
    amount: 12800,
    categoryLabel: '办公费',
    summary: '购置办公设备费用报销',
    counterparty: '示例供应商',
    projectId: '',
    status: 'approving',
    createdByName: '张三',
    date: '2026-08-12',
    createdAt: iso(-4 * 86400000),
  },
  {
    id: 'f_demo_2',
    orgId: 'org_demo',
    type: 'expense',
    amount: 20000,
    categoryLabel: '项目支出',
    summary: '会员数据治理项目付款',
    counterparty: '示例服务商',
    projectId: 'p_demo_1',
    status: 'approving',
    createdByName: '李四',
    date: '2026-08-13',
    createdAt: iso(-2 * 86400000),
  },
  {
    id: 'f_demo_3',
    orgId: 'org_demo',
    type: 'income',
    amount: 100000,
    categoryLabel: '会费收入',
    summary: '2026 年度会费',
    counterparty: '',
    projectId: '',
    status: 'approved',
    createdByName: '财务',
    date: '2026-08-01',
    createdAt: iso(-16 * 86400000),
  },
];

const rules = [
  {
    id: 'rule_GR-01',
    ruleId: 'GR-01',
    ruleName: '任务逾期自动升级',
    category: 'project',
    enabled: true,
    trigger: '任务逾期',
    condition: '逾期 >= 7 天升级，>= 14 天进入风险',
    action: '升级自动任务并生成风险',
    description: '按逾期天数自动升级并通知负责人。',
  },
  {
    id: 'rule_GR-02',
    ruleId: 'GR-02',
    ruleName: '项目进度偏差',
    category: 'project',
    enabled: true,
    trigger: '项目进度更新',
    condition: '执行时间占比 > 60% 且完成率 < 40%',
    action: '生成进度落后预警',
  },
  {
    id: 'rule_GR-03',
    ruleId: 'GR-03',
    ruleName: '审批SLA超时',
    category: 'approval',
    enabled: true,
    trigger: '审批停留',
    condition: '停留 >= 3 天预警，>= 7 天风险',
    action: '生成审批阻塞预警/风险',
  },
  {
    id: 'rule_GR-04',
    ruleId: 'GR-04',
    ruleName: '数据质量自动任务',
    category: 'data-quality',
    enabled: true,
    trigger: '数据质量检查',
    condition: '存在 open 的中/高严重度问题',
    action: '自动生成修复任务',
  },
  {
    id: 'rule_GR-05',
    ruleId: 'GR-05',
    ruleName: '预算执行异常',
    category: 'finance',
    enabled: true,
    trigger: '财务记录更新',
    condition: '项目支出 > 预算',
    action: '生成预算超支预警',
  },
  {
    id: 'rule_GR-06',
    ruleId: 'GR-06',
    ruleName: '关键治理职位空缺',
    category: 'governance',
    enabled: true,
    trigger: '成员任职变化',
    condition: '关键职位（会长/秘书长/监事长）无在职',
    action: '生成职位空缺风险',
  },
  {
    id: 'rule_DQ-001',
    ruleId: 'DQ-001',
    ruleName: '成员必填缺失',
    category: 'data-quality',
    enabled: true,
    trigger: '数据质量检查',
    condition: '姓名/联系方式缺失',
    action: '登记数据问题',
  },
  {
    id: 'rule_DQ-007',
    ruleId: 'DQ-007',
    ruleName: '任务逾期未完成',
    category: 'project',
    enabled: true,
    trigger: '数据质量检查',
    condition: '任务逾期且未完成',
    action: '登记数据问题',
  },
  {
    id: 'rule_DQ-010',
    ruleId: 'DQ-010',
    ruleName: '预算执行异常',
    category: 'finance',
    enabled: true,
    trigger: '数据质量检查',
    condition: '项目支出超过预算',
    action: '登记财务异常问题',
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
  if (path === '/organization') {
    json(res, { profile: orgProfile, relationships });
    return;
  }
  if (path === '/organization/save') {
    orgProfile.name = String(body.name ?? orgProfile.name);
    orgProfile.description = String(body.description ?? orgProfile.description);
    json(res, orgProfile);
    return;
  }
  if (path === '/organization/relationship/set') {
    const relId = `${orgProfile.orgId}_${body.relatedOrgId ?? ''}`;
    relationships.unshift({
      relId,
      orgId: orgProfile.orgId,
      relatedOrgId: String(body.relatedOrgId ?? ''),
      relatedName: String(body.relatedName ?? body.relatedOrgId ?? ''),
      relType: body.relType === 'partner' ? 'partner' : 'child',
      shareMembers: body.shareMembers === true,
      shareActivities: body.shareActivities === true,
      shareNotices: body.shareNotices === true,
    });
    json(res, { ok: true });
    return;
  }
  if (path === '/members') {
    const keyword = String(body.keyword ?? '').toLowerCase();
    const filtered = members.filter(
      (m) =>
        (!body.roleId || m.roleId === body.roleId) &&
        (!keyword ||
          m.name.toLowerCase().includes(keyword) ||
          m.studentNo.toLowerCase().includes(keyword) ||
          m.department.toLowerCase().includes(keyword)),
    );
    const list = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { members: list, total: filtered.length, hasMore: (page + 1) * pageSize < filtered.length });
    return;
  }
  if (path === '/members/save') {
    const existing = members.find((m) => m.id === body.id);
    const record = {
      id: existing?.id ?? 'm_' + Date.now(),
      orgId: orgProfile.orgId,
      name: String(body.name ?? ''),
      studentNo: String(body.studentNo ?? ''),
      department: String(body.department ?? ''),
      roleId: String(body.roleId ?? 'member'),
      roleLabel: String(body.roleLabel ?? '会员'),
      phone: String(body.phone ?? ''),
      email: String(body.email ?? ''),
      joinedAt: String(body.joinedAt ?? new Date().toISOString().slice(0, 10)),
      status: 'active',
      syncStatus: 'manual',
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      members.unshift(record);
    }
    json(res, record);
    return;
  }
  if (path === '/members/delete') {
    const index = members.findIndex((m) => m.id === body.id);
    if (index >= 0) members.splice(index, 1);
    json(res, { ok: true });
    return;
  }
  if (path === '/projects') {
    const filtered = projects.filter((p) => (!body.status || p.status === Number(body.status)));
    const list = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { projects: list, total: filtered.length, hasMore: (page + 1) * pageSize < filtered.length });
    return;
  }
  if (path === '/projects/save') {
    const existing = projects.find((p) => p.id === body.id);
    const record = {
      id: existing?.id ?? 'p_' + Date.now(),
      orgId: orgProfile.orgId,
      name: String(body.name ?? ''),
      description: String(body.description ?? ''),
      managerId: String(body.managerId ?? ''),
      managerName: String(body.managerName ?? ''),
      status: existing?.status ?? 0,
      statusLabel: existing?.statusLabel ?? '筹备中',
      progress: existing?.progress ?? 0,
      budget: Number(body.budget ?? 0),
      startDate: String(body.startDate ?? new Date().toISOString().slice(0, 10)),
      endDate: String(body.endDate ?? new Date().toISOString().slice(0, 10)),
      taskCount: existing?.taskCount ?? 0,
      doneTaskCount: existing?.doneTaskCount ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) Object.assign(existing, record);
    else projects.unshift(record);
    json(res, record);
    return;
  }
  if (path === '/projects/transition') {
    const project = projects.find((p) => p.id === body.id);
    if (!project) {
      json(res, null, -1, '项目不存在');
      return;
    }
    const map: Record<string, { status: number; label: string }> = {
      start: { status: 1, label: '进行中' },
      pause: { status: 2, label: '已暂停' },
      resume: { status: 1, label: '进行中' },
      complete: { status: 3, label: '已完成' },
    };
    const next = map[String(body.action ?? '')];
    if (!next) {
      json(res, null, -1, '无效的状态动作');
      return;
    }
    project.status = next.status;
    project.statusLabel = next.label;
    json(res, { id: project.id, status: project.status, statusLabel: project.statusLabel });
    return;
  }
  if (path === '/approvals') {
    json(res, { approvals });
    return;
  }
  if (path === '/approvals/act') {
    const approval = approvals.find((a) => a.id === body.id);
    if (!approval) {
      json(res, null, -1, '审批实例不存在');
      return;
    }
    approval.status =
      body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'approved';
    json(res, { status: approval.status });
    return;
  }
  if (path === '/resolutions') {
    json(res, { resolutions });
    return;
  }
  if (path === '/resolutions/save') {
    const record = {
      id: 'res_' + Date.now(),
      orgId: orgProfile.orgId,
      title: String(body.title ?? ''),
      content: String(body.content ?? ''),
      status: 'pending',
      responsibleName: String(body.responsibleName ?? ''),
      deadline: String(body.deadline ?? ''),
      correlationId: 'c_demo_res_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    resolutions.unshift(record);
    json(res, record);
    return;
  }
  if (path === '/resolutions/act') {
    const resolution = resolutions.find((r) => r.id === body.id);
    if (!resolution) {
      json(res, null, -1, '决议不存在');
      return;
    }
    resolution.status =
      body.action === 'start' ? 'executing' : body.action === 'done' ? 'done' : 'pending';
    json(res, { id: resolution.id, status: resolution.status });
    return;
  }
  if (path === '/finance/records') {
    const filtered = financeRecords.filter(
      (r) => (!body.type || r.type === body.type) && (!body.status || r.status === body.status),
    );
    const list = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { records: list, total: filtered.length, hasMore: (page + 1) * pageSize < filtered.length });
    return;
  }
  if (path === '/finance/stats') {
    const income = financeRecords
      .filter((r) => r.type === 'income' && r.status === 'approved')
      .reduce((s, r) => s + r.amount, 0);
    const expense = financeRecords
      .filter((r) => r.type === 'expense' && r.status === 'approved')
      .reduce((s, r) => s + r.amount, 0);
    json(res, { income, expense, balance: income - expense });
    return;
  }
  if (path === '/finance/submit') {
    const record = {
      id: 'f_' + Date.now(),
      orgId: orgProfile.orgId,
      type: body.type === 'income' ? 'income' : body.type === 'voucher' ? 'voucher' : 'expense',
      amount: Number(body.amount ?? 0),
      categoryLabel: String(body.categoryLabel ?? ''),
      summary: String(body.summary ?? ''),
      counterparty: String(body.counterparty ?? ''),
      projectId: String(body.projectId ?? ''),
      status: 'approving',
      createdByName: '管理员',
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      createdAt: new Date().toISOString(),
    };
    financeRecords.unshift(record);
    json(res, { recordId: record.id, status: record.status });
    return;
  }
  if (path === '/rules') {
    json(res, { rules });
    return;
  }
  if (path === '/rules/toggle') {
    const rule = rules.find((r) => r.id === body.id);
    if (!rule) {
      json(res, null, -1, '规则不存在');
      return;
    }
    rule.enabled = body.enabled === true;
    json(res, { id: rule.id, enabled: rule.enabled });
    return;
  }
  if (path === '/reports') {
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const r of financeRecords) {
      const month = r.date.slice(0, 7);
      const cur = byMonth.get(month) ?? { income: 0, expense: 0 };
      if (r.type === 'income' && r.status === 'approved') cur.income += r.amount;
      if (r.type === 'expense' && r.status === 'approved') cur.expense += r.amount;
      byMonth.set(month, cur);
    }
    const financeTrend = Array.from(byMonth.entries()).map(([month, v]) => ({
      month,
      income: v.income,
      expense: v.expense,
    }));
    const openRisks = risks.filter((r) => r.status === 'open');
    const riskDistribution = [
      { name: '风险', value: openRisks.filter((r) => r.kind === 'risk').length },
      { name: '预警', value: openRisks.filter((r) => r.kind === 'warning').length },
    ];
    const dqDimensions = Object.entries(snapshot.dimensions).map(([name, value]) => ({
      name,
      value,
    }));
    const statusCount = new Map<string, number>();
    for (const p of projects) {
      statusCount.set(p.statusLabel, (statusCount.get(p.statusLabel) ?? 0) + 1);
    }
    const projectStatus = Array.from(statusCount.entries()).map(([name, value]) => ({ name, value }));
    json(res, {
      financeTrend,
      riskDistribution,
      dqDimensions,
      projectStatus,
      totals: {
        members: members.length,
        projects: projects.length,
        pendingWorkItems: workItems.filter((w) => w.status === 'open').length,
        dqScore: snapshot.score,
        successRate: 98,
      },
    });
    return;
  }
  if (path === '/trends') {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    const eventCounts = new Map(days.map((d) => [d, 0]));
    const riskCounts = new Map(days.map((d) => [d, 0]));
    const runCounts = new Map(days.map((d) => [d, 0]));
    const runSuccess = new Map(days.map((d) => [d, 0]));
    for (const e of events) eventCounts.set(e.occurredAt.slice(0, 10), (eventCounts.get(e.occurredAt.slice(0, 10)) ?? 0) + 1);
    for (const r of risks) riskCounts.set(r.createdAt.slice(0, 10), (riskCounts.get(r.createdAt.slice(0, 10)) ?? 0) + 1);
    for (const l of automationLogs) {
      runCounts.set(l.runAt.slice(0, 10), (runCounts.get(l.runAt.slice(0, 10)) ?? 0) + 1);
      if (l.status === 'success') runSuccess.set(l.runAt.slice(0, 10), (runSuccess.get(l.runAt.slice(0, 10)) ?? 0) + 1);
    }
    const eventTrend = days.map((d) => ({ date: d, count: eventCounts.get(d) ?? 0 }));
    const riskTrend = days.map((d) => ({ date: d, count: riskCounts.get(d) ?? 0 }));
    const automationTrend = days.map((d) => {
      const runs = runCounts.get(d) ?? 0;
      return { date: d, runs, successRate: runs === 0 ? 100 : Math.round(((runSuccess.get(d) ?? 0) / runs) * 100) };
    });
    json(res, {
      eventTrend,
      riskTrend,
      automationTrend,
      approvalTrend: days.map((d) => ({ date: d, avgHours: 0 })),
      approvalAvgHours: 0,
      approvalPreviousAvgHours: 0,
      totals: {
        events: eventTrend.reduce((s, t) => s + t.count, 0),
        risks: riskTrend.reduce((s, t) => s + t.count, 0),
        pendingApprovals: approvals.filter((a) => a.status === 'running').length,
      },
      anomalies: [approvals.filter((a) => a.status === 'running').length > 0 ? `${approvals.filter((a) => a.status === 'running').length} 项审批在途` : '无异常'],
    });
    return;
  }
  if (path === '/relations') {
    const entityId = String(body.entityId ?? '');
    const project = projects.find((p) => p.id === entityId);
    if (!project) { json(res, null, -1, '项目不存在'); return; }
    const nodes: Array<{ id: string; type: string; name: string }> = [
      { id: `project:${project.id}`, type: 'project', name: project.name },
    ];
    const edges: Array<{ from: string; to: string; label: string }> = [];
    if (project.managerId) {
      const manager = members.find((m) => m.id === project.managerId);
      if (manager) {
        nodes.push({ id: `member:${manager.id}`, type: 'member', name: `${manager.name}（负责人）` });
        edges.push({ from: `project:${project.id}`, to: `member:${manager.id}`, label: '负责' });
      }
    }
    for (const r of resolutions.filter((x) => (x as { projectId?: string }).projectId === entityId)) {
      nodes.push({ id: `resolution:${r.id}`, type: 'resolution', name: r.title });
      edges.push({ from: `resolution:${r.id}`, to: `project:${project.id}`, label: '决议执行' });
    }
    for (const f of financeRecords.filter((x) => x.projectId === entityId)) {
      nodes.push({ id: `finance:${f.id}`, type: 'finance', name: `${f.summary}（¥${f.amount}）` });
      edges.push({ from: `project:${project.id}`, to: `finance:${f.id}`, label: f.type });
      const appr = approvals.find((a) => a.bizId === f.id);
      if (appr) {
        nodes.push({ id: `approval:${appr.id}`, type: 'approval', name: `${appr.flowName}：${appr.title}` });
        edges.push({ from: `finance:${f.id}`, to: `approval:${appr.id}`, label: '审批' });
      }
    }
    for (const r of risks.filter((x) => x.sourceEntityId === entityId)) {
      nodes.push({ id: `risk:${r.id}`, type: 'risk', name: r.title });
      edges.push({ from: `project:${project.id}`, to: `risk:${r.id}`, label: '风险' });
    }
    for (const w of workItems.filter((x) => x.workItemType === 'project_task' && x.originId.startsWith(`${entityId}:`))) {
      nodes.push({ id: `task:${w.id}`, type: 'task', name: w.title });
      edges.push({ from: `project:${project.id}`, to: `task:${w.id}`, label: '任务' });
    }
    json(res, {
      root: `project:${project.id}`,
      nodes,
      edges,
      summary: {
        resolutions: resolutions.filter((x) => (x as { projectId?: string }).projectId === entityId).length,
        finances: financeRecords.filter((x) => x.projectId === entityId).length,
        risks: risks.filter((x) => x.sourceEntityId === entityId).length,
        tasks: workItems.filter((x) => x.workItemType === 'project_task' && x.originId.startsWith(`${entityId}:`)).length,
      },
    });
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
