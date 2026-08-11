import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { FinanceOpeningBalance } from './FinanceOpeningBalance';
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

const ACCOUNTS: Array<{ code: string; name: string; category: string }> = [
  { code: '1001', name: '现金', category: '资产' },
  { code: '1002', name: '银行存款', category: '资产' },
  { code: '1101', name: '短期投资', category: '资产' },
  { code: '1201', name: '应收款项', category: '资产' },
  { code: '1301', name: '存货', category: '资产' },
  { code: '1401', name: '待摊费用', category: '资产' },
  { code: '1501', name: '长期股权投资', category: '资产' },
  { code: '1502', name: '长期债权投资', category: '资产' },
  { code: '1601', name: '固定资产', category: '资产' },
  { code: '1602', name: '累计折旧', category: '资产' },
  { code: '1701', name: '无形资产', category: '资产' },
  { code: '1801', name: '受托代理资产', category: '资产' },
  { code: '2101', name: '借入款项', category: '负债' },
  { code: '2201', name: '应付款项', category: '负债' },
  { code: '2301', name: '应付工资', category: '负债' },
  { code: '2302', name: '应交税金', category: '负债' },
  { code: '2401', name: '预收账款', category: '负债' },
  { code: '2501', name: '预提费用', category: '负债' },
  { code: '2601', name: '预计负债', category: '负债' },
  { code: '2701', name: '长期应付款', category: '负债' },
  { code: '2801', name: '受托代理负债', category: '负债' },
  { code: '3101', name: '非限定性净资产', category: '净资产' },
  { code: '3201', name: '限定性净资产', category: '净资产' },
  { code: '4101', name: '捐赠收入', category: '收入' },
  { code: '4102', name: '会费收入', category: '收入' },
  { code: '4103', name: '提供服务收入', category: '收入' },
  { code: '4104', name: '政府补助收入', category: '收入' },
  { code: '4105', name: '投资收益', category: '收入' },
  { code: '4106', name: '商品销售收入', category: '收入' },
  { code: '4109', name: '其他收入', category: '收入' },
  { code: '5101', name: '业务活动成本', category: '费用' },
  { code: '5201', name: '管理费用', category: '费用' },
  { code: '5301', name: '筹资费用', category: '费用' },
  { code: '5401', name: '其他费用', category: '费用' },
];

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

const round2 = (v: number): number => Math.round(v * 100) / 100;

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-ledger called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const year = String(params?.year || '');
    const accountCode = String(params?.accountCode || '');
    if (!orgId || !userId || !/^\d{4}$/.test(year) || !accountCode) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/year/accountCode 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const account = ACCOUNTS.find((a) => a.code === accountCode) || {
      code: accountCode,
      name: accountCode,
      category: '',
    };

    const obCol: CloudDBCollection<FinanceOpeningBalance> = db.collection(FinanceOpeningBalance);
    const obRows = (await queryAllByOrg(obCol, orgId)).filter(
      (b) => b.year === year && b.accountCode === accountCode,
    );
    const ob = obRows.length > 0 ? obRows[0] : null;
    const openDebit = ob ? ob.debit : 0;
    const openCredit = ob ? ob.credit : 0;

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const records = (await queryAllByOrg(recordCol, orgId))
      .filter((r) => r.status === 'approved' && r.period === year);
    const entries: any[] = [];
    for (const r of records) {
      for (const e of parseEntries(r.entries)) {
        if (e.account !== accountCode) continue;
        entries.push({
          date: r.date,
          voucherNo: r.voucherNo || r.id,
          summary: r.summary,
          debit: e.debit,
          credit: e.credit,
        });
      }
    }
    entries.sort((a, b) => {
      const d = new Date(a.date).getTime() - new Date(b.date).getTime();
      return d !== 0 ? d : String(a.voucherNo).localeCompare(String(b.voucherNo));
    });

    // 借方余额类：资产/费用；贷方余额类：负债/净资产/收入
    const debitSide = account.category === '资产' || account.category === '费用';
    let running = openDebit - openCredit;
    for (const e of entries) {
      running += e.debit - e.credit;
      if (debitSide) {
        e.runningDebit = round2(Math.max(0, running));
        e.runningCredit = round2(Math.max(0, -running));
      } else {
        e.runningDebit = round2(Math.max(0, -running));
        e.runningCredit = round2(Math.max(0, running));
      }
      e.date = new Date(e.date);
    }

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          account: { code: account.code, name: account.name, category: account.category },
          year,
          openDebit: round2(openDebit),
          openCredit: round2(openCredit),
          entries,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-ledger error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
