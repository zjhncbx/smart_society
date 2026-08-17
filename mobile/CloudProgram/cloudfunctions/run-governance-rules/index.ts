import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AutoTask } from './AutoTask';
import { RiskAlert } from './RiskAlert';
import { AutomationRunLog } from './AutomationRunLog';
import { Member } from './Member';
import { Project } from './Project';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalInstance } from './ApprovalInstance';
import { Organization } from './Organization';
import { DataQualityIssue } from './DataQualityIssue';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';

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
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;
const DAY_MS = 86400000;

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

function parseTasks(raw: string): any[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function sanitizeId(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

interface TaskHit {
  ruleId: string;
  ruleName: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  assigneeId: string;
  assigneeName: string;
  priority: string;
  slaDays: number;
  escalationLevel: number;
}

interface RiskHit {
  kind: string;
  ruleId: string;
  ruleName: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  severity: string;
  ownerId: string;
  ownerName: string;
  deadlineDays: number;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('run-governance-rules called');
  const startedAt = Date.now();

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '系统');
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

    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const projectCol: CloudDBCollection<Project> = db.collection(Project);
    const financeCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const approvalCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
    const dqCol: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
    const taskCol: CloudDBCollection<AutoTask> = db.collection(AutoTask);
    const riskCol: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);

    const members = await queryAllByOrg(memberCol, orgId);
    const projects = await queryAllByOrg(projectCol, orgId);
    const finances = await queryAllByOrg(financeCol, orgId);
    const approvals = (await queryAllByOrg(approvalCol, orgId)).filter((a) => a.status === 'running');
    const orgs = await orgCol.query().equalTo('orgId', orgId).get();
    const org = orgs.length > 0 ? orgs[0] : null;
    const dqIssues = (await queryAllByOrg(dqCol, orgId)).filter((i) => i.status === 'open');
    const existingTasks = await queryAllByOrg(taskCol, orgId);
    const existingRisks = await queryAllByOrg(riskCol, orgId);

    const memberById = new Map<string, Member>();
    for (const m of members) memberById.set(m.id, m);
    const memberName = (id: string): string => {
      const m = memberById.get(id);
      return m ? m.name : '';
    };

    const taskHits: TaskHit[] = [];
    const riskHits: RiskHit[] = [];
    const now = new Date();
    const today = startOfDay(now);

    // ---- GR-06 关键治理职位空缺 ----
    const keyRoles: Record<string, string[]> = {
      schoolClub: ['president'],
      volunteerTeam: ['leader'],
      socialOrg: ['chairman', 'secretary_general', 'chief_supervisor'],
    };
    const roleLabels: Record<string, Record<string, string>> = {
      schoolClub: { president: '社长' },
      volunteerTeam: { leader: '队长' },
      socialOrg: {
        chairman: '会长',
        secretary_general: '秘书长',
        chief_supervisor: '监事长',
      },
    };
    const orgType = org ? String(org.orgType || '') : '';
    const keyRoleIds = keyRoles[orgType] || [];
    if (keyRoleIds.length > 0) {
      const present = new Set(members.filter((m) => m.roleId).map((m) => m.roleId));
      for (const roleId of keyRoleIds) {
        if (present.has(roleId)) continue;
        const label = (roleLabels[orgType] || {})[roleId] || roleId;
        riskHits.push({
          kind: 'risk', ruleId: 'GR-06', ruleName: '关键治理职位空缺',
          title: `关键职位空缺：${label}`,
          description: `组织「${org ? org.name : ''}」当前没有在职的${label}，请尽快完成任职安排。`,
          entityType: 'organization', entityId: orgId, entityName: org ? org.name : '',
          severity: 'high', ownerId: '', ownerName: '组织管理员',
          deadlineDays: 7,
        });
        taskHits.push({
          ruleId: 'GR-06', ruleName: '关键治理职位空缺',
          title: `安排${label}任职`,
          description: `组织缺少${label}，请启动任职变更或换届流程。`,
          entityType: 'organization', entityId: orgId, entityName: org ? org.name : '',
          assigneeId: '', assigneeName: '组织管理员',
          priority: 'high', slaDays: 7, escalationLevel: 0,
        });
      }
    }

    // ---- GR-07 审批驳回次数异常 ----
    for (const a of approvals) {
      let rejectCount = 0;
      try {
        const history = JSON.parse(a.history || '[]');
        if (Array.isArray(history)) {
          rejectCount = history.filter((h: any) => h && h.action === 'reject').length;
        }
      } catch {
        rejectCount = 0;
      }
      if (rejectCount < 2) continue;
      const title = String(a.title || a.flowName || '审批');
      riskHits.push({
        kind: 'warning', ruleId: 'GR-07', ruleName: '审批驳回异常',
        title: `审批多次驳回：${title}`,
        description: `流程「${a.flowName || ''}」已被驳回 ${rejectCount} 次，可能存在提交材料或流程配置问题。`,
        entityType: 'approval', entityId: a.id, entityName: title,
        severity: 'medium', ownerId: '', ownerName: '发起人',
        deadlineDays: 5,
      });
      taskHits.push({
        ruleId: 'GR-07', ruleName: '审批驳回异常',
        title: `处理多次驳回审批：${title}`,
        description: `该审批已驳回 ${rejectCount} 次，请核对驳回意见并完善后重新提交。`,
        entityType: 'approval', entityId: a.id, entityName: title,
        assigneeId: a.createdBy, assigneeName: a.createdByName || '发起人',
        priority: 'high', slaDays: 3, escalationLevel: 0,
      });
    }

    // ---- GR-08 项目长时间未更新 ----
    const staleDays = 60 * DAY_MS;
    for (const p of projects) {
      if (p.status === 3) continue;
      const lastUpdate = p.updatedAt ? p.updatedAt.getTime() : p.createdAt.getTime();
      if (now.getTime() - lastUpdate < staleDays) continue;
      const managerId = String(p.managerId || '');
      const managerName = memberName(managerId);
      const days = Math.floor((now.getTime() - lastUpdate) / DAY_MS);
      riskHits.push({
        kind: 'warning', ruleId: 'GR-08', ruleName: '项目长时间未更新',
        title: `项目「${p.name}」长期未更新`,
        description: `项目已 ${days} 天没有更新进度，请确认是否仍在推进。`,
        entityType: 'project', entityId: p.id, entityName: p.name,
        severity: 'medium', ownerId: managerId, ownerName: managerName,
        deadlineDays: 7,
      });
      taskHits.push({
        ruleId: 'GR-08', ruleName: '项目长时间未更新',
        title: `更新项目进度：${p.name}`,
        description: `项目已 ${days} 天未更新，请补充最新进度或调整状态。`,
        entityType: 'project', entityId: p.id, entityName: p.name,
        assigneeId: managerId, assigneeName: managerName,
        priority: 'medium', slaDays: 5, escalationLevel: 0,
      });
    }

    // ---- GR-01 任务逾期自动升级 ----
    for (const p of projects) {
      for (const t of parseTasks(p.tasks)) {
        if (Number(t.status) === 2) continue;
        const due = t.dueDate ? new Date(t.dueDate) : null;
        if (!due || due.getTime() >= today.getTime()) continue;
        const overdueDays = Math.floor((today.getTime() - startOfDay(due).getTime()) / DAY_MS);
        const escalation = overdueDays >= 14 ? 2 : overdueDays >= 7 ? 1 : 0;
        const assigneeId = String(t.assigneeId || p.managerId || '');
        const assigneeName = assigneeId ? memberName(assigneeId) : '';
        taskHits.push({
          ruleId: 'GR-01', ruleName: '任务逾期自动升级',
          title: `任务逾期：${t.title || '未命名任务'}`,
          description: `项目「${p.name}」的任务已逾期 ${overdueDays} 天，请及时处理。`,
          entityType: 'task', entityId: `${p.id}:${t.id}`,
          entityName: String(t.title || '任务'),
          assigneeId, assigneeName,
          priority: escalation >= 2 ? 'high' : 'medium',
          slaDays: 3,
          escalationLevel: escalation,
        });
        if (overdueDays >= 14) {
          riskHits.push({
            kind: 'risk', ruleId: 'GR-01', ruleName: '任务逾期自动升级',
            title: `项目「${p.name}」任务严重逾期`,
            description: `任务「${t.title || '未命名任务'}」已逾期 ${overdueDays} 天，超过 14 天升级为风险，需管理层介入。`,
            entityType: 'task', entityId: `${p.id}:${t.id}`,
            entityName: String(t.title || '任务'),
            severity: 'high', ownerId: assigneeId, ownerName: assigneeName,
            deadlineDays: 3,
          });
        } else if (overdueDays >= 7) {
          riskHits.push({
            kind: 'warning', ruleId: 'GR-01', ruleName: '任务逾期自动升级',
            title: `项目「${p.name}」任务逾期预警`,
            description: `任务「${t.title || '未命名任务'}」已逾期 ${overdueDays} 天，将于 14 天升级为风险。`,
            entityType: 'task', entityId: `${p.id}:${t.id}`,
            entityName: String(t.title || '任务'),
            severity: 'medium', ownerId: assigneeId, ownerName: assigneeName,
            deadlineDays: 7,
          });
        }
      }
    }

    // ---- GR-02 项目进度偏差 / 延期 ----
    for (const p of projects) {
      if (p.status === 3) continue;
      const managerId = String(p.managerId || '');
      const managerName = memberName(managerId);
      const duration = Math.max(1, Math.round((p.endDate.getTime() - p.startDate.getTime()) / DAY_MS));
      const elapsed = Math.max(0, Math.round((today.getTime() - p.startDate.getTime()) / DAY_MS));
      if (p.endDate.getTime() < today.getTime()) {
        riskHits.push({
          kind: 'risk', ruleId: 'GR-02', ruleName: '项目进度偏差',
          title: `项目「${p.name}」已延期`,
          description: `项目计划 ${p.endDate.toISOString().slice(0, 10)} 结束，当前进度 ${p.progress}%。`,
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'high', ownerId: managerId, ownerName: managerName,
          deadlineDays: 5,
        });
        taskHits.push({
          ruleId: 'GR-02', ruleName: '项目进度偏差',
          title: `处理项目延期：${p.name}`,
          description: `项目「${p.name}」已超过计划结束日期，请更新计划并处理延期。`,
          entityType: 'project', entityId: p.id, entityName: p.name,
          assigneeId: managerId, assigneeName: managerName,
          priority: 'high', slaDays: 5, escalationLevel: 0,
        });
      } else if (duration > 7 && elapsed / duration > 0.6 && p.progress < 40) {
        riskHits.push({
          kind: 'warning', ruleId: 'GR-02', ruleName: '项目进度偏差',
          title: `项目「${p.name}」进度落后`,
          description: `项目已执行 ${Math.round(elapsed / duration * 100)}% 时间，完成率仅 ${p.progress}%，预计延期。`,
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'medium', ownerId: managerId, ownerName: managerName,
          deadlineDays: 7,
        });
      }
    }

    // ---- GR-03 审批 SLA 超时 ----
    for (const a of approvals) {
      const ageDays = Math.floor((now.getTime() - (a.createdAt ? a.createdAt.getTime() : now.getTime())) / DAY_MS);
      if (ageDays < 3) continue;
      const title = String(a.title || a.flowName || '审批');
      const risk = ageDays >= 7;
      riskHits.push({
        kind: risk ? 'risk' : 'warning', ruleId: 'GR-03', ruleName: '审批SLA超时',
        title: `审批阻塞：${title}`,
        description: `流程「${a.flowName || ''}」已停留 ${ageDays} 天未处理，${risk ? '需管理层介入' : '请尽快处理'}。`,
        entityType: 'approval', entityId: a.id, entityName: title,
        severity: risk ? 'high' : 'medium',
        ownerId: '', ownerName: '当前节点处理人',
        deadlineDays: risk ? 3 : 5,
      });
    }

    // ---- GR-04 数据质量问题自动生成修复任务 ----
    for (const issue of dqIssues) {
      if (issue.severity === 'low') continue;
      const entityName = `${issue.ruleName}：${issue.entityName || issue.description}`;
      taskHits.push({
        ruleId: 'GR-04', ruleName: '数据质量自动任务',
        title: `修复数据问题：${issue.ruleName}`,
        description: `${entityName}。完成条件：问题修复并通过数据质量校验。`,
        entityType: 'quality', entityId: issue.id, entityName,
        assigneeId: issue.assignedTo || '', assigneeName: issue.assignedToName || '',
        priority: issue.severity === 'high' ? 'high' : 'medium',
        slaDays: 7, escalationLevel: 0,
      });
    }

    // ---- GR-05 预算超支 ----
    const expenseByProject = new Map<string, number>();
    for (const r of finances) {
      if (r.status !== 'approved' || r.type !== 'expense' || !r.projectId) continue;
      expenseByProject.set(r.projectId, (expenseByProject.get(r.projectId) || 0) + Number(r.amount || 0));
    }
    for (const p of projects) {
      const expense = expenseByProject.get(p.id) || 0;
      if (p.budget <= 0 || expense <= p.budget) continue;
      const managerId = String(p.managerId || '');
      const managerName = memberName(managerId);
      riskHits.push({
        kind: 'warning', ruleId: 'GR-05', ruleName: '预算执行异常',
        title: `项目「${p.name}」预算超支`,
        description: `项目支出 ¥${expense.toFixed(2)} 已超过预算 ¥${p.budget.toFixed(2)}，超支 ¥${(expense - p.budget).toFixed(2)}。`,
        entityType: 'project', entityId: p.id, entityName: p.name,
        severity: 'medium', ownerId: managerId, ownerName: managerName,
        deadlineDays: 7,
      });
      taskHits.push({
        ruleId: 'GR-05', ruleName: '预算执行异常',
        title: `处理预算超支：${p.name}`,
        description: `项目「${p.name}」预算超支，请核对支出或发起预算调整。`,
        entityType: 'project', entityId: p.id, entityName: p.name,
        assigneeId: managerId, assigneeName: managerName,
        priority: 'high', slaDays: 7, escalationLevel: 0,
      });
    }

    // ---- 合并落库：自动任务 ----
    const taskById = new Map<string, AutoTask>();
    for (const t of existingTasks) taskById.set(t.id, t);
    const taskHitsById = new Map<string, TaskHit>();
    for (const h of taskHits) taskHitsById.set(`${h.ruleId}|${h.entityId}`, h);

    const taskUpserts: AutoTask[] = [];
    let newTasks = 0;
    for (const h of taskHits) {
      const id = `at_${orgId}_${h.ruleId}_${sanitizeId(h.entityId)}`;
      const old = taskById.get(id);
      const task = new AutoTask();
      task.id = id;
      task.orgId = orgId;
      task.title = h.title;
      task.description = h.description;
      task.sourceType = 'auto';
      task.sourceRuleId = h.ruleId;
      task.sourceRuleName = h.ruleName;
      task.sourceEntityType = h.entityType;
      task.sourceEntityId = h.entityId;
      task.sourceEntityName = h.entityName;
      task.triggerEventId = '';
      task.assigneeId = h.assigneeId;
      task.assigneeName = h.assigneeName;
      task.priority = h.priority;
      task.status = 'open';
      task.slaDeadline = new Date(now.getTime() + h.slaDays * DAY_MS);
      task.escalationLevel = Math.max(old ? old.escalationLevel : 0, h.escalationLevel);
      task.escalatedAt = h.escalationLevel > 0 ? now : old ? old.escalatedAt : null;
      task.completedAt = null;
      task.completedBy = '';
      task.completedByName = '';
      task.createdAt = old ? old.createdAt : now;
      task.updatedAt = now;
      if (!old) newTasks += 1;
      taskUpserts.push(task);
    }
    if (taskUpserts.length > 0) await taskCol.upsert(taskUpserts);

    // 自动关闭：规则不再命中且仍 open 的任务
    const autoClosedTasks: AutoTask[] = [];
    for (const t of existingTasks) {
      if (t.status !== 'open') continue;
      if (taskHitsById.has(`${t.sourceRuleId}|${t.sourceEntityId}`)) continue;
      t.status = 'done';
      t.completedAt = now;
      t.completedBy = 'system';
      t.completedByName = '自动化规则';
      t.updatedAt = now;
      autoClosedTasks.push(t);
    }
    if (autoClosedTasks.length > 0) await taskCol.upsert(autoClosedTasks);

    // ---- 合并落库：风险/预警 ----
    const riskById = new Map<string, RiskAlert>();
    for (const r of existingRisks) riskById.set(r.id, r);
    const riskHitsById = new Map<string, RiskHit>();
    for (const h of riskHits) riskHitsById.set(`${h.ruleId}|${h.entityId}`, h);

    const riskUpserts: RiskAlert[] = [];
    let newRisks = 0;
    for (const h of riskHits) {
      const id = `ra_${orgId}_${h.ruleId}_${sanitizeId(h.entityId)}`;
      const old = riskById.get(id);
      const risk = new RiskAlert();
      risk.id = id;
      risk.orgId = orgId;
      risk.kind = h.kind;
      risk.title = h.title;
      risk.description = h.description;
      risk.sourceRuleId = h.ruleId;
      risk.sourceRuleName = h.ruleName;
      risk.sourceEntityType = h.entityType;
      risk.sourceEntityId = h.entityId;
      risk.sourceEntityName = h.entityName;
      risk.triggerEventId = '';
      risk.severity = h.severity;
      risk.status = 'open';
      risk.ownerId = h.ownerId;
      risk.ownerName = h.ownerName;
      risk.deadline = new Date(now.getTime() + h.deadlineDays * DAY_MS);
      risk.resolvedAt = null;
      risk.resolvedBy = '';
      risk.resolvedByName = '';
      risk.metadata = '{}';
      risk.createdAt = old ? old.createdAt : now;
      risk.updatedAt = now;
      if (!old) newRisks += 1;
      riskUpserts.push(risk);
    }
    if (riskUpserts.length > 0) await riskCol.upsert(riskUpserts);

    const autoResolvedRisks: RiskAlert[] = [];
    for (const r of existingRisks) {
      if (r.status === 'resolved') continue;
      if (riskHitsById.has(`${r.sourceRuleId}|${r.sourceEntityId}`)) continue;
      r.status = 'resolved';
      r.resolvedAt = now;
      r.resolvedBy = 'system';
      r.resolvedByName = '自动化规则';
      r.updatedAt = now;
      autoResolvedRisks.push(r);
    }
    if (autoResolvedRisks.length > 0) await riskCol.upsert(autoResolvedRisks);

    // ---- 审计日志 ----
    const logCol: CloudDBCollection<AutomationRunLog> = db.collection(AutomationRunLog);
    const log = new AutomationRunLog();
    log.id = 'arl' + Date.now() + Math.floor(Math.random() * 100000);
    log.orgId = orgId;
    log.ruleId = 'GR-ALL';
    log.ruleName = '规则引擎批量运行';
    log.triggerEventType = 'manual';
    log.status = 'success';
    log.actions = JSON.stringify({
      taskCreated: newTasks,
      taskUpserted: taskUpserts.length,
      taskAutoClosed: autoClosedTasks.length,
      riskCreated: newRisks,
      riskUpserted: riskUpserts.length,
      riskAutoResolved: autoResolvedRisks.length,
      ruleHits: { task: taskHits.length, risk: riskHits.length },
    });
    log.runBy = userId;
    log.runAt = now;
    log.durationMs = Date.now() - startedAt;
    log.errorMessage = '';
    log.metadata = JSON.stringify({ userName });
    await logCol.upsert([log]);

    // 新风险/预警进入事件流（有节制：仅新增时记录）
    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const events: BusinessEvent[] = [];
    for (const r of riskUpserts) {
      const isNew = !riskById.has(r.id);
      if (!isNew) continue;
      const ev = new BusinessEvent();
      ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
      ev.orgId = orgId;
      ev.eventType = 'notified';
      ev.entityType = 'risk';
      ev.entityId = r.id;
      ev.entityName = r.title;
      ev.actorId = 'system';
      ev.actorName = '自动化规则';
      ev.level = r.kind === 'risk' ? 'risk' : 'warning';
      ev.metadata = JSON.stringify({ ruleId: r.sourceRuleId, ruleName: r.sourceRuleName, severity: r.severity });
      ev.sourceType = 'system';
      ev.sourceId = log.id;
      ev.version = 1;
      ev.isDeleted = false;
      ev.occurredAt = now;
      ev.createdAt = now;
      events.push(ev);
    }
    if (events.length > 0) await eventCol.upsert(events);

    logger.info(`run-governance-rules done: orgId=${orgId}, tasks=${taskHits.length}, risks=${riskHits.length}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          tasks: {
            created: newTasks,
            total: taskUpserts.length,
            autoClosed: autoClosedTasks.length,
          },
          risks: {
            created: newRisks,
            total: riskUpserts.length,
            autoResolved: autoResolvedRisks.length,
          },
          durationMs: Date.now() - startedAt,
        },
      },
    });
  } catch (err: any) {
    logger.error(`run-governance-rules error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
