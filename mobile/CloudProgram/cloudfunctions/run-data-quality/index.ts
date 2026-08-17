import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { DataQualityIssue } from './DataQualityIssue';
import { DataQualitySnapshot } from './DataQualitySnapshot';
import { Member } from './Member';
import { Project } from './Project';
import { FinanceRecord } from './FinanceRecord';
import { Organization } from './Organization';
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

function parseMilestones(raw: string): any[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function validMobile(phone: string): boolean {
  const v = String(phone || '').trim();
  if (!v) return false;
  return /^1[3-9]\d{9}$/.test(v) || /^0\d{2,3}-?\d{7,8}$/.test(v) || /^\d{7,12}$/.test(v);
}

function validEmail(email: string): boolean {
  const v = String(email || '').trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

interface DetectedIssue {
  ruleId: string;
  ruleName: string;
  category: string;
  entityType: string;
  entityId: string;
  entityName: string;
  severity: string;
  description: string;
  detail: any;
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  member: 5,
  project: 6,
  finance: 8,
  org: 10,
};

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('run-data-quality called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '管理员');
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
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);

    const members = await queryAllByOrg(memberCol, orgId);
    const projects = await queryAllByOrg(projectCol, orgId);
    const finances = await queryAllByOrg(financeCol, orgId);
    const orgs = await orgCol.query().equalTo('orgId', orgId).get();
    const org = orgs.length > 0 ? orgs[0] : null;

    const detected: DetectedIssue[] = [];
    const memberIds = new Set<string>();
    for (const m of members) memberIds.add(m.id);

    // ---- 会员档案 ----
    for (const m of members) {
      const name = String(m.name || '').trim();
      const phone = String(m.phone || '').trim();
      const email = String(m.email || '').trim();
      const detail: any = { memberId: m.id };
      if (!name) {
        detected.push({
          ruleId: 'DQ-001', ruleName: '成员必填缺失', category: 'member',
          entityType: 'member', entityId: m.id, entityName: m.id,
          severity: 'high', description: '成员姓名为空',
          detail,
        });
      } else {
        if (!phone && !email) {
          detected.push({
            ruleId: 'DQ-001', ruleName: '成员必填缺失', category: 'member',
            entityType: 'member', entityId: m.id, entityName: name,
            severity: 'medium', description: '缺少有效联系方式（手机/邮箱）',
            detail,
          });
        }
        if (phone && !validMobile(phone)) {
          detected.push({
            ruleId: 'DQ-002', ruleName: '无效联系方式', category: 'member',
            entityType: 'member', entityId: m.id, entityName: name,
            severity: 'medium', description: `手机号格式无效：${phone}`,
            detail: { ...detail, phone },
          });
        }
        if (email && !validEmail(email)) {
          detected.push({
            ruleId: 'DQ-002', ruleName: '无效联系方式', category: 'member',
            entityType: 'member', entityId: m.id, entityName: name,
            severity: 'medium', description: `邮箱格式无效：${email}`,
            detail: { ...detail, email },
          });
        }
        if (m.joinedAt && m.joinedAt.getTime() > Date.now() + 86400000) {
          detected.push({
            ruleId: 'DQ-004', ruleName: '日期逻辑错误', category: 'member',
            entityType: 'member', entityId: m.id, entityName: name,
            severity: 'medium', description: '入会时间晚于当前日期',
            detail: { ...detail, joinedAt: m.joinedAt.toISOString() },
          });
        }
      }
    }

    // 重复成员：同手机号（含同名），以及同名且缺少联系方式
    const byPhone = new Map<string, Member[]>();
    const byNameNoPhone = new Map<string, Member[]>();
    for (const m of members) {
      const name = String(m.name || '').trim();
      const phone = String(m.phone || '').trim();
      if (phone) {
        const list = byPhone.get(phone) || [];
        list.push(m);
        byPhone.set(phone, list);
      } else if (name) {
        const list = byNameNoPhone.get(name) || [];
        list.push(m);
        byNameNoPhone.set(name, list);
      }
    }
    byPhone.forEach((list, phone) => {
      if (list.length < 2) return;
      const names = Array.from(new Set(list.map((m) => String(m.name || '').trim())));
      const key = list.map((m) => m.id).sort().join('_');
      detected.push({
        ruleId: 'DQ-003', ruleName: '重复成员', category: 'member',
        entityType: 'member', entityId: `dup_phone_${key}`,
        entityName: names.join('/'),
        severity: 'high',
        description: `${list.length} 名成员使用同一手机号 ${phone}`,
        detail: { phone, memberIds: list.map((m) => m.id) },
      });
    });
    byNameNoPhone.forEach((list, name) => {
      if (list.length < 2) return;
      const key = list.map((m) => m.id).sort().join('_');
      detected.push({
        ruleId: 'DQ-003', ruleName: '重复成员', category: 'member',
        entityType: 'member', entityId: `dup_name_${key}`,
        entityName: name,
        severity: 'medium',
        description: `${list.length} 名同名成员缺少联系方式，疑似重复`,
        detail: { memberIds: list.map((m) => m.id) },
      });
    });

    // ---- 项目数据 ----
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    for (const p of projects) {
      const tasks = parseTasks(p.tasks);
      const milestones = parseMilestones(p.milestones);
      if (p.managerId && !memberIds.has(p.managerId)) {
        detected.push({
          ruleId: 'DQ-005', ruleName: '项目负责人不存在', category: 'project',
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'high', description: `负责人（${p.managerId}）不在成员档案中`,
          detail: { projectId: p.id, managerId: p.managerId },
        });
      }
      if (p.status === 3 && tasks.some((t: any) => Number(t.status) !== 2)) {
        detected.push({
          ruleId: 'DQ-006', ruleName: '已结束项目仍有未完成任务', category: 'project',
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'medium', description: '项目已结束，但存在未完成的任务',
          detail: { projectId: p.id, taskCount: tasks.length },
        });
      }
      for (const t of tasks) {
        const due = t.dueDate ? new Date(t.dueDate) : null;
        if (due && Number(t.status) !== 2 && due.getTime() < todayStart.getTime()) {
          detected.push({
            ruleId: 'DQ-007', ruleName: '任务逾期未完成', category: 'project',
            entityType: 'task', entityId: `${p.id}:${t.id}`,
            entityName: String(t.title || '任务'),
            severity: 'medium',
            description: `任务逾期：${due.toISOString().slice(0, 10)}`,
            detail: { projectId: p.id, projectName: p.name, taskId: t.id, dueDate: due.toISOString() },
          });
        }
      }
      if (!String(p.description || '').trim() && tasks.length === 0 && milestones.length === 0) {
        detected.push({
          ruleId: 'DQ-008', ruleName: '项目规划缺失', category: 'project',
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'low', description: '项目缺少描述且未规划任务/里程碑',
          detail: { projectId: p.id },
        });
      }
    }

    // ---- 财务数据 ----
    const expenseByProject = new Map<string, number>();
    for (const r of finances) {
      if (r.status !== 'approved') continue;
      if (r.type === 'expense' && r.projectId) {
        expenseByProject.set(r.projectId, (expenseByProject.get(r.projectId) || 0) + Number(r.amount || 0));
      }
      if (!r.projectId && !String(r.category || '').trim()) {
        detected.push({
          ruleId: 'DQ-009', ruleName: '财务记录缺少业务关联', category: 'finance',
          entityType: 'finance', entityId: r.id, entityName: String(r.summary || r.id),
          severity: 'low', description: '已生效单据未关联项目且未分类',
          detail: { recordId: r.id, summary: r.summary, amount: r.amount },
        });
      }
    }
    for (const p of projects) {
      const expense = expenseByProject.get(p.id) || 0;
      if (p.budget > 0 && expense > p.budget) {
        detected.push({
          ruleId: 'DQ-010', ruleName: '预算执行异常', category: 'finance',
          entityType: 'project', entityId: p.id, entityName: p.name,
          severity: 'medium',
          description: `项目支出 ¥${expense.toFixed(2)} 已超预算 ¥${p.budget.toFixed(2)}`,
          detail: { projectId: p.id, budget: p.budget, expense },
        });
      }
    }

    // ---- 组织资料 ----
    if (org) {
      if (org.orgType === 'socialOrg' && !String(org.creditCode || '').trim()) {
        detected.push({
          ruleId: 'DQ-011', ruleName: '组织关键资料缺失', category: 'org',
          entityType: 'organization', entityId: org.orgId, entityName: org.name,
          severity: 'high', description: '社会团体缺少统一社会信用代码',
          detail: { orgId: org.orgId },
        });
      }
      if (!String(org.description || '').trim()) {
        detected.push({
          ruleId: 'DQ-011', ruleName: '组织关键资料缺失', category: 'org',
          entityType: 'organization', entityId: org.orgId, entityName: org.name,
          severity: 'low', description: '组织简介为空',
          detail: { orgId: org.orgId },
        });
      }
    }

    // ---- 合并落库：复用 open 问题、自动重开已修复问题、自动关闭已消失问题 ----
    const issueCol: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
    const existing = await queryAllByOrg(issueCol, orgId);
    const now = new Date();
    const existingById = new Map<string, DataQualityIssue>();
    for (const issue of existing) existingById.set(issue.id, issue);

    const detectedKeys = new Set<string>();
    const toUpsert: DataQualityIssue[] = [];
    for (const d of detected) {
      const safeEntity = String(d.entityId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const id = `dq_${orgId}_${d.ruleId}_${safeEntity}`.slice(0, 200);
      detectedKeys.add(`${d.ruleId}|${d.entityId}`);
      const old = existingById.get(id);
      const issue = new DataQualityIssue();
      issue.id = id;
      issue.orgId = orgId;
      issue.ruleId = d.ruleId;
      issue.ruleName = d.ruleName;
      issue.category = d.category;
      issue.entityType = d.entityType;
      issue.entityId = d.entityId;
      issue.entityName = String(d.entityName || '').slice(0, 200);
      issue.severity = d.severity;
      issue.description = d.description;
      issue.detail = JSON.stringify(d.detail || {});
      issue.status = 'open';
      issue.assignedTo = old ? old.assignedTo : '';
      issue.assignedToName = old ? old.assignedToName : '';
      issue.checkCount = (old ? old.checkCount : 0) + 1;
      issue.lastCheckedAt = now;
      issue.resolvedAt = null;
      issue.resolvedBy = '';
      issue.resolvedByName = '';
      issue.createdAt = old ? old.createdAt : now;
      issue.updatedAt = now;
      toUpsert.push(issue);
    }
    await issueCol.upsert(toUpsert);

    const autoResolved: DataQualityIssue[] = [];
    for (const issue of existing) {
      if (issue.status !== 'open') continue;
      if (detectedKeys.has(`${issue.ruleId}|${issue.entityId}`)) continue;
      issue.status = 'resolved';
      issue.resolvedAt = now;
      issue.resolvedBy = 'system';
      issue.resolvedByName = '数据质量规则';
      issue.updatedAt = now;
      autoResolved.push(issue);
    }
    if (autoResolved.length > 0) await issueCol.upsert(autoResolved);

    // ---- 计算健康度快照 ----
    const allIssues = await queryAllByOrg(issueCol, orgId);
    const openIssues = allIssues.filter((i) => i.status === 'open');
    const openByCategory = new Map<string, number>();
    for (const i of openIssues) {
      openByCategory.set(i.category, (openByCategory.get(i.category) || 0) + 1);
    }
    const categories = Object.keys(CATEGORY_WEIGHTS).filter((c) => openByCategory.has(c));
    const dimensionScores: Record<string, number> = {};
    let total = 0;
    let count = 0;
    for (const c of categories) {
      const weight = CATEGORY_WEIGHTS[c] || 5;
      const score = Math.max(0, 100 - (openByCategory.get(c) || 0) * weight);
      dimensionScores[c] = score;
      total += score;
      count += 1;
    }
    const overall = count === 0 ? 100 : Math.round(total / count);
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0 };
    for (const i of openIssues) {
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    }
    const snapshot = new DataQualitySnapshot();
    snapshot.id = `dq_${orgId}`;
    snapshot.orgId = orgId;
    snapshot.score = overall;
    snapshot.dimensions = JSON.stringify(dimensionScores);
    snapshot.counts = JSON.stringify({
      open: openIssues.length,
      resolved: allIssues.filter((i) => i.status === 'resolved').length,
      total: allIssues.length,
      bySeverity,
    });
    snapshot.ruleCount = detected.length;
    snapshot.issueCount = openIssues.length;
    snapshot.checkedAt = now;
    snapshot.checkedBy = userId;
    snapshot.createdAt = now;
    const snapshotCol: CloudDBCollection<DataQualitySnapshot> = db.collection(DataQualitySnapshot);
    await snapshotCol.upsert([snapshot]);

    // 审计事件
    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = 'completed';
    ev.entityType = 'quality';
    ev.entityId = snapshot.id;
    ev.entityName = '数据质量检查';
    ev.actorId = userId;
    ev.actorName = userName;
    ev.level = openIssues.length > 0 ? 'warning' : 'info';
    ev.metadata = JSON.stringify({ score: overall, open: openIssues.length, resolved: autoResolved.length });
    ev.sourceType = 'manual';
    ev.sourceId = '';
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;
    await eventCol.upsert([ev]);

    logger.info(`run-data-quality done: orgId=${orgId}, score=${overall}, open=${openIssues.length}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          score: overall,
          dimensions: dimensionScores,
          counts: { open: openIssues.length, resolved: autoResolved.length },
          checkedAt: now.toISOString(),
          issueCount: openIssues.length,
        },
      },
    });
  } catch (err: any) {
    logger.error(`run-data-quality error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
