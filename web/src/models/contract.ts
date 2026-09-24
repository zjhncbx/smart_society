/**
 * 与云侧数据契约对齐的 DTO 类型（docs/云数据契约.md）。
 * 仅声明 Web 消费所需字段，服务端返回以 Zod 校验为准。
 */

export interface UserOrganization {
  id: string;
  userId: string;
  orgId: string;
  role: 'admin' | 'member';
  roleId?: string;
  dataScope?: string;
  status?: string;
  memberId?: string;
}

export interface PermissionBundle {
  roleId: string;
  roleName: string;
  permissions: string[];
  dataScope: string;
  isAdmin: boolean;
}

export type WorkItemType =
  | 'approval'
  | 'auto_task'
  | 'project_task'
  | 'risk'
  | 'data_quality'
  | 'compliance'
  | 'resolution'
  | 'license'
  | 'term';

export interface WorkItem {
  id: string;
  orgId: string;
  workItemType: WorkItemType;
  originType: string;
  originId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'done' | 'cancelled';
  deadline?: string;
  slaDeadline?: string;
  escalationLevel: number;
  completionCondition: string;
  sourceRuleId?: string;
  sourceRuleName?: string;
  correlationId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessEvent {
  id: string;
  orgId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  actorId: string;
  actorName: string;
  level: 'info' | 'warning' | 'risk';
  correlationId: string;
  occurredAt: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  actorId: string;
  actorName: string;
  before?: string;
  after?: string;
  changeReason?: string;
  correlationId?: string;
  createdAt: string;
}

export interface RiskAlert {
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
  ownerId?: string;
  ownerName?: string;
  deadline?: string;
  correlationId: string;
  createdAt: string;
}

export interface DataQualityIssue {
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

export interface DataQualitySnapshot {
  score: number;
  dimensions: Record<string, number>;
  counts: Record<string, number>;
  checkedAt?: string;
}

export interface AutomationRunLog {
  id: string;
  orgId?: string;
  ruleId: string;
  ruleName: string;
  triggerEventType?: string;
  status: 'success' | 'failed';
  /** 动作计数（云侧以 JSON 字符串存储，endpoint 已解析为对象） */
  actions: Record<string, number>;
  runBy: string;
  runAt: string;
  durationMs: number;
  errorMessage?: string;
  correlationId?: string;
}

export interface OrgPosture {
  status: '正常' | '关注' | '需介入';
  pendingCount: number;
  riskCount: number;
  warningCount: number;
  dqOpenCount: number;
  escalatedCount: number;
  topConcerns: Array<{ level: 'risk' | 'warning' | 'data'; text: string }>;
}

export interface OrganizationProfile {
  orgId: string;
  name: string;
  orgType: 'schoolClub' | 'volunteerTeam' | 'socialOrg';
  creditCode: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface OrganizationRelationship {
  relId: string;
  orgId: string;
  relatedOrgId: string;
  relatedName?: string;
  relType: 'child' | 'partner';
  shareMembers: boolean;
  shareActivities: boolean;
  shareNotices: boolean;
}

export interface Member {
  id: string;
  orgId: string;
  name: string;
  studentNo: string;
  department: string;
  roleId: string;
  roleLabel: string;
  phone: string;
  email: string;
  joinedAt: string;
  status: string;
  syncStatus: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  status: number;
  statusLabel: string;
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  taskCount: number;
  doneTaskCount: number;
  createdAt: string;
}

export interface ApprovalInstance {
  id: string;
  orgId: string;
  flowName: string;
  title: string;
  bizType: string;
  bizId: string;
  status: 'running' | 'approved' | 'rejected';
  currentNode: string;
  nodeName: string;
  createdByName: string;
  createdAt: string;
  canAct: boolean;
}

export interface Resolution {
  id: string;
  orgId: string;
  title: string;
  content: string;
  status: 'pending' | 'executing' | 'done' | 'overdue';
  responsibleName: string;
  deadline: string;
  correlationId: string;
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  orgId: string;
  type: 'income' | 'expense' | 'voucher';
  amount: number;
  categoryLabel: string;
  summary: string;
  counterparty: string;
  projectId: string;
  status: string;
  createdByName: string;
  date: string;
  createdAt: string;
}

export interface FinanceStats {
  income: number;
  expense: number;
  balance: number;
}

/** 治理规则（get-rule-config 契约：GR-01~12 静态定义 + 组织级启停状态） */
export interface Rule {
  id: string;
  name: string;
  category: string;
  whenText: string;
  ifText: string;
  thenText: string;
  enabled: boolean;
}

export interface ReportData {
  financeTrend: Array<{ month: string; income: number; expense: number }>;
  riskDistribution: Array<{ name: string; value: number }>;
  dqDimensions: Array<{ name: string; value: number }>;
  projectStatus: Array<{ name: string; value: number }>;
  totals: {
    members: number;
    projects: number;
    pendingWorkItems: number;
    dqScore: number;
    successRate: number;
  };
}

export interface TrendStats {
  eventTrend: Array<{ date: string; count: number }>;
  riskTrend: Array<{ date: string; count: number }>;
  automationTrend: Array<{ date: string; runs: number; successRate: number }>;
  approvalTrend: Array<{ date: string; avgHours: number }>;
  approvalAvgHours: number;
  approvalPreviousAvgHours: number;
  totals: { events: number; risks: number; pendingApprovals: number };
  anomalies: string[];
}

export interface EntityGraphNode {
  id: string;
  type: string;
  name: string;
}

export interface EntityGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface EntityGraph {
  root: string;
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  summary: Record<string, number>;
}

// ---- 设置中心 ----

export interface OrgSettings {
  orgId: string;
  themeIndex: number;
  /** 角色显示名映射（roleCode → 显示名）；云侧以 JSON 字符串存储，读取端解析 */
  roleLabels: Record<string, string>;
  dingtalk: {
    configured: boolean;
    lastSyncAt: number | null;
    lastResult: string | null;
    /** 凭证仅组织管理员可见 */
    clientId?: string;
    clientSecret?: string;
  };
}

export interface RoleDef {
  id: string;
  code: string;
  name: string;
  builtin: boolean;
  permissions: string[];
  dataScope: string;
  status: string;
}

export interface UserSettings {
  nickname: string | null;
  darkMode: boolean | null;
}

// ---- 治理对象（证照 / 合规事项 / 任期） ----

export interface License {
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
}

export interface ComplianceItem {
  id: string;
  orgId: string;
  code: string;
  name: string;
  itemType: string;
  deadline: string | null;
  status: string;
  responsibleMemberId: string;
  responsibleName: string;
}

export interface Term {
  id: string;
  orgId: string;
  code: string;
  title: string;
  governanceBody: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

// ---- 财务扩展（审批流 / 期初余额 / 总账 / 结账） ----

export interface ApprovalFlowNode {
  id: string;
  name: string;
  type: 'approve' | 'handle' | 'cc';
  roleIds?: string[];
  userIds?: string[];
}

export interface ApprovalFlow {
  id: string;
  orgId: string;
  name: string;
  bizType: string;
  /** 云侧以 JSON 字符串存储的 ApprovalFlowNode[] */
  nodes: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface OpeningBalance {
  id?: string;
  orgId: string;
  year: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface LedgerEntry {
  date: string;
  voucherNo: string;
  summary: string;
  debit: number;
  credit: number;
  runningDebit: number;
  runningCredit: number;
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  category: string;
  openDebit: number;
  openCredit: number;
  curDebit: number;
  curCredit: number;
  endDebit: number;
  endCredit: number;
}

export interface AccountingReports {
  year: string;
  closingExists: boolean;
  trialBalance: {
    rows: TrialBalanceRow[];
    totals: {
      openDebit: number;
      openCredit: number;
      curDebit: number;
      curCredit: number;
      endDebit: number;
      endCredit: number;
    };
  };
}

/** close-period 返回（三种分支：已结账 / 无可结转 / 结转成功） */
export interface ClosePeriodResult {
  alreadyClosed: boolean;
  voucherId: string;
  /** 结转成功分支返回 */
  income?: number;
  expense?: number;
  entries?: number;
  /** 本年度无已生效收支凭证分支 */
  nothingToClose?: boolean;
}

// ---- 公告 ----

export interface NoticeItem {
  id: string;
  orgId: string;
  title: string;
  content: string;
  publisher: string;
  publishTime: string;
  isImportant: boolean;
  status: string;
}
