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

interface MockDocument {
  id: string;
  orgId: string;
  code: string;
  name: string;
  fileName: string;
  contentType: string;
  size: number;
  domain: string;
  refType: string;
  refId: string;
  storagePath: string;
  status: 'uploading' | 'active' | 'deleted' | 'failed';
  downloadCount: number;
  ownerId: string;
  ownerName: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

const now = Date.now();
const iso = (offsetMs: number): string => new Date(now + offsetMs).toISOString();

/** org_mock_2（演示志愿者团队）独立工作项数据集：验证组织切换后数据按 orgId 隔离刷新 */
const workItemsOrg2: MockWorkItem[] = [
  {
    id: 'wi_org2_1',
    orgId: 'org_mock_2',
    workItemType: 'auto_task',
    originType: 'rule',
    originId: 'rule_org2_1',
    title: '志愿者值班表更新',
    description: '本周值班表需要更新并同步全体志愿者',
    ownerId: 'u_demo_1',
    ownerName: '张三',
    priority: 'medium',
    status: 'open',
    deadline: iso(3 * 86400000).slice(0, 10),
    slaDeadline: iso(2 * 86400000),
    escalationLevel: 0,
    completionCondition: '值班表已更新并通知全员',
    sourceRuleId: 'GR-ORG2-01',
    sourceRuleName: '值班表周期检查',
    correlationId: 'c_org2_1',
    createdAt: iso(-86400000),
    updatedAt: iso(-3600000),
  },
  {
    id: 'wi_org2_2',
    orgId: 'org_mock_2',
    workItemType: 'compliance',
    originType: 'rule',
    originId: 'rule_org2_2',
    title: '志愿活动保险到期提醒',
    description: '团体意外险即将到期，需联系保险公司续保',
    ownerId: 'u_demo_1',
    ownerName: '张三',
    priority: 'high',
    status: 'open',
    deadline: iso(5 * 86400000).slice(0, 10),
    slaDeadline: iso(4 * 86400000),
    escalationLevel: 0,
    completionCondition: '保险续保完成',
    sourceRuleId: 'GR-ORG2-02',
    sourceRuleName: '保险到期预警',
    correlationId: 'c_org2_2',
    createdAt: iso(-2 * 86400000),
    updatedAt: iso(-86400000),
  },
];

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

const documents: MockDocument[] = [
  {
    id: 'doc_demo_1',
    orgId: 'org_demo',
    code: 'DOC-2026-000001',
    name: '年度财务报告',
    fileName: '2025年度财务报告.pdf',
    contentType: 'application/pdf',
    size: 2456789,
    domain: 'finance',
    refType: '',
    refId: '',
    storagePath: 'org_demo/finance/doc_demo_1',
    status: 'active',
    downloadCount: 12,
    ownerId: 'u_demo_1',
    ownerName: '张三',
    correlationId: 'c_demo_doc_1',
    createdAt: iso(-30 * 86400000),
    updatedAt: iso(-2 * 86400000),
  },
  {
    id: 'doc_demo_2',
    orgId: 'org_demo',
    code: 'DOC-2026-000002',
    name: '理事会决议归档',
    fileName: '理事会第12次会议决议.pdf',
    contentType: 'application/pdf',
    size: 562300,
    domain: 'governance',
    refType: 'resolution',
    refId: 'res_demo_1',
    storagePath: 'org_demo/governance/doc_demo_2',
    status: 'active',
    downloadCount: 5,
    ownerId: 'u_demo_1',
    ownerName: '张三',
    correlationId: 'c_demo_doc_2',
    createdAt: iso(-15 * 86400000),
    updatedAt: iso(-1 * 86400000),
  },
  {
    id: 'doc_demo_3',
    orgId: 'org_demo',
    code: 'DOC-2026-000003',
    name: '会员名册（脱敏）',
    fileName: '会员名册-2026Q2.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 88420,
    domain: 'member',
    refType: '',
    refId: '',
    storagePath: 'org_demo/member/doc_demo_3',
    status: 'active',
    downloadCount: 3,
    ownerId: 'u_demo_2',
    ownerName: '李四',
    correlationId: 'c_demo_doc_3',
    createdAt: iso(-7 * 86400000),
    updatedAt: iso(-7 * 86400000),
  },
];

const documentContents = new Map<string, string>();

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

/** 治理规则静态定义（与云函数 get-rule-config 的 GR-01~12 完全一致） */
const RULE_DEFS: Array<{
  id: string;
  name: string;
  category: string;
  whenText: string;
  ifText: string;
  thenText: string;
}> = [
  {
    id: 'GR-01', name: '任务逾期自动升级', category: 'project',
    whenText: '项目任务设置了截止日期',
    ifText: '任务超过截止日期未完成（逾期 7 天预警、14 天升级为风险）',
    thenText: '生成自动任务，并按逾期天数升级优先级与风险等级',
  },
  {
    id: 'GR-02', name: '项目进度偏差', category: 'project',
    whenText: '项目处于未完结状态',
    ifText: '已超过计划结束日期，或时间进度过半（60%）而完成率不足 40%',
    thenText: '登记风险/预警并生成项目处理任务',
  },
  {
    id: 'GR-03', name: '审批SLA超时', category: 'approval',
    whenText: '审批流程处于运行中',
    ifText: '审批停留超过 3 天未处理',
    thenText: '登记预警，停留 7 天以上升级为风险',
  },
  {
    id: 'GR-04', name: '数据质量自动任务', category: 'data-quality',
    whenText: '数据质量检查发现问题',
    ifText: '问题严重级别为 medium/high 且未关闭',
    thenText: '自动生成修复任务并指派给问题责任人',
  },
  {
    id: 'GR-05', name: '预算执行异常', category: 'finance',
    whenText: '项目设置了预算',
    ifText: '已批准支出累计超过项目预算',
    thenText: '登记财务异常预警并生成预算处理任务',
  },
  {
    id: 'GR-06', name: '关键治理职位空缺', category: 'org',
    whenText: '组织类型定义了关键治理职位（会长/秘书长/监事长等）',
    ifText: '关键职位当前无在职成员',
    thenText: '登记高风险并生成任职安排任务',
  },
  {
    id: 'GR-07', name: '审批驳回异常', category: 'approval',
    whenText: '审批流程存在处理历史',
    ifText: '同一流程被驳回 2 次及以上',
    thenText: '登记预警并生成整改任务给发起人',
  },
  {
    id: 'GR-08', name: '项目长时间未更新', category: 'project',
    whenText: '项目未完结',
    ifText: '项目超过 60 天未更新',
    thenText: '登记预警并生成进度更新任务给项目负责人',
  },
  {
    id: 'GR-09', name: '决议逾期未执行', category: 'governance',
    whenText: '决议未完成',
    ifText: '决议超过截止日期仍未执行',
    thenText: '登记预警并生成推进任务给责任人',
  },
  {
    id: 'GR-10', name: '证照到期提醒', category: 'governance',
    whenText: '证照未过期且未删除',
    ifText: '距到期日 ≤90/30 天或已过期',
    thenText: '分级登记预警并生成续期任务',
  },
  {
    id: 'GR-11', name: '任期届满提醒', category: 'governance',
    whenText: '任期未归档',
    ifText: '距届满日 ≤180/90/30 天或已届满',
    thenText: '分级登记预警并生成换届准备任务',
  },
  {
    id: 'GR-12', name: '合规事项逾期', category: 'governance',
    whenText: '合规事项未完成',
    ifText: '超过截止日期未完成',
    thenText: '登记预警并生成完成整改任务',
  },
];

/** 组织级停用规则集合（set-rule-enabled 写入，get-rule-config 读取） */
const disabledRules = new Set<string>();

function json(res: ServerResponse, data: unknown, code = 0, message = 'ok'): void {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ret: { code, message, data } }));
}

