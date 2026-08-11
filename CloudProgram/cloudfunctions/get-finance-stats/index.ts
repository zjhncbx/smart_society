import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalInstance } from './ApprovalInstance';
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

function actorsInclude(snapRaw: string, histRaw: string, myIds: Set<string>): boolean {
  let snap: any = {};
  try {
    snap = JSON.parse(snapRaw || '{}');
  } catch {
    snap = {};
  }
  const mids: string[] = Array.isArray(snap.actorMemberIds) ? snap.actorMemberIds : [];
  const uids: string[] = Array.isArray(snap.actorUserIds) ? snap.actorUserIds : [];
  for (const id of mids.concat(uids)) {
    if (myIds.has(id)) return true;
  }
  let hist: any[] = [];
  try {
    hist = JSON.parse(histRaw || '[]');
  } catch {
    hist = [];
  }
  for (const h of hist) {
    if (h && h.actorId && myIds.has(h.actorId)) return true;
  }
  return false;
}

interface Entry {
  account: string;
  accountName: string;
  debit: number;
  credit: number;
}

function parseEntries(raw: string): Entry[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-finance-stats called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const projectId = params?.projectId as string;
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
    const isAdmin = mine[0].role === 'admin';
    const myMemberId = mine[0].memberId || '';
    const myIds = new Set<string>([userId]);
    if (myMemberId) myIds.add(myMemberId);

    const col: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    let records = (await queryAllByOrg(col, orgId)).filter((r) => r.status === 'approved');
    if (!isAdmin) {
      const instCol = db.collection(ApprovalInstance);
      const visibleBiz = new Set<string>();
      const insts = await queryAllByOrg(instCol, orgId);
      for (const inst of insts) {
        if (inst.bizId && actorsInclude(inst.nodeSnapshot, inst.history, myIds)) {
          visibleBiz.add(inst.bizId);
        }
      }
      records = records.filter(
        (r) => r.createdBy === userId || (r.instanceId && visibleBiz.has(r.instanceId)),
      );
    }

    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, { label: string; income: number; expense: number }>();
    const byProject = new Map<string, { income: number; expense: number }>();

    const addCategory = (key: string, label: string, inc: number, exp: number) => {
      const cur = byCategory.get(key) || { label, income: 0, expense: 0 };
      cur.income += inc;
      cur.expense += exp;
      byCategory.set(key, cur);
    };
    const addProject = (pid: string, inc: number, exp: number) => {
      if (!pid) return;
      const cur = byProject.get(pid) || { income: 0, expense: 0 };
      cur.income += inc;
      cur.expense += exp;
      byProject.set(pid, cur);
    };

    for (const r of records) {
      if (r.type === 'income') {
        income += r.amount;
        addCategory(r.category || 'other', r.categoryLabel || '其他收入', r.amount, 0);
        addProject(r.projectId, r.amount, 0);
      } else if (r.type === 'expense') {
        expense += r.amount;
        addCategory(r.category || 'other', r.categoryLabel || '其他支出', 0, r.amount);
        addProject(r.projectId, 0, r.amount);
      } else if (r.type === 'voucher') {
        for (const e of parseEntries(r.entries)) {
          const debit = Number(e.debit) || 0;
          const credit = Number(e.credit) || 0;
          const account = String(e.account || '');
          const label = String(e.accountName || account);
          if (account.startsWith('4')) {
            income += credit;
            addCategory(account, label, credit, 0);
            addProject(r.projectId, credit, 0);
          } else if (account.startsWith('5')) {
            expense += debit;
            addCategory(account, label, 0, debit);
            addProject(r.projectId, 0, debit);
          }
        }
      }
    }

    const categories = Array.from(byCategory.entries())
      .map(([key, v]) => ({ key, label: v.label, income: v.income, expense: v.expense }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
    const projects = Array.from(byProject.entries())
      .map(([key, v]) => ({ projectId: key, income: v.income, expense: v.expense }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          income: Math.round(income * 100) / 100,
          expense: Math.round(expense * 100) / 100,
          balance: Math.round((income - expense) * 100) / 100,
          categories,
          projects,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-finance-stats error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
