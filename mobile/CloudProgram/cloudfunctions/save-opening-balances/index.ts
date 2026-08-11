import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceOpeningBalance } from './FinanceOpeningBalance';
import { FinanceRecord } from './FinanceRecord';
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

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

async function loadOpenings(
  obCol: CloudDBCollection<FinanceOpeningBalance>,
  orgId: string,
  year: string,
): Promise<Map<string, FinanceOpeningBalance>> {
  const rows = (await queryAllByOrg(obCol, orgId)).filter((b) => b.year === year);
  const map = new Map<string, FinanceOpeningBalance>();
  for (const r of rows) map.set(r.accountCode, r);
  return map;
}

function endBalance(open: FinanceOpeningBalance | undefined, entries: Entry[]): { debit: number; credit: number } {
  let debit = open ? open.debit : 0;
  let credit = open ? open.credit : 0;
  for (const e of entries) {
    debit += e.debit;
    credit += e.credit;
  }
  return { debit, credit };
}

function toDebitCredit(net: number): { debit: number; credit: number } {
  if (net >= 0) return { debit: net, credit: 0 };
  return { debit: 0, credit: -net };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-opening-balances called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const year = String(params?.year || '');
    if (!orgId || !userId || !/^\d{4}$/.test(year)) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/year 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以设置期初余额' } });
      return;
    }

    const obCol: CloudDBCollection<FinanceOpeningBalance> = db.collection(FinanceOpeningBalance);
    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const balances: FinanceOpeningBalance[] = [];

    if (params.carryFromPrevious === true) {
      // 从上年期末自动结转：上年期初 + 上年全部已生效凭证 = 上年期末
      const prevYear = String(Number(year) - 1);
      const prevOpenings = await loadOpenings(obCol, orgId, prevYear);
      const prevRecords = (await queryAllByOrg(recordCol, orgId))
        .filter((r) => r.status === 'approved' && r.period === prevYear);
      const nets = new Map<string, number>();
      prevOpenings.forEach((ob, code) => {
        nets.set(code, (nets.get(code) || 0) + ob.debit - ob.credit);
      });
      for (const r of prevRecords) {
        for (const e of parseEntries(r.entries)) {
          nets.set(e.account, (nets.get(e.account) || 0) + e.debit - e.credit);
        }
      }
      nets.forEach((net, code) => {
        if (!/^[123]/.test(code)) return; // 只结转资产负债表科目
        const dc = toDebitCredit(net);
        const ob = new FinanceOpeningBalance();
        ob.id = `ob_${orgId}_${year}_${code}`;
        ob.orgId = orgId;
        ob.year = year;
        ob.accountCode = code;
        ob.accountName = '';
        ob.debit = dc.debit;
        ob.credit = dc.credit;
        ob.updatedAt = new Date();
        balances.push(ob);
      });
      await obCol.upsert(balances);
      callback({ ret: { code: 0, message: 'ok', data: { balances, carried: balances.length } } });
      return;
    }

    const list = Array.isArray(params.balances) ? params.balances : [];
    for (const b of list) {
      const code = String(b.accountCode || '');
      if (!code) continue;
      const ob = new FinanceOpeningBalance();
      ob.id = `ob_${orgId}_${year}_${code}`;
      ob.orgId = orgId;
      ob.year = year;
      ob.accountCode = code;
      ob.accountName = String(b.accountName || '');
      ob.debit = Math.max(0, Number(b.debit) || 0);
      ob.credit = Math.max(0, Number(b.credit) || 0);
      ob.updatedAt = new Date();
      balances.push(ob);
    }
    if (balances.length > 0) {
      await obCol.upsert(balances);
    }

    callback({ ret: { code: 0, message: 'ok', data: { balances, carried: 0 } } });
  } catch (err: any) {
    logger.error(`save-opening-balances error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