/**
 * Mock 用户所属组织（多组织切换数据源，供 /orgs/mine 与组织切换器使用）。
 * 与会话默认组织保持一致：org_mock 为主组织，org_mock_2 用于切换验证。
 */
export const mockMyOrgs: Array<{ orgId: string; name: string; role: string }> = [
  { orgId: 'org_mock', name: '演示社会组织', role: 'admin' },
  { orgId: 'org_mock_2', name: '演示志愿者团队', role: 'admin' },
];

/** 设置中心 Mock 状态（与云函数 get/save-org-settings、get-roles/save-role、get/save-user-settings 契约一致） */
const orgSettingsState = {
  themeIndex: 0,
  roleLabels: {
    chairman: '会长',
    secretary_general: '秘书长',
    finance_lead: '财务负责人',
    director: '理事',
    supervisor: '监事',
  } as Record<string, string>,
  dingtalkClientId: '',
  dingtalkClientSecret: '',
  dingtalkLastSyncAt: null as number | null,
  dingtalkLastResult: null as string | null,
};

const roleState: Array<{
  id: string;
  code: string;
  name: string;
  builtin: boolean;
  permissions: string[];
  dataScope: string;
  status: string;
}> = [
  {
    id: 'role_org_mock_org_admin',
    code: 'org_admin',
    name: '组织管理员',
    builtin: true,
    permissions: ['*'],
    dataScope: 'org',
    status: 'active',
  },
  {
    id: 'role_org_mock_finance_lead',
    code: 'finance_lead',
    name: '财务负责人',
    builtin: true,
    permissions: ['finance:read', 'finance:write', 'approval:act'],
    dataScope: 'org',
    status: 'active',
  },
  {
    id: 'role_org_mock_member',
    code: 'member',
    name: '会员',
    builtin: true,
    permissions: ['project:read'],
    dataScope: 'self',
    status: 'active',
  },
];

const userSettingsState = { nickname: '', darkMode: false };

/** 治理对象 Mock 状态（与云函数 get/save/act-license、get/save/act-compliance-item、get/save/act-term 契约一致） */
const licenseState: Array<{
  id: string;
  orgId: string;
  code: string;
  name: string;
  licenseNo: string;
  issuer: string;
  issuedAt: string | null;
  expireAt: string | null;
  status: string;
  ownerId: string;
  ownerName: string;
}> = [
  {
    id: 'lic_mock_1',
    orgId: 'org_mock',
    code: 'LIC-2025-0001',
    name: '社会团体法人登记证书',
    licenseNo: '社证字第0001号',
    issuer: '市民政局',
    issuedAt: '2025-01-10T00:00:00.000Z',
    expireAt: '2029-01-09T00:00:00.000Z',
    status: 'active',
    ownerId: 'u1',
    ownerName: '张管理',
  },
  {
    id: 'lic_mock_2',
    orgId: 'org_mock',
    code: 'LIC-2026-0002',
    name: '餐饮服务许可证',
    licenseNo: '餐证字第0002号',
    issuer: '市市场监管局',
    issuedAt: '2023-06-01T00:00:00.000Z',
    // 到期数据样例：30 天内到期，前端到期列高亮
    expireAt: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    status: 'active',
    ownerId: 'u1',
    ownerName: '张管理',
  },
  {
    id: 'lic_mock_3',
    orgId: 'org_mock',
    code: 'LIC-2021-0003',
    name: '消防验收合格证',
    licenseNo: '消验字第0003号',
    issuer: '市消防救援支队',
    issuedAt: '2021-03-15T00:00:00.000Z',
    expireAt: '2025-03-14T00:00:00.000Z',
    status: 'expired',
    ownerId: 'u2',
    ownerName: '李理事',
  },
];

const complianceState: Array<{
  id: string;
  orgId: string;
  code: string;
  name: string;
  itemType: string;
  deadline: string | null;
  status: string;
  responsibleMemberId: string;
  responsibleName: string;
}> = [
  {
    id: 'comp_mock_1',
    orgId: 'org_mock',
    code: 'CMP-2026-0001',
    name: '年度工作报告报送',
    itemType: 'report',
    deadline: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
    status: 'pending',
    responsibleMemberId: 'u1',
    responsibleName: '张管理',
  },
  {
    id: 'comp_mock_2',
    orgId: 'org_mock',
    code: 'CMP-2025-0002',
    name: '年检资料补交',
    itemType: 'inspection',
    // 逾期数据样例：截止日已过但未完成
    deadline: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    status: 'executing',
    responsibleMemberId: 'u2',
    responsibleName: '李理事',
  },
  {
    id: 'comp_mock_3',
    orgId: 'org_mock',
    code: 'CMP-2025-0003',
    name: '税务申报',
    itemType: 'tax',
    deadline: '2025-12-15T00:00:00.000Z',
    status: 'done',
    responsibleMemberId: 'u3',
    responsibleName: '王财务',
  },
];

