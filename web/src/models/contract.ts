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
