import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { WorkItem } from './WorkItem';
import { RiskAlert } from './RiskAlert';
import { AutoTask } from './AutoTask';
import { BusinessEvent } from './BusinessEvent';
import { Member } from './Member';
import { Project } from './Project';
import { Notice } from './Notice';
import { UserOrganization } from './UserOrganization';

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
/** 每类对象命中上限（防超载） */
const PER_TYPE_LIMIT = 20;

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
}

function toIso(d: Date | null): string {
  return d ? d.toISOString() : '';
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('search-all called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');
    // 兼容 Web 端 query 字段与移动端 keyword 字段
    const keyword = String(params?.keyword ?? params?.query ?? '').trim();
    const limit = Math.max(1, Math.min(Number(params?.limit) || PER_TYPE_LIMIT * 7, PER_TYPE_LIMIT * 7));
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }
    // 空关键词返回空结果，避免全表扫描
    if (!keyword) {
      callback({ ret: { code: 0, message: 'ok', data: { results: [] } } });
      return;
    }

    // 成员校验：非本组织成员拒绝
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const q = keyword.toLowerCase();
    const hit = (...texts: Array<string | undefined>): boolean =>
      texts.some((t) => !!t && t.toLowerCase().includes(q));

    const results: SearchHit[] = [];

    // 工作项
    const workItems = await queryAllByOrg<WorkItem>(db.collection(WorkItem), orgId);
    let workItemCount = 0;
    for (const w of workItems) {
      if (workItemCount >= PER_TYPE_LIMIT) break;
      if (!hit(w.title, w.description)) continue;
      results.push({
        type: 'work_item',
        id: w.id,
        title: w.title,
        subtitle: `${w.sourceRuleId || w.workItemType} · ${w.ownerName || '未指派'}`,
        updatedAt: toIso(w.updatedAt),
      });
      workItemCount += 1;
    }

    // 风险/预警
    const risks = await queryAllByOrg<RiskAlert>(db.collection(RiskAlert), orgId);
    let riskCount = 0;
    for (const r of risks) {
      if (riskCount >= PER_TYPE_LIMIT) break;
      if (!hit(r.title, r.description)) continue;
      results.push({
        type: 'risk',
        id: r.id,
        title: r.title,
        subtitle: `${r.sourceRuleId} · ${r.kind === 'risk' ? '风险' : '预警'}`,
        updatedAt: toIso(r.updatedAt),
      });
      riskCount += 1;
    }

    // 自动任务
    const tasks = await queryAllByOrg<AutoTask>(db.collection(AutoTask), orgId);
    let taskCount = 0;
    for (const t of tasks) {
      if (taskCount >= PER_TYPE_LIMIT) break;
      if (!hit(t.title, t.description)) continue;
      results.push({
        type: 'task',
        id: t.id,
        title: t.title,
        subtitle: `${t.sourceRuleId} · ${t.assigneeName || '未指派'}`,
        updatedAt: toIso(t.updatedAt),
      });
      taskCount += 1;
    }

    // 业务事件
    const events = await queryAllByOrg<BusinessEvent>(db.collection(BusinessEvent), orgId);
    let eventCount = 0;
    for (const e of events) {
      if (eventCount >= PER_TYPE_LIMIT) break;
      if (!hit(e.entityName, e.eventType)) continue;
      results.push({
        type: 'event',
        id: e.id,
        title: `「${e.entityName}」${e.eventType}`,
        subtitle: e.actorName,
        updatedAt: toIso(e.occurredAt instanceof Date ? e.occurredAt : null),
      });
      eventCount += 1;
    }

    // 成员
    const members = await queryAllByOrg<Member>(db.collection(Member), orgId);
    let memberCount = 0;
    for (const m of members) {
      if (memberCount >= PER_TYPE_LIMIT) break;
      if (!hit(m.name, m.phone, m.email, m.department, m.studentNo)) continue;
      results.push({
        type: 'member',
        id: m.id,
        title: m.name,
        subtitle: m.department || m.roleLabel || '成员',
        updatedAt: toIso(m.updatedAt),
      });
      memberCount += 1;
    }

    // 项目
    const projects = await queryAllByOrg<Project>(db.collection(Project), orgId);
    let projectCount = 0;
    for (const p of projects) {
      if (projectCount >= PER_TYPE_LIMIT) break;
      if (!hit(p.name, p.description)) continue;
      results.push({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: p.description ? p.description.slice(0, 40) : '项目',
        updatedAt: toIso(p.updatedAt instanceof Date ? p.updatedAt : null),
      });
      projectCount += 1;
    }

    // 公告
    const notices = await queryAllByOrg<Notice>(db.collection(Notice), orgId);
    let noticeCount = 0;
    for (const n of notices) {
      if (noticeCount >= PER_TYPE_LIMIT) break;
      if (!hit(n.title, n.content)) continue;
      results.push({
        type: 'notice',
        id: n.id,
        title: n.title,
        subtitle: n.publisher || '公告',
        updatedAt: toIso(n.updatedAt instanceof Date ? n.updatedAt : null),
      });
      noticeCount += 1;
    }

    logger.info(`search-all done: orgId=${orgId}, keyword=${keyword}, hits=${results.length}`);
    callback({ ret: { code: 0, message: 'ok', data: { results: results.slice(0, limit) } } });
  } catch (err: any) {
    logger.error(`search-all error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