const termState: Array<{
  id: string;
  orgId: string;
  code: string;
  title: string;
  governanceBody: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}> = [
  {
    id: 'term_mock_1',
    orgId: 'org_mock',
    code: 'TERM-2024-01',
    title: '第三届理事会（2024-2028）',
    governanceBody: '理事会',
    startDate: '2024-06-01T00:00:00.000Z',
    endDate: '2028-05-31T00:00:00.000Z',
    status: 'active',
  },
  {
    id: 'term_mock_2',
    orgId: 'org_mock',
    code: 'TERM-2020-01',
    title: '第二届理事会（2020-2024）',
    governanceBody: '理事会',
    startDate: '2020-06-01T00:00:00.000Z',
    endDate: '2024-05-31T00:00:00.000Z',
    status: 'archived',
  },
  {
    id: 'term_mock_3',
    orgId: 'org_mock',
    code: 'TERM-2026-01',
    title: '第三届监事会（2026-2030）',
    governanceBody: '监事会',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2030-12-31T00:00:00.000Z',
    status: 'preparing',
  },
];

/** 财务扩展 Mock 状态（与云函数 get/save-approval-flow、get/save-opening-balances、get-ledger、close/unclose-period 契约一致） */
const approvalFlowState: Array<{
  id: string;
  orgId: string;
  name: string;
  bizType: string;
  nodes: string;
  enabled: boolean;
  isDefault: boolean;
}> = [
  {
    id: 'flow_mock_1',
    orgId: 'org_mock',
    name: '财务报销默认审批流',
    bizType: 'finance',
    nodes: JSON.stringify([
      { id: 'n1', name: '财务初审', type: 'approve', roleIds: ['finance_lead'] },
      { id: 'n2', name: '管理员终审', type: 'approve', roleIds: ['org_admin'] },
      { id: 'n3', name: '出纳付款', type: 'handle', roleIds: ['finance_lead'] },
      { id: 'n4', name: '抄送秘书处', type: 'cc', roleIds: ['secretary_general'] },
    ]),
    enabled: true,
    isDefault: true,
  },
  {
    id: 'flow_mock_2',
    orgId: 'org_mock',
    name: '大额支出审批流',
    bizType: 'finance',
    nodes: JSON.stringify([
      { id: 'n1', name: '秘书长审核', type: 'approve', roleIds: ['secretary_general'] },
      { id: 'n2', name: '会长审批', type: 'approve', roleIds: ['chairman'] },
    ]),
    enabled: false,
    isDefault: false,
  },
];

const openingBalanceState: Array<{
  id: string;
  orgId: string;
  year: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}> = [
  { id: 'ob_org_mock_2026_1001', orgId: 'org_mock', year: '2026', accountCode: '1001', accountName: '现金', debit: 5000, credit: 0 },
  { id: 'ob_org_mock_2026_1002', orgId: 'org_mock', year: '2026', accountCode: '1002', accountName: '银行存款', debit: 50000, credit: 0 },
  { id: 'ob_org_mock_2026_3101', orgId: 'org_mock', year: '2026', accountCode: '3101', accountName: '非限定性净资产', debit: 0, credit: 55000 },
];

/** 期末结账 Mock 状态：某年度一旦结账即生成结转记录（income/expense 为当年已生效收支合计） */
const closingState: Array<{ voucherId: string; year: string; income: number; expense: number }> = [];

/** 与云函数 get-ledger / get-accounting-reports 一致的内置科目表 */
const ACCOUNTS: Array<{ code: string; name: string; category: string }> = [
  { code: '1001', name: '现金', category: '资产' },
  { code: '1002', name: '银行存款', category: '资产' },
  { code: '1101', name: '短期投资', category: '资产' },
  { code: '1201', name: '应收款项', category: '资产' },
  { code: '1301', name: '存货', category: '资产' },
  { code: '1401', name: '待摊费用', category: '资产' },
  { code: '1501', name: '长期股权投资', category: '资产' },
  { code: '1502', name: '长期债权投资', category: '资产' },
  { code: '1601', name: '固定资产', category: '资产' },
  { code: '1602', name: '累计折旧', category: '资产' },
  { code: '1701', name: '无形资产', category: '资产' },
  { code: '1801', name: '受托代理资产', category: '资产' },
  { code: '2101', name: '借入款项', category: '负债' },
  { code: '2201', name: '应付款项', category: '负债' },
  { code: '2301', name: '应付工资', category: '负债' },
  { code: '2302', name: '应交税金', category: '负债' },
  { code: '2401', name: '预收账款', category: '负债' },
  { code: '2501', name: '预提费用', category: '负债' },
  { code: '2601', name: '预计负债', category: '负债' },
  { code: '2701', name: '长期应付款', category: '负债' },
  { code: '2801', name: '受托代理负债', category: '负债' },
  { code: '3101', name: '非限定性净资产', category: '净资产' },
  { code: '3201', name: '限定性净资产', category: '净资产' },
  { code: '4101', name: '捐赠收入', category: '收入' },
  { code: '4102', name: '会费收入', category: '收入' },
  { code: '4103', name: '提供服务收入', category: '收入' },
  { code: '4104', name: '政府补助收入', category: '收入' },
  { code: '4105', name: '投资收益', category: '收入' },
  { code: '4106', name: '商品销售收入', category: '收入' },
  { code: '4109', name: '其他收入', category: '收入' },
  { code: '5101', name: '业务活动成本', category: '费用' },
  { code: '5201', name: '管理费用', category: '费用' },
  { code: '5301', name: '筹资费用', category: '费用' },
  { code: '5401', name: '其他费用', category: '费用' },
];

