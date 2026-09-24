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
    'license',
    'term',
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

export const documentSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  code: z.string(),
  name: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  domain: z.string(),
  refType: z.string(),
  refId: z.string(),
  storagePath: z.string().optional(),
  status: z.enum(['uploading', 'active', 'deleted', 'failed']),
  downloadCount: z.number(),
  ownerId: z.string(),
  ownerName: z.string(),
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
  orgId: z.string().optional(),
  ruleId: z.string(),
  ruleName: z.string(),
  triggerEventType: z.string().optional(),
  status: z.enum(['success', 'failed']),
  actions: z.record(z.string(), z.number()),
  runBy: z.string(),
  runAt: z.string(),
  durationMs: z.number(),
  errorMessage: z.string().optional(),
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

export const organizationProfileSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  orgType: z.enum(['schoolClub', 'volunteerTeam', 'socialOrg']),
  creditCode: z.string(),
  description: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export const organizationRelationshipSchema = z.object({
  relId: z.string(),
  orgId: z.string(),
  relatedOrgId: z.string(),
  relatedName: z.string().optional(),
  relType: z.enum(['child', 'partner']),
  shareMembers: z.boolean(),
  shareActivities: z.boolean(),
  shareNotices: z.boolean(),
});

export const memberSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  studentNo: z.string(),
  department: z.string(),
  roleId: z.string(),
  roleLabel: z.string(),
  phone: z.string(),
  email: z.string(),
  joinedAt: z.string(),
  status: z.string(),
  syncStatus: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  description: z.string(),
  managerId: z.string(),
  managerName: z.string(),
  status: z.number(),
  statusLabel: z.string(),
  progress: z.number(),
  budget: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  taskCount: z.number(),
  doneTaskCount: z.number(),
  createdAt: z.string(),
});

export const approvalInstanceSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  flowName: z.string(),
  title: z.string(),
  bizType: z.string(),
  bizId: z.string(),
  status: z.enum(['running', 'approved', 'rejected']),
  currentNode: z.string(),
  nodeName: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  canAct: z.boolean(),
});

export const resolutionSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(['pending', 'executing', 'done', 'overdue']),
  responsibleName: z.string(),
  deadline: z.string(),
  correlationId: z.string(),
  createdAt: z.string(),
});

export const financeRecordSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  type: z.enum(['income', 'expense', 'voucher']),
  amount: z.number(),
  categoryLabel: z.string(),
  summary: z.string(),
  counterparty: z.string(),
  projectId: z.string(),
  status: z.string(),
  createdByName: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

export const financeStatsSchema = z.object({
  income: z.number(),
  expense: z.number(),
  balance: z.number(),
});

/** 治理规则（get-rule-config 契约：GR-01~12 静态定义 + 组织级启停状态） */
export const ruleSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  whenText: z.string(),
  ifText: z.string(),
  thenText: z.string(),
  enabled: z.boolean(),
});

export const reportDataSchema = z.object({
  financeTrend: z.array(
    z.object({ month: z.string(), income: z.number(), expense: z.number() }),
  ),
  riskDistribution: z.array(z.object({ name: z.string(), value: z.number() })),
  dqDimensions: z.array(z.object({ name: z.string(), value: z.number() })),
  projectStatus: z.array(z.object({ name: z.string(), value: z.number() })),
  totals: z.object({
    members: z.number(),
    projects: z.number(),
    pendingWorkItems: z.number(),
    dqScore: z.number(),
    successRate: z.number(),
  }),
});

export const trendStatsSchema = z.object({
  eventTrend: z.array(z.object({ date: z.string(), count: z.number() })),
  riskTrend: z.array(z.object({ date: z.string(), count: z.number() })),
  automationTrend: z.array(
    z.object({ date: z.string(), runs: z.number(), successRate: z.number() }),
  ),
  approvalTrend: z.array(z.object({ date: z.string(), avgHours: z.number() })),
  approvalAvgHours: z.number(),
  approvalPreviousAvgHours: z.number(),
  totals: z.object({
    events: z.number(),
    risks: z.number(),
    pendingApprovals: z.number(),
  }),
  anomalies: z.array(z.string()),
});

export const entityGraphSchema = z.object({
  root: z.string(),
  nodes: z.array(z.object({ id: z.string(), type: z.string(), name: z.string() })),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string() })),
  summary: z.record(z.string(), z.number()),
});

// ---- 设置中心（get/save-org-settings、get-roles/save-role、get/save-user-settings）----

export const orgSettingsSchema = z.object({
  orgId: z.string(),
  themeIndex: z.number(),
  /** 角色显示名映射（roleCode → 显示名），云侧以 JSON 字符串存储、读取时已解析 */
  roleLabels: z.record(z.string(), z.string()),
  dingtalk: z.object({
    configured: z.boolean(),
    lastSyncAt: z.number().nullable(),
    lastResult: z.string().nullable(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  }),
});

export const roleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  builtin: z.boolean(),
  /** 权限码列表（云侧 JSON 字符串，读取端已解析） */
  permissions: z.array(z.string()),
  dataScope: z.string(),
  status: z.string(),
});

export const userSettingsSchema = z.object({
  nickname: z.string().nullable(),
  darkMode: z.boolean().nullable(),
});

// ---- 治理对象（证照 / 合规事项 / 任期） ----

export const licenseSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  code: z.string(),
  name: z.string(),
  licenseNo: z.string(),
  issuer: z.string(),
  issuedAt: z.string().nullable(),
  expireAt: z.string().nullable(),
  status: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
});

export const complianceItemSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  code: z.string(),
  name: z.string(),
  itemType: z.string(),
  deadline: z.string().nullable(),
  status: z.string(),
  responsibleMemberId: z.string(),
  responsibleName: z.string(),
});

export const termSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  code: z.string(),
  title: z.string(),
  governanceBody: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  status: z.string(),
});

// ---- 财务扩展 ----

export const approvalFlowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['approve', 'handle', 'cc']),
  roleIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
});

export const approvalFlowSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  bizType: z.string(),
  /** 云侧以 JSON 字符串存储的节点数组 */
  nodes: z.string(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
});

export const openingBalanceSchema = z.object({
  id: z.string().optional(),
  orgId: z.string(),
  year: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number(),
  credit: z.number(),
});

export const ledgerEntrySchema = z.object({
  date: z.string(),
  voucherNo: z.string(),
  summary: z.string(),
  debit: z.number(),
  credit: z.number(),
  runningDebit: z.number(),
  runningCredit: z.number(),
});

export const trialBalanceRowSchema = z.object({
  code: z.string(),
  name: z.string(),
  category: z.string(),
  openDebit: z.number(),
  openCredit: z.number(),
  curDebit: z.number(),
  curCredit: z.number(),
  endDebit: z.number(),
  endCredit: z.number(),
});

export const accountingReportsSchema = z.object({
  year: z.string(),
  closingExists: z.boolean(),
  trialBalance: z.object({
    rows: z.array(trialBalanceRowSchema),
    totals: z.object({
      openDebit: z.number(),
      openCredit: z.number(),
      curDebit: z.number(),
      curCredit: z.number(),
      endDebit: z.number(),
      endCredit: z.number(),
    }),
  }),
});

// ---- 公告 ----

export const noticeSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  content: z.string(),
  publisher: z.string(),
  publishTime: z.string(),
  isImportant: z.boolean(),
  status: z.string(),
});
