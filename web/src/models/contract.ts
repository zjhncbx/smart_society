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
  | 'resolution';

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
  ruleId: string;
  ruleName: string;
  status: 'success' | 'failed';
  actions: Record<string, number>;
  runBy: string;
  runAt: string;
  durationMs: number;
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