/** 公告 Mock 状态（与云函数 upsert-notice/delete-notice/get-all-data(Notice) 契约一致） */
const noticeState: Array<{
  id: string;
  orgId: string;
  title: string;
  content: string;
  publisher: string;
  publishTime: string;
  isImportant: boolean;
  status: string;
}> = [
  {
    id: 'n_mock_1',
    orgId: 'org_mock',
    title: '关于召开 2026 年度会员大会的通知',
    content: '定于 2026 年 11 月 8 日召开年度会员大会，请各位会员准时出席。',
    publisher: '秘书处',
    publishTime: iso(-2 * 86400000),
    isImportant: true,
    status: 'active',
  },
  {
    id: 'n_mock_2',
    orgId: 'org_mock',
    title: '会费缴纳通道已开启',
    content: '2026 年度会费线上缴纳通道已开启，请于 10 月底前完成缴纳。',
    publisher: '财务部',
    publishTime: iso(-9 * 86400000),
    isImportant: false,
    status: 'active',
  },
  {
    id: 'n_mock_3',
    orgId: 'org_mock',
    title: '数据治理专项工作组招募成员',
    content: '为推进数据质量专项治理，现招募工作组成员，欢迎报名。',
    publisher: '秘书处',
    publishTime: iso(-21 * 86400000),
    isImportant: false,
    status: 'active',
  },
];

interface MockLedgerEntry {
  account: string;
  debit: number;
  credit: number;
  date: string;
  voucherNo: string;
  summary: string;
}

