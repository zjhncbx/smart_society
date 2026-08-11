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

function cashLine(account: string, isIn: boolean): { line: string; category: string } {
  if (isIn) {
    switch (account) {
      case '4101': return { line: '接受捐赠收到的现金', category: '经营活动' };
      case '4102': return { line: '收取会费收到的现金', category: '经营活动' };
      case '4103': return { line: '提供服务收到的现金', category: '经营活动' };
      case '4104': return { line: '政府补助收到的现金', category: '经营活动' };
      case '4106': return { line: '销售商品收到的现金', category: '经营活动' };
      case '4105':
      case '1101':
      case '1501':
      case '1502': return { line: '收回投资收到的现金', category: '投资活动' };
      case '1601':
      case '1701': return { line: '处置固定资产、无形资产收回的现金', category: '投资活动' };
      case '2101':
      case '2701': return { line: '借款收到的现金', category: '筹资活动' };
      default: return { line: '收到其他与业务活动有关的现金', category: '经营活动' };
    }
  }
  switch (account) {
    case '2301': return { line: '支付给员工以及为员工支付的现金', category: '经营活动' };
    case '5101': return { line: '业务活动支付的现金', category: '经营活动' };
    case '1601':
    case '1701': return { line: '购建固定资产、无形资产支付的现金', category: '投资活动' };
    case '1101':
    case '1501':
    case '1502': return { line: '投资支付的现金', category: '投资活动' };
    case '2101':
    case '2701': return { line: '偿还借款支付的现金', category: '筹资活动' };
    case '5301': return { line: '筹资活动支付的现金', category: '筹资活动' };
    case '3101':
    case '3201': return { line: '净资产结转（不产生现金流量）', category: '其他' };
    default: return { line: '支付其他与业务活动有关的现金', category: '经营活动' };
  }
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-accounting-reports called');

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

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const obCol: CloudDBCollection<FinanceOpeningBalance> = db.collection(FinanceOpeningBalance);
    const records = (await queryAllByOrg(recordCol, orgId))
      .filter((r) => r.status === 'approved' && r.period === year);
    const openings = (await queryAllByOrg(obCol, orgId))
      .filter((b) => b.year === year)
      .reduce((m, b) => { m.set(b.accountCode, b); return m; }, new Map<string, FinanceOpeningBalance>());
    const closingExists = records.some((r) => r.type === 'closing');

    // 各科目：期初借/贷、本期借/贷、期末借/贷
    const trial: any[] = [];
    let trialOpenD = 0, trialOpenC = 0, trialCurD = 0, trialCurC = 0, trialEndD = 0, trialEndC = 0;
    for (const a of ACCOUNTS) {
      const ob = openings.get(a.code);
      const openD = ob ? ob.debit : 0;
      const openC = ob ? ob.credit : 0;
      let curD = 0, curC = 0;
      for (const r of records) {
        for (const e of parseEntries(r.entries)) {
          if (e.account === a.code) {
            curD += e.debit;
            curC += e.credit;
          }
        }
      }
      // 按余额方向折算期末
      const net = openD - openC + curD - curC;
      const endD = Math.max(0, net);
      const endC = Math.max(0, -net);
      trial.push({
        code: a.code,
        name: a.name,
        category: a.category,
        openDebit: round2(openD),
        openCredit: round2(openC),
        curDebit: round2(curD),
        curCredit: round2(curC),
        endDebit: round2(endD),
        endCredit: round2(endC),
      });
      trialOpenD += openD; trialOpenC += openC;
      trialCurD += curD; trialCurC += curC;
      trialEndD += endD; trialEndC += endC;
    }

    // 资产负债表（期初/期末；净资产 = 期初净资产 + 本期收入 - 本期费用，结转凭证除外）
    const nonClosing = records.filter((r) => r.type !== 'closing');
    const activityNet = new Map<string, { r: number; f: number }>(); // account -> {restricted, free}
    for (const r of nonClosing) {
      for (const e of parseEntries(r.entries)) {
        const a = e.account;
        if (a.startsWith('4')) {
          const net = e.credit - e.debit;
          const cur = activityNet.get(a) || { r: 0, f: 0 };
          if (r.restricted) cur.r += net; else cur.f += net;
          activityNet.set(a, cur);
        } else if (a.startsWith('5')) {
          const net = e.debit - e.credit;
          const cur = activityNet.get(a) || { r: 0, f: 0 };
          if (r.restricted) cur.r += net; else cur.f += net;
          activityNet.set(a, cur);
        }
      }
    }
    let incomeR = 0, incomeF = 0, expenseR = 0, expenseF = 0;
    const activity: any[] = [];
    for (const a of ACCOUNTS) {
      const v = activityNet.get(a.code);
      if (!v) continue;
      if (a.code.startsWith('4')) {
        incomeR += v.r; incomeF += v.f;
        activity.push({
          code: a.code, name: a.name, kind: 'income',
          restricted: round2(v.r), free: round2(v.f), total: round2(v.r + v.f),
        });
      } else if (a.code.startsWith('5')) {
        expenseR += v.r; expenseF += v.f;
        activity.push({
          code: a.code, name: a.name, kind: 'expense',
          restricted: round2(v.r), free: round2(v.f), total: round2(v.r + v.f),
        });
      }
    }

    const bsNetAssets = (code: string, periodChange: number) => {
      const ob = openings.get(code);
      const openNet = ob ? ob.credit - ob.debit : 0;
      let curNet = 0;
      for (const r of records) {
        for (const e of parseEntries(r.entries)) {
          if (e.account === code) curNet += e.credit - e.debit;
        }
      }
      return { open: round2(openNet), end: round2(openNet + curNet + periodChange) };
    };
    const freeNet = bsNetAssets('3101', incomeF - expenseF);
    const restrictedNet = bsNetAssets('3201', incomeR - expenseR);

    const balanceSheet = {
      assets: trial.filter((t) => t.category === '资产'),
      liabilities: trial.filter((t) => t.category === '负债'),
      totals: {
        assetOpen: round2(trial.filter((t) => t.category === '资产').reduce((s, t) => s + t.openDebit - t.openCredit, 0)),
        assetEnd: round2(trial.filter((t) => t.category === '资产').reduce((s, t) => s + t.endDebit - t.endCredit, 0)),
        liabilityOpen: round2(trial.filter((t) => t.category === '负债').reduce((s, t) => s + t.openCredit - t.openDebit, 0)),
        liabilityEnd: round2(trial.filter((t) => t.category === '负债').reduce((s, t) => s + t.endCredit - t.endDebit, 0)),
        netOpen: round2(freeNet.open + restrictedNet.open),
        netEnd: round2(freeNet.end + restrictedNet.end),
      },
      netAssetsRows: [
        { code: '3101', name: '非限定性净资产', open: freeNet.open, end: freeNet.end },
        { code: '3201', name: '限定性净资产', open: restrictedNet.open, end: restrictedNet.end },
      ],
    };

    // 现金流量表：现金科目 1001/1002，按对方科目归类
    const cashAccounts = new Set(['1001', '1002']);
    const flow = new Map<string, number>();
    const flowMeta = new Map<string, string>();
    for (const r of nonClosing) {
      const entries = parseEntries(r.entries);
      const cashIn = entries.filter((e) => cashAccounts.has(e.account) && e.debit > 0)
        .reduce((s, e) => s + e.debit, 0);
      const cashOut = entries.filter((e) => cashAccounts.has(e.account) && e.credit > 0)
        .reduce((s, e) => s + e.credit, 0);
      const creditCounter = entries.filter((e) => !cashAccounts.has(e.account) && e.credit > 0);
      const debitCounter = entries.filter((e) => !cashAccounts.has(e.account) && e.debit > 0);
      const totalCredit = creditCounter.reduce((s, e) => s + e.credit, 0);
      const totalDebit = debitCounter.reduce((s, e) => s + e.debit, 0);
      if (cashIn > 0 && totalCredit > 0) {
        for (const e of creditCounter) {
          const amount = round2(cashIn * e.credit / totalCredit);
          const line = cashLine(e.account, true);
          const key = `${line.category}|${line.line}`;
          flow.set(key, (flow.get(key) || 0) + amount);
          flowMeta.set(key, line.line);
        }
      }
      if (cashOut > 0 && totalDebit > 0) {
        for (const e of debitCounter) {
          const amount = round2(cashOut * e.debit / totalDebit);
          const line = cashLine(e.account, false);
          const key = `${line.category}|${line.line}`;
          flow.set(key, (flow.get(key) || 0) - amount);
          flowMeta.set(key, line.line);
        }
      }
    }
    const flowRows: any[] = [];
    let op = 0, inv = 0, fin = 0;
    for (const [key, amount] of flow) {
      const category = key.split('|')[0];
      const line = flowMeta.get(key) || key;
      if (category === '经营活动') op += amount;
      else if (category === '投资活动') inv += amount;
      else if (category === '筹资活动') fin += amount;
      flowRows.push({ line, category, amount: round2(amount) });
    }
    const cashFlow = {
      rows: flowRows.sort((a, b) => a.category.localeCompare(b.category)),
      totals: {
        operating: round2(op),
        investing: round2(inv),
        financing: round2(fin),
        net: round2(op + inv + fin),
      },
    };

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          year,
          closingExists,
          trialBalance: { rows: trial, totals: {
            openDebit: round2(trialOpenD), openCredit: round2(trialOpenC),
            curDebit: round2(trialCurD), curCredit: round2(trialCurC),
            endDebit: round2(trialEndD), endCredit: round2(trialEndC),
          } },
          balanceSheet,
          activityStatement: {
            rows: activity,
            totals: {
              incomeRestricted: round2(incomeR), incomeFree: round2(incomeF), income: round2(incomeR + incomeF),
              expenseRestricted: round2(expenseR), expenseFree: round2(expenseF), expense: round2(expenseR + expenseF),
              changeRestricted: round2(incomeR - expenseR), changeFree: round2(incomeF - expenseF), change: round2(incomeR + incomeF - expenseR - expenseF),
            },
          },
          cashFlow,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-accounting-reports error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
