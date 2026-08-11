import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { ApprovalInstance } from './ApprovalInstance';
import { FinanceRecord } from './FinanceRecord';
import { Member } from './Member';
import { UserOrganization } from './UserOrganization';

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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-approval-tasks called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
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
    const myMemberId = mine[0].memberId || '';

    const instCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
    const instances = (await queryAllByOrg(instCol, orgId)).filter((i) => i.status === 'running');
    const tasks: any[] = [];
    for (const inst of instances) {
      let snapshot: any = {};
      try {
        snapshot = JSON.parse(inst.nodeSnapshot || '{}');
      } catch {
        snapshot = {};
      }
      const actorMemberIds: string[] = Array.isArray(snapshot.actorMemberIds) ? snapshot.actorMemberIds : [];
      const actorUserIds: string[] = Array.isArray(snapshot.actorUserIds) ? snapshot.actorUserIds : [];
      if ((myMemberId && actorMemberIds.includes(myMemberId)) || actorUserIds.includes(userId)) {
        tasks.push({ instance: inst, node: snapshot });
      }
    }

    // 附带单据信息
    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const enriched: any[] = [];
    for (const t of tasks) {
      let record: FinanceRecord | null = null;
      if (t.instance.bizId) {
        const recs = await recordCol.query().equalTo('id', t.instance.bizId).get();
        if (recs.length > 0) record = recs[0];
      }
      enriched.push({ instance: t.instance, node: t.node, record });
    }

    callback({ ret: { code: 0, message: 'ok', data: { tasks: enriched } } });
  } catch (err: any) {
    logger.error(`get-approval-tasks error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