/** 已生效收支凭证 → 复式分录（income: 借 1002 / 贷 4102；expense: 借 5201 / 贷 1002），结账后追加结转分录 */
function approvedEntriesForYear(year: string): MockLedgerEntry[] {
  const entries: MockLedgerEntry[] = [];
  for (const r of financeRecords) {
    if (r.status !== 'approved' || !r.date.startsWith(year)) continue;
    const base = { date: r.date, voucherNo: r.id, summary: r.summary };
    if (r.type === 'income') {
      entries.push({ account: '1002', debit: r.amount, credit: 0, ...base });
      entries.push({ account: '4102', debit: 0, credit: r.amount, ...base });
    } else {
      entries.push({ account: '5201', debit: r.amount, credit: 0, ...base });
      entries.push({ account: '1002', debit: 0, credit: r.amount, ...base });
    }
  }
  const closing = closingState.find((c) => c.year === year);
  if (closing) {
    if (closing.income > 0) {
      const base = { date: `${year}-12-31`, voucherNo: `结-${year}`, summary: `期末结转${year}年度收入` };
      entries.push({ account: '4102', debit: closing.income, credit: 0, ...base });
      entries.push({ account: '3101', debit: 0, credit: closing.income, ...base });
    }
    if (closing.expense > 0) {
      const base = { date: `${year}-12-31`, voucherNo: `结-${year}`, summary: `期末结转${year}年度费用` };
      entries.push({ account: '3101', debit: closing.expense, credit: 0, ...base });
      entries.push({ account: '5201', debit: 0, credit: closing.expense, ...base });
    }
  }
  return entries;
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

/** org_mock_2 独立态势：仅有本组织工作项，无风险/数据问题（验证组织切换数据隔离） */
function postureOrg2() {
  const openItems = workItemsOrg2.filter((w) => w.status === 'open');
  return {
    status: '正常',
    pendingCount: openItems.length,
    riskCount: 0,
    warningCount: 0,
    dqOpenCount: 0,
    escalatedCount: openItems.filter((w) => w.escalationLevel > 0).length,
    topConcerns: openItems.slice(0, 2).map((w) => ({
      level: 'warning' as const,
      text: w.title,
    })),
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

  // 错误注入机制：请求携带 X-Mock-Fail: 1 时统一返回业务错误（供错误态/失败反馈断言）
  const mockFailHeader = (req.headers as Record<string, unknown> | undefined)?.['x-mock-fail'];
  if (String(mockFailHeader ?? '') === '1') {
    json(res, null, -1, 'Mock 注入错误（X-Mock-Fail）');
    return;
  }

  const body = await readBody(req);
  const page = Number(body.page ?? 0);
  const pageSize = Number(body.pageSize ?? 20);

  // ---- 认证链（与云函数 login-user / get-my-orgs 契约一致）----
  if (path === '/auth/login') {
    const account = String(body.account ?? '');
    const password = String(body.password ?? '');
    if (account !== '13800000000' || password !== 'admin123') {
      json(res, null, -1, '账号或密码错误');
      return;
    }
    json(res, {
      userId: 'u_demo_1',
      displayName: '张三',
      phone: '13800000000',
      email: 'admin@demo.org',
    });
    return;
  }
  if (path === '/orgs/mine') {
    const userId = String(body.userId ?? 'u_demo_1');
    json(
      res,
      mockMyOrgs.map((o) => ({
        orgId: o.orgId,
        name: o.name,
        userRole: o.role,
        role: o.role,
        joinedAt: `${new Date().getFullYear()}-01-01`,
        userId,
      })),
    );
    return;
  }

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

  // ---- 设置中心 ----
  if (path === '/settings/org') {
    json(res, {
      orgId: 'org_mock',
      themeIndex: orgSettingsState.themeIndex,
      roleLabels: orgSettingsState.roleLabels,
      dingtalk: {
        configured: Boolean(orgSettingsState.dingtalkClientId && orgSettingsState.dingtalkClientSecret),
        lastSyncAt: orgSettingsState.dingtalkLastSyncAt,
        lastResult: orgSettingsState.dingtalkLastResult,
        clientId: orgSettingsState.dingtalkClientId,
        clientSecret: orgSettingsState.dingtalkClientSecret,
      },
    });
    return;
  }
  if (path === '/settings/org/save') {
    if (body.themeIndex !== undefined) orgSettingsState.themeIndex = Number(body.themeIndex) || 0;
    if (body.roleLabels !== undefined && body.roleLabels !== null && typeof body.roleLabels === 'object') {
      orgSettingsState.roleLabels = { ...(body.roleLabels as Record<string, string>) };
    }
    if (body.dingtalkClientId !== undefined) {
      orgSettingsState.dingtalkClientId = String(body.dingtalkClientId ?? '');
    }
    if (body.dingtalkClientSecret !== undefined) {
      orgSettingsState.dingtalkClientSecret = String(body.dingtalkClientSecret ?? '');
    }
    orgSettingsState.dingtalkLastSyncAt = Date.now();
    orgSettingsState.dingtalkLastResult = 'ok';
    json(res, { ok: true });
    return;
  }
  if (path === '/settings/roles') {
    json(res, {
      roles: roleState,
      builtins: ['org_admin', 'chairman', 'secretary_general', 'finance_lead', 'director', 'supervisor'],
    });
    return;
  }
  if (path === '/settings/roles/save') {
    const roleId = String(body.roleId ?? '');
    if (!roleId || !body.name) {
      json(res, null, -1, '缺少 roleId/name 参数');
      return;
    }
    const existing = roleState.find((r) => r.code === roleId);
    if (existing) {
      existing.name = String(body.name);
      if (Array.isArray(body.permissions)) existing.permissions = [...(body.permissions as string[])];
      if (body.dataScope !== undefined) existing.dataScope = String(body.dataScope);
      json(res, { id: existing.id });
    } else {
      const id = `role_org_mock_${roleId}`;
      roleState.push({
        id,
        code: roleId,
        name: String(body.name),
        builtin: false,
        permissions: Array.isArray(body.permissions) ? [...(body.permissions as string[])] : [],
        dataScope: String(body.dataScope ?? 'org'),
        status: 'active',
      });
      json(res, { id });
    }
    return;
  }
  if (path === '/settings/user') {
    json(res, {
      nickname: userSettingsState.nickname || null,
      darkMode: userSettingsState.darkMode,
    });
    return;
  }
  if (path === '/settings/user/save') {
    if (body.nickname !== undefined) userSettingsState.nickname = String(body.nickname ?? '');
    if (body.darkMode !== undefined) userSettingsState.darkMode = body.darkMode === true;
    json(res, { ok: true });
    return;
  }

  // ---- 治理对象：证照 / 合规事项 / 任期 ----
  if (path === '/governance/licenses') {
    const filtered = licenseState.filter((l) => !body.status || l.status === body.status);
    const licenses = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, {
      licenses,
      total: filtered.length,
      hasMore: (page + 1) * pageSize < filtered.length,
    });
    return;
  }
  if (path === '/governance/licenses/save') {
    const name = String(body.name ?? '').trim();
    if (!name) {
      json(res, null, -1, '缺少 orgId/userId/name 参数');
      return;
    }
    const id = String(body.id ?? '');
    const existing = id ? licenseState.find((l) => l.id === id) : undefined;
    if (existing) {
      existing.name = name;
      existing.licenseNo = String(body.licenseNo ?? existing.licenseNo);
      existing.issuer = String(body.issuer ?? existing.issuer);
      if (body.issuedAt !== undefined) existing.issuedAt = body.issuedAt ? String(body.issuedAt) : null;
      if (body.expireAt !== undefined) existing.expireAt = body.expireAt ? String(body.expireAt) : null;
      json(res, { id: existing.id, code: existing.code, status: existing.status });
    } else {
      const newId = `lic_mock_${Date.now()}`;
      const now = new Date();
      licenseState.unshift({
        id: newId,
        orgId: 'org_mock',
        code: `LIC-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
        name,
        licenseNo: String(body.licenseNo ?? ''),
        issuer: String(body.issuer ?? ''),
        issuedAt: body.issuedAt ? String(body.issuedAt) : null,
        expireAt: body.expireAt ? String(body.expireAt) : null,
        status: 'active',
        ownerId: 'u1',
        ownerName: '张管理',
      });
      json(res, { id: newId, code: licenseState[0].code, status: 'active' });
    }
    return;
  }
  if (path === '/governance/licenses/act') {
    const id = String(body.id ?? '');
    const action = String(body.action ?? 'renew');
    const row = licenseState.find((l) => l.id === id);
    if (!row) {
      json(res, null, -1, '证照不存在');
      return;
    }
    if (!['renew', 'expire', 'reopen'].includes(action)) {
      json(res, null, -1, 'action 不合法');
      return;
    }
    if (action === 'renew') {
      row.status = 'active';
      if (body.expireAt) row.expireAt = String(body.expireAt);
    } else if (action === 'expire') {
      row.status = 'expired';
    } else {
      row.status = 'active';
    }
    json(res, { id: row.id, status: row.status });
    return;
  }
  if (path === '/governance/compliance') {
    const filtered = complianceState.filter((c) => !body.status || c.status === body.status);
    const items = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, {
      items,
      total: filtered.length,
      hasMore: (page + 1) * pageSize < filtered.length,
    });
    return;
  }
  if (path === '/governance/compliance/save') {
    const name = String(body.name ?? '').trim();
    if (!name) {
      json(res, null, -1, '缺少 orgId/userId/name 参数');
      return;
    }
    const id = String(body.id ?? '');
    const existing = id ? complianceState.find((c) => c.id === id) : undefined;
    if (existing) {
      existing.name = name;
      existing.itemType = String(body.itemType ?? existing.itemType);
      if (body.deadline !== undefined) existing.deadline = body.deadline ? String(body.deadline) : null;
      existing.responsibleMemberId = String(body.responsibleMemberId ?? existing.responsibleMemberId);
      existing.responsibleName = String(body.responsibleName ?? existing.responsibleName);
      json(res, { id: existing.id, code: existing.code, status: existing.status });
    } else {
      const newId = `comp_mock_${Date.now()}`;
      const now = new Date();
      complianceState.unshift({
        id: newId,
        orgId: 'org_mock',
        code: `CMP-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
        name,
        itemType: String(body.itemType ?? 'other'),
        deadline: body.deadline ? String(body.deadline) : null,
        status: 'pending',
        responsibleMemberId: String(body.responsibleMemberId ?? ''),
        responsibleName: String(body.responsibleName ?? ''),
      });
      json(res, { id: newId, code: complianceState[0].code, status: 'pending' });
    }
    return;
  }
  if (path === '/governance/compliance/act') {
    const id = String(body.id ?? '');
    const action = String(body.action ?? 'start');
    const row = complianceState.find((c) => c.id === id);
    if (!row) {
      json(res, null, -1, '合规事项不存在');
      return;
    }
    if (!['start', 'done', 'reopen'].includes(action)) {
      json(res, null, -1, 'action 不合法');
      return;
    }
    row.status = action === 'start' ? 'executing' : action === 'done' ? 'done' : 'pending';
    json(res, { id: row.id, status: row.status });
    return;
  }
  if (path === '/governance/terms') {
    const filtered = termState.filter((t) => !body.status || t.status === body.status);
    const terms = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, {
      terms,
      total: filtered.length,
      hasMore: (page + 1) * pageSize < filtered.length,
    });
    return;
  }
  if (path === '/governance/terms/save') {
    const title = String(body.title ?? '').trim();
    if (!title) {
      json(res, null, -1, '缺少 orgId/userId/title 参数');
      return;
    }
    const id = String(body.id ?? '');
    const existing = id ? termState.find((t) => t.id === id) : undefined;
    if (existing) {
      existing.title = title;
      existing.governanceBody = String(body.governanceBody ?? existing.governanceBody);
      if (body.startDate !== undefined) existing.startDate = body.startDate ? String(body.startDate) : null;
      if (body.endDate !== undefined) existing.endDate = body.endDate ? String(body.endDate) : null;
      json(res, { id: existing.id, code: existing.code, status: existing.status });
    } else {
      const newId = `term_mock_${Date.now()}`;
      const now = new Date();
      termState.unshift({
        id: newId,
        orgId: 'org_mock',
        code: `TERM-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
        title,
        governanceBody: String(body.governanceBody ?? ''),
        startDate: body.startDate ? String(body.startDate) : null,
        endDate: body.endDate ? String(body.endDate) : null,
        status: 'preparing',
      });
      json(res, { id: newId, code: termState[0].code, status: 'preparing' });
    }
    return;
  }
  if (path === '/governance/terms/act') {
    const id = String(body.id ?? '');
    const action = String(body.action ?? 'prepare');
    const row = termState.find((t) => t.id === id);
    if (!row) {
      json(res, null, -1, '任期不存在');
      return;
    }
    if (!['prepare', 'activate', 'archive'].includes(action)) {
      json(res, null, -1, 'action 不合法');
      return;
    }
    row.status = action === 'prepare' ? 'preparing' : action === 'activate' ? 'active' : 'archived';
    json(res, { id: row.id, status: row.status });
    return;
  }

  // ---- 财务扩展：审批流 / 期初余额 / 总账 / 期末结账 ----
  if (path === '/finance/flows') {
    const bizType = body.bizType === 'project' ? 'project' : 'finance';
    json(res, { flows: approvalFlowState.filter((f) => f.bizType === bizType) });
    return;
  }
  if (path === '/finance/flows/save') {
    const flow = body.flow as
      | { id?: string; name?: string; bizType?: string; nodes?: string; enabled?: boolean; isDefault?: boolean }
      | undefined;
    if (!flow || !flow.name || typeof flow.nodes !== 'string') {
      json(res, null, -1, '缺少 orgId/userId/flow 参数');
      return;
    }
    let nodes: unknown;
    try {
      nodes = JSON.parse(flow.nodes);
    } catch {
      nodes = null;
    }
    if (!Array.isArray(nodes) || nodes.length === 0) {
      json(res, null, -1, '流程节点不合法（需至少一个节点，类型为审批/办理/抄送）');
      return;
    }
    const existing = flow.id ? approvalFlowState.find((f) => f.id === flow.id) : undefined;
    if (existing) {
      existing.name = flow.name;
      existing.nodes = flow.nodes;
      existing.enabled = flow.enabled !== false;
      existing.isDefault = flow.isDefault === true;
      json(res, { flowId: existing.id });
    } else {
      const flowId = `flow_mock_${Date.now()}`;
      approvalFlowState.push({
        id: flowId,
        orgId: 'org_mock',
        name: flow.name,
        bizType: String(flow.bizType ?? 'finance'),
        nodes: flow.nodes,
        enabled: flow.enabled !== false,
        isDefault: flow.isDefault === true,
      });
      json(res, { flowId });
    }
    return;
  }
  if (path === '/finance/opening') {
    const year = String(body.year ?? '');
    if (!/^\d{4}$/.test(year)) {
      json(res, null, -1, '缺少 orgId/userId/year 参数');
      return;
    }
    json(res, { balances: openingBalanceState.filter((b) => b.year === year) });
    return;
  }
  if (path === '/finance/opening/save') {
    const year = String(body.year ?? '');
    if (!/^\d{4}$/.test(year)) {
      json(res, null, -1, '缺少 orgId/userId/year 参数');
      return;
    }
    if (body.carryFromPrevious === true) {
      // 从上年期末自动结转：上年期初 + 上年全部已生效凭证 = 上年期末（只结转资产负债类科目）
      const prevYear = String(Number(year) - 1);
      const nets = new Map<string, number>();
      for (const ob of openingBalanceState.filter((b) => b.year === prevYear)) {
        nets.set(ob.accountCode, (nets.get(ob.accountCode) ?? 0) + ob.debit - ob.credit);
      }
      for (const e of approvedEntriesForYear(prevYear)) {
        nets.set(e.account, (nets.get(e.account) ?? 0) + e.debit - e.credit);
      }
      const balances: typeof openingBalanceState = [];
      nets.forEach((net, code) => {
        if (!/^[123]/.test(code)) return;
        balances.push({
          id: `ob_org_mock_${year}_${code}`,
          orgId: 'org_mock',
          year,
          accountCode: code,
          accountName: ACCOUNTS.find((a) => a.code === code)?.name ?? code,
          debit: net > 0 ? net : 0,
          credit: net < 0 ? -net : 0,
        });
      });
      for (const b of balances) {
        const idx = openingBalanceState.findIndex((o) => o.year === year && o.accountCode === b.accountCode);
        if (idx >= 0) openingBalanceState[idx] = b;
        else openingBalanceState.push(b);
      }
      json(res, { balances, carried: balances.length });
      return;
    }
    const list = Array.isArray(body.balances)
      ? (body.balances as Array<{ accountCode?: string; accountName?: string; debit?: number; credit?: number }>)
      : [];
    const balances: typeof openingBalanceState = [];
    for (const b of list) {
      const code = String(b.accountCode ?? '');
      if (!code) continue;
      const row = {
        id: `ob_org_mock_${year}_${code}`,
        orgId: 'org_mock',
        year,
        accountCode: code,
        accountName: String(b.accountName ?? ACCOUNTS.find((a) => a.code === code)?.name ?? code),
        debit: Math.max(0, Number(b.debit) || 0),
        credit: Math.max(0, Number(b.credit) || 0),
      };
      const idx = openingBalanceState.findIndex((o) => o.year === year && o.accountCode === code);
      if (idx >= 0) openingBalanceState[idx] = row;
      else openingBalanceState.push(row);
      balances.push(row);
    }
    json(res, { balances, carried: 0 });
    return;
  }
  if (path === '/finance/ledger') {
    const year = String(body.year ?? '');
    const accountCode = String(body.accountCode ?? '');
    if (!/^\d{4}$/.test(year) || !accountCode) {
      json(res, null, -1, '缺少 orgId/userId/year/accountCode 参数');
      return;
    }
    const account = ACCOUNTS.find((a) => a.code === accountCode) ?? {
      code: accountCode,
      name: accountCode,
      category: '',
    };
    const ob = openingBalanceState.find((b) => b.year === year && b.accountCode === accountCode);
    const openDebit = ob ? ob.debit : 0;
    const openCredit = ob ? ob.credit : 0;
    const debitSide = account.category === '资产' || account.category === '费用';
    let running = openDebit - openCredit;
    const entries = approvedEntriesForYear(year)
      .filter((e) => e.account === accountCode)
      .sort((a, b) => {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime();
        return d !== 0 ? d : a.voucherNo.localeCompare(b.voucherNo);
      })
      .map((e) => {
        running += e.debit - e.credit;
        return {
          date: e.date,
          voucherNo: e.voucherNo,
          summary: e.summary,
          debit: e.debit,
          credit: e.credit,
          runningDebit: debitSide ? Math.max(0, running) : Math.max(0, -running),
          runningCredit: debitSide ? Math.max(0, -running) : Math.max(0, running),
        };
      });
    json(res, { account, year, openDebit, openCredit, entries });
    return;
  }
  if (path === '/finance/reports') {
    const year = String(body.year ?? '');
    if (!/^\d{4}$/.test(year)) {
      json(res, null, -1, '缺少 orgId/userId/year 参数');
      return;
    }
    const yearEntries = approvedEntriesForYear(year);
    const rows = ACCOUNTS.map((a) => {
      const ob = openingBalanceState.find((b) => b.year === year && b.accountCode === a.code);
      const openDebit = ob ? ob.debit : 0;
      const openCredit = ob ? ob.credit : 0;
      let curDebit = 0;
      let curCredit = 0;
      for (const e of yearEntries.filter((x) => x.account === a.code)) {
        curDebit += e.debit;
        curCredit += e.credit;
      }
      const netOpen = openDebit - openCredit;
      const netEnd = netOpen + curDebit - curCredit;
      return {
        code: a.code,
        name: a.name,
        category: a.category,
        openDebit: Math.max(0, netOpen),
        openCredit: Math.max(0, -netOpen),
        curDebit,
        curCredit,
        endDebit: Math.max(0, netEnd),
        endCredit: Math.max(0, -netEnd),
      };
    });
    const sum = (key: 'openDebit' | 'openCredit' | 'curDebit' | 'curCredit' | 'endDebit' | 'endCredit') =>
      rows.reduce((acc, r) => acc + r[key], 0);
    json(res, {
      year,
      closingExists: closingState.some((c) => c.year === year),
      trialBalance: {
        rows,
        totals: {
          openDebit: sum('openDebit'),
          openCredit: sum('openCredit'),
          curDebit: sum('curDebit'),
          curCredit: sum('curCredit'),
          endDebit: sum('endDebit'),
          endCredit: sum('endCredit'),
        },
      },
    });
    return;
  }
  if (path === '/finance/close') {
    const year = String(body.year ?? '');
    if (!/^\d{4}$/.test(year)) {
      json(res, null, -1, '缺少 orgId/userId/year 参数');
      return;
    }
    const existing = closingState.find((c) => c.year === year);
    if (existing) {
      json(res, { alreadyClosed: true, voucherId: existing.voucherId });
      return;
    }
    const approved = financeRecords.filter((r) => r.status === 'approved' && r.date.startsWith(year));
    const income = approved.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
    const expense = approved.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
    if (income === 0 && expense === 0) {
      json(res, { nothingToClose: true });
      return;
    }
    const voucherId = `f_close_${year}`;
    closingState.push({ voucherId, year, income, expense });
    json(res, {
      alreadyClosed: false,
      voucherId,
      income,
      expense,
      entries: (income > 0 ? 2 : 0) + (expense > 0 ? 2 : 0),
    });
    return;
  }
  if (path === '/finance/unclose') {
    const year = String(body.year ?? '');
    if (!/^\d{4}$/.test(year)) {
      json(res, null, -1, '缺少 orgId/userId/year 参数');
      return;
    }
    const idx = closingState.findIndex((c) => c.year === year);
    if (idx < 0) {
      json(res, { removed: 0 });
      return;
    }
    closingState.splice(idx, 1);
    json(res, { removed: 1 });
    return;
  }

  // ---- 通知公告 ----
  if (path === '/notices') {
    const notices = [...noticeState].sort((a, b) => (a.publishTime < b.publishTime ? 1 : -1));
    json(res, { notices });
    return;
  }
  if (path === '/notices/save') {
    const id = String(body.id ?? '');
    const title = String(body.title ?? '').trim();
    if (!id) {
      json(res, null, -1, '缺少 id 字段');
      return;
    }
    if (!title) {
      json(res, null, -1, '公告标题不能为空');
      return;
    }
    const existing = noticeState.find((n) => n.id === id);
    const record = {
      id,
      orgId: String(body.orgId ?? 'org_mock'),
      title,
      content: String(body.content ?? ''),
      publisher: String(body.publisher ?? '秘书处'),
      publishTime: body.publishTime ? String(body.publishTime) : new Date().toISOString(),
      isImportant: body.isImportant === true,
      status: String(body.status ?? 'active'),
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      noticeState.unshift(record);
    }
    json(res, null, 0, 'ok');
    return;
  }
  if (path === '/notices/delete') {
    const id = String(body.id ?? '');
    if (!id) {
      json(res, null, -1, '缺少 id 字段');
      return;
    }
    const idx = noticeState.findIndex((n) => n.id === id);
    if (idx >= 0) noticeState.splice(idx, 1);
    json(res, null, 0, 'ok');
    return;
  }
  if (path === '/sensing/posture') {
    json(res, body.orgId === 'org_mock_2' ? postureOrg2() : posture());
    return;
  }
  if (path === '/work-items') {
    const source = body.orgId === 'org_mock_2' ? workItemsOrg2 : workItems;
    const filtered = source.filter(
      (w) =>
        (!body.status || w.status === body.status) &&
        (!body.workItemType || w.workItemType === body.workItemType),
    );
    const items = filtered.slice(page * pageSize, (page + 1) * pageSize);
    json(res, {
      items,
      total: filtered.length,
      openCount: source.filter((w) => w.status === 'open').length,
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
    const item =
      workItems.find((w) => w.id === body.id) ??
      workItemsOrg2.find((w) => w.id === body.id);
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
    const total = automationLogs.length;
    const logs = automationLogs.slice(page * pageSize, (page + 1) * pageSize);
    json(res, { logs, total, page, pageSize, hasMore: (page + 1) * pageSize < total });
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
  if (path === '/documents') {
    const keyword = String(body.keyword ?? '').trim().toLowerCase();
    const onlyMine = body.onlyMine === true;
    const filtered = documents.filter(
      (d) =>
        (!body.domain || d.domain === body.domain) &&
        (!body.status || d.status === body.status) &&
        (!keyword || d.name.toLowerCase().includes(keyword) || d.fileName.toLowerCase().includes(keyword)) &&
        (!onlyMine || d.ownerId === 'u_demo_1'),
    );
    const items = filtered
      .slice(page * pageSize, (page + 1) * pageSize)
      .map((d) => ({ ...d, storagePath: d.ownerId === 'u_demo_1' ? d.storagePath : '' }));
    json(res, {
      items,
      total: filtered.length,
      dataScope: 'org',
      hasMore: (page + 1) * pageSize < filtered.length,
    });
    return;
  }
  if (path === '/documents/init') {
    const id = `doc_${Date.now()}`;
    const domain = String(body.domain ?? 'attachment');
    const doc: MockDocument = {
      id,
      orgId: 'org_demo',
      code: `DOC-2026-${String(documents.length + 1).padStart(6, '0')}`,
      name: String(body.name ?? '未命名文件'),
      fileName: String(body.fileName ?? ''),
      contentType: String(body.contentType ?? 'application/octet-stream'),
      size: Number(body.size ?? 0),
      domain,
      refType: String(body.refType ?? ''),
      refId: String(body.refId ?? ''),
      storagePath: '',
      status: 'uploading',
      downloadCount: 0,
      ownerId: 'u_demo_1',
      ownerName: '张三',
      correlationId: `c_mock_${id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    documents.unshift(doc);
    json(res, {
      documentId: doc.id,
      uploadPath: `_uploads/u_demo_1/${doc.id}`,
      code: doc.code,
      domain: doc.domain,
      correlationId: doc.correlationId,
    });
    return;
  }
  if (path === '/documents/commit') {
    const doc = documents.find((d) => d.id === body.documentId);
    if (!doc) {
      json(res, null, -1, '文件不存在');
      return;
    }
    if (doc.status !== 'uploading' && doc.status !== 'failed') {
      json(res, null, -1, `当前状态不可提交：${doc.status}`);
      return;
    }
    const contentBase64 = String(body.contentBase64 ?? '');
    const size = contentBase64 ? Buffer.from(contentBase64, 'base64').length : doc.size;
    if (contentBase64) {
      documentContents.set(doc.id, contentBase64);
    }
    doc.size = size;
    doc.status = 'active';
    doc.storagePath = `${doc.orgId}/${doc.domain}/${doc.id}`;
    doc.updatedAt = new Date().toISOString();
    json(res, {
      documentId: doc.id,
      storagePath: doc.storagePath,
      status: doc.status,
      size: doc.size,
      correlationId: doc.correlationId,
    });
    return;
  }
  if (path === '/documents/download') {
    const doc = documents.find((d) => d.id === body.documentId);
    if (!doc || doc.status !== 'active') {
      json(res, null, -1, '文件不存在或不可下载');
      return;
    }
    const content =
      documentContents.get(doc.id) ??
      Buffer.from(`社易管 Mock 文件内容：${doc.name}（${doc.fileName}）`).toString('base64');
    doc.downloadCount += 1;
    doc.updatedAt = new Date().toISOString();
    json(res, {
      documentId: doc.id,
      name: doc.name,
      fileName: doc.fileName,
      contentType: doc.contentType,
      size: Buffer.from(content, 'base64').length,
      base64: content,
      correlationId: doc.correlationId,
    });
    return;
  }
  if (path === '/documents/delete') {
    const doc = documents.find((d) => d.id === body.documentId);
    if (!doc) {
      json(res, null, -1, '文件不存在');
      return;
    }
    if (doc.status === 'deleted') {
      json(res, { documentId: doc.id, status: 'deleted' });
      return;
    }
    doc.status = 'deleted';
    doc.storagePath = '';
    documentContents.delete(doc.id);
    doc.updatedAt = new Date().toISOString();
    json(res, { documentId: doc.id, status: 'deleted' });
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
    json(res, {
      rules: RULE_DEFS.map((r) => ({ ...r, enabled: !disabledRules.has(r.id) })),
    });
    return;
  }
  if (path === '/rules/toggle') {
    const ruleId = String(body.ruleId ?? body.id ?? '');
    const rule = RULE_DEFS.find((r) => r.id === ruleId);
    if (!rule) {
      json(res, null, -1, `规则编号无效：${ruleId}`);
      return;
    }
    if (body.enabled === true) {
      disabledRules.delete(rule.id);
    } else {
      disabledRules.add(rule.id);
    }
    json(res, { id: rule.id, enabled: !disabledRules.has(rule.id) });
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
