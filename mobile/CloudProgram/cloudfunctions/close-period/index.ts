import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { Notice } from './Notice';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';

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

async function recordEvent(
  col: CloudDBCollection<BusinessEvent>,
  orgId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  metadata: any,
): Promise<void> {
  const now = new Date();
  const ev = new BusinessEvent();
  ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
  ev.orgId = orgId;
  ev.eventType = eventType;
  ev.entityType = entityType;
  ev.entityId = entityId;
  ev.entityName = entityName || '';
  ev.actorId = actorId || 'system';
  ev.actorName = actorName || '系统';
  ev.level = 'info';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

const ACCOUNT_NAMES: Record<string, string> = {
  '3101': '非限定性净资产',
  '3201': '限定性净资产',
  '4101': '捐赠收入',
  '4102': '会费收入',
  '4103': '提供服务收入',
  '4104': '政府补助收入',
  '4105': '投资收益',
  '4106': '商品销售收入',
  '4109': '其他收入',
  '5101': '业务活动成本',
  '5201': '管理费用',
  '5301': '筹资费用',
  '5401': '其他费用',
};

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
  logger.info('close-period called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = (params?.userName as string) || '管理员';
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
      callback({ ret: { code: -1, message: '仅组织管理员可以期末结账' } });
      return;
    }

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const rows = await queryAllByOrg(recordCol, orgId);
    const existingClosing = rows.find(
      (r) => r.type === 'closing' && r.period === year,
    );
    if (existingClosing) {
      callback({
        ret: { code: 0, message: 'ok', data: { alreadyClosed: true, voucherId: existingClosing.id } },
      });
      return;
    }

    const records = rows.filter(
      (r) => r.status === 'approved' && r.period === year && r.type !== 'closing',
    );
    const nets = new Map<string, { free: number; restricted: number }>();
    for (const r of records) {
      for (const e of parseEntries(r.entries)) {
        const a = e.account;
        if (a.startsWith('4')) {
          const bal = e.credit - e.debit; // 收入为贷方余额
          if (bal <= 0) continue;
          const cur = nets.get(a) || { free: 0, restricted: 0 };
          if (r.restricted) cur.restricted += bal; else cur.free += bal;
          nets.set(a, cur);
        } else if (a.startsWith('5')) {
          const bal = e.debit - e.credit; // 费用为借方余额
          if (bal <= 0) continue;
          const cur = nets.get(a) || { free: 0, restricted: 0 };
          if (r.restricted) cur.restricted += bal; else cur.free += bal;
          nets.set(a, cur);
        }
      }
    }

    const entries: Entry[] = [];
    let income = 0;
    let expense = 0;
    const add = (account: string, debit: number, credit: number) => {
      entries.push({
        account,
        accountName: ACCOUNT_NAMES[account] || account,
        debit: round2(debit),
        credit: round2(credit),
      });
    };
    nets.forEach((v, code) => {
      if (code.startsWith('4')) {
        // 收入转入净资产：借收入，贷净资产
        income += v.free + v.restricted;
        if (v.free > 0) {
          add(code, v.free, 0);
          add('3101', 0, v.free);
        }
        if (v.restricted > 0) {
          add(code, v.restricted, 0);
          add('3201', 0, v.restricted);
        }
      } else if (code.startsWith('5')) {
        // 费用转入净资产：贷费用，借净资产
        expense += v.free + v.restricted;
        if (v.free > 0) {
          add(code, 0, v.free);
          add('3101', v.free, 0);
        }
        if (v.restricted > 0) {
          add(code, 0, v.restricted);
          add('3201', v.restricted, 0);
        }
      }
    });

    if (entries.length === 0) {
      callback({ ret: { code: 0, message: 'ok', data: { nothingToClose: true } } });
      return;
    }

    const now = new Date();
    const record = new FinanceRecord();
    record.id = 'f' + Date.now();
    record.orgId = orgId;
    record.projectId = '';
    record.type = 'closing';
    record.amount = 0;
    record.category = '';
    record.categoryLabel = '期末结转';
    record.date = new Date(Number(year), 11, 31);
    record.summary = `期末结转${year}年度收支`;
    record.counterparty = '';
    record.voucherNo = `结-${year}`;
    record.entries = JSON.stringify(entries);
    record.status = 'approved';
    record.period = year;
    record.restricted = false;
    record.flowId = '';
    record.instanceId = '';
    record.createdBy = userId;
    record.createdByName = userName;
    record.createdAt = now;
    record.updatedAt = now;
    await recordCol.upsert([record]);

    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
    const notice = new Notice();
    notice.id = 'fn' + Date.now() + Math.floor(Math.random() * 1000);
    notice.orgId = orgId;
    notice.title = `【财务】${year}年度期末结转完成`;
    notice.content = `收入合计 ${round2(income)} 元，费用合计 ${round2(expense)} 元，已结转至净资产。凭证号：${record.voucherNo}`;
    notice.publisher = '财务结账';
    notice.publishTime = now;
    notice.isRead = false;
    notice.isImportant = true;
    notice.updatedAt = now;
    await noticeCol.upsert([notice]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'completed', 'finance', record.id, `期末结转${year}年度收支`,
      userId, userName,
      { year, income: round2(income), expense: round2(expense), voucherNo: record.voucherNo },
    );

    logger.info(`close-period done: orgId=${orgId}, year=${year}, entries=${entries.length}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          alreadyClosed: false,
          voucherId: record.id,
          income: round2(income),
          expense: round2(expense),
          entries: entries.length,
        },
      },
    });
  } catch (err: any) {
    logger.error(`close-period error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
