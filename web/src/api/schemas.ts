import { z } from 'zod';

/** 统一 { ret } 信封（宽松：允许 ret 内嵌或平铺） */
export const retEnvelopeSchema = z.object({
  ret: z
    .object({
      code: z.number(),
      message: z.string().optional(),
      data: z.unknown().optional(),
    })
    .optional(),
  code: z.number().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    hasMore: z.boolean().optional(),
  });

export const workItemSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  workItemType: z.enum([
    'approval',
    'auto_task',
    'project_task',
    'risk',
    'data_quality',
    'compliance',
    'resolution',
  ]),
  originType: z.string(),
  originId: z.string(),
  title: z.string(),
  description: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'done', 'cancelled']),
  deadline: z.string().optional(),
  slaDeadline: z.string().optional(),
  escalationLevel: z.number(),
  completionCondition: z.string(),
  sourceRuleId: z.string().optional(),
  sourceRuleName: z.string().optional(),
  correlationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const permissionBundleSchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
  permissions: z.array(z.string()),
  dataScope: z.string(),
  isAdmin: z.boolean(),
});

export const riskAlertSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  kind: z.enum(['risk', 'warning']),
  title: z.string(),
  description: z.string(),
  sourceRuleId: z.string(),
  sourceRuleName: z.string(),
  sourceEntityType: z.string(),
  sourceEntityId: z.string(),
  sourceEntityName: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'monitoring', 'resolved']),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  deadline: z.string().optional(),
  correlationId: z.string(),
  createdAt: z.string(),
});

export const dataQualityIssueSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  category: z.string(),
  entityName: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'resolved', 'ignored']),
  description: z.string(),
  checkCount: z.number(),
  createdAt: z.string(),
});

export const dataQualitySnapshotSchema = z.object({
  score: z.number(),
  dimensions: z.record(z.string(), z.number()),
  counts: z.record(z.string(), z.number()),
  checkedAt: z.string().optional(),
});

export const automationRunLogSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  status: z.enum(['success', 'failed']),
  actions: z.record(z.string(), z.number()),
  runBy: z.string(),
  runAt: z.string(),
  durationMs: z.number(),
  correlationId: z.string().optional(),
});

export const orgPostureSchema = z.object({
  status: z.enum(['正常', '关注', '需介入']),
  pendingCount: z.number(),
  riskCount: z.number(),
  warningCount: z.number(),
  dqOpenCount: z.number(),
  escalatedCount: z.number(),
  topConcerns: z.array(
    z.object({
      level: z.enum(['risk', 'warning', 'data']),
      text: z.string(),
    }),
  ),
});

export const auditLogSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityName: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
  changeReason: z.string().optional(),
  correlationId: z.string().optional(),
  createdAt: z.string(),
});
