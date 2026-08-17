import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Project } from './Project';
import { Member } from './Member';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalInstance } from './ApprovalInstance';
import { RiskAlert } from './RiskAlert';
import { AutoTask } from './AutoTask';
import { Resolution } from './Resolution';
import { UserOrganization } from './UserOrganization';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && 'data' in body) {
    body = body.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
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

interface Node { id: string; type: string; name: string; }
interface Edge { from: string; to: string; label: string; }

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-entity-relations called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const entityType = String(params?.entityType || 'project');
    const entityId = String(params?.entityId || '');
    if (!orgId || !userId || !entityId) { callback({ ret: { code: -1, message: '缺少 orgId/userId/entityId 参数' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }

    const projects = await queryAllByOrg(db.collection(Project), orgId);
    const project = projects.find((p) => p.id === entityId);
    if (!project) { callback({ ret: { code: -1, message: '项目不存在' } }); return; }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    nodes.push({ id: `project:${project.id}`, type: 'project', name: project.name });

    const members = await queryAllByOrg(db.collection(Member), orgId);
    const manager = members.find((m) => m.id === project.managerId);
    if (manager) {
      nodes.push({ id: `member:${manager.id}`, type: 'member', name: `${manager.name}（负责人）` });
      edges.push({ from: `project:${project.id}`, to: `member:${manager.id}`, label: '负责' });
    }

    const resolutions = (await queryAllByOrg(db.collection(Resolution), orgId)).filter((r) => r.projectId === entityId);
    for (const r of resolutions) {
      nodes.push({ id: `resolution:${r.id}`, type: 'resolution', name: r.title });
      edges.push({ from: `resolution:${r.id}`, to: `project:${project.id}`, label: '决议执行' });
    }

    const finances = (await queryAllByOrg(db.collection(FinanceRecord), orgId)).filter((f) => f.projectId === entityId);
    const approvals = await queryAllByOrg(db.collection(ApprovalInstance), orgId);
    for (const f of finances) {
      nodes.push({ id: `finance:${f.id}`, type: 'finance', name: `${f.summary}（¥${f.amount}）` });
      edges.push({ from: `project:${project.id}`, to: `finance:${f.id}`, label: f.type });
      const appr = approvals.find((a) => a.bizId === f.id);
      if (appr) {
        nodes.push({ id: `approval:${appr.id}`, type: 'approval', name: `${appr.flowName || '审批'}：${appr.title}` });
        edges.push({ from: `finance:${f.id}`, to: `approval:${appr.id}`, label: '审批' });
      }
    }

    const risks = (await queryAllByOrg(db.collection(RiskAlert), orgId)).filter((r) => r.sourceEntityId === entityId);
    for (const r of risks) {
      nodes.push({ id: `risk:${r.id}`, type: 'risk', name: r.title });
      edges.push({ from: `project:${project.id}`, to: `risk:${r.id}`, label: '风险' });
    }

    const tasks = (await queryAllByOrg(db.collection(AutoTask), orgId)).filter((t) => t.sourceEntityId.startsWith(`${entityId}:`));
    for (const t of tasks) {
      nodes.push({ id: `task:${t.id}`, type: 'task', name: t.title });
      edges.push({ from: `project:${project.id}`, to: `task:${t.id}`, label: '自动任务' });
    }

    callback({
      ret: {
        code: 0, message: 'ok',
        data: {
          root: `project:${project.id}`,
          nodes,
          edges,
          summary: {
            resolutions: resolutions.length,
            finances: finances.length,
            risks: risks.length,
            tasks: tasks.length,
          },
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-entity-relations error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
