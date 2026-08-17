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
