import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { Notice } from './Notice';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

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

const IDEM_TIMEOUT_MS = 120000;

async function claimIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  requestHash: string,
  actorId: string,
): Promise<{ status: 'cached' | 'claimed' | 'processing'; result?: any }> {
  const now = Date.now();
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length > 0) {
    const rec = rows[0];
    if (rec.status === 'done') {
      try {
        return { status: 'cached', result: JSON.parse(rec.result || '{}') };
      } catch {
        return { status: 'cached', result: {} };
      }
    }
    if (rec.status === 'processing') {
      const created = rec.createdAt ? rec.createdAt.getTime() : now;
      if (now - created < IDEM_TIMEOUT_MS) {
        return { status: 'processing' };
      }
    }
  }
  const claimId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
  const rec = new IdempotencyRecord();
  rec.id = key;
  rec.orgId = orgId;
  rec.action = action;
  rec.entityType = entityType;
  rec.entityId = entityId || '';
  rec.result = '{}';
  rec.status = 'processing';
  rec.claimId = claimId;
  rec.requestHash = requestHash;
  rec.createdAt = new Date(now);
  rec.expiresAt = new Date(now + IDEM_TIMEOUT_MS);
  rec.createdBy = actorId || '';
  await col.upsert([rec]);
  const confirm = await col.query().equalTo('id', key).get();
  if (confirm.length > 0 && confirm[0].claimId === claimId) {
    return { status: 'claimed' };
  }
  return { status: 'processing' };
}

async function completeIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
  result: any,
): Promise<void> {
  if (!key) return;
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length === 0) return;
  const rec = rows[0];
  rec.status = 'done';
  rec.result = JSON.stringify(result || {});
  rec.updatedAt = new Date();
  await col.upsert([rec]);
}

async function failIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
): Promise<void> {
  if (!key || !col) return;
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length === 0) return;
  const rec = rows[0];
  rec.status = 'failed';
  rec.updatedAt = new Date();
  await col.upsert([rec]);
}

async function recordAudit(
  col: CloudDBCollection<AuditLog>,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  before: any,
  after: any,
  changeReason = '',
  correlationId = '',
): Promise<void> {
  const now = new Date();
  const log = new AuditLog();
  log.id = 'al' + Date.now() + Math.floor(Math.random() * 100000);
  log.orgId = orgId;
  log.code = '';
  log.action = action;
  log.entityType = entityType;
  log.entityId = entityId;
  log.entityName = entityName || '';
  log.actorId = actorId || 'system';
  log.actorName = actorName || '系统';
  log.before = before !== undefined && before !== null ? JSON.stringify(before) : 'null';
  log.after = after !== undefined && after !== null ? JSON.stringify(after) : 'null';
  log.changeReason = changeReason;
  log.correlationId = correlationId || '';
  log.status = 'success';
  log.version = 1;
  log.sourceType = 'manual';
  log.sourceId = '';
  log.isDeleted = false;
  log.createdAt = now;
  log.createdBy = actorId || '';
  log.updatedAt = now;
  log.updatedBy = actorId || '';
  await col.upsert([log]);
}

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
  correlationId = '',
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
  ev.correlationId = correlationId || '';
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
  let idempotencyKey = '';
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;

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

    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：期末结账必须幂等' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, 'close', 'finance', year,
      String(JSON.stringify({ year })).slice(0, 300), userId,
    );
    if (claim.status === 'cached') {
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: claim.result } });
      return;
    }
    if (claim.status === 'processing') {
      callback({ ret: { code: -1, message: '该操作正在处理中，请勿重复提交' } });
      return;
    }
    const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);

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
      correlationId,
    );

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, 'close', 'finance', record.id, `期末结转${year}年度收支`,
      userId, userName, null, record, '', correlationId,
    );

    await completeIdempotent(
      idemCol, idempotencyKey,
      { alreadyClosed: false, voucherId: record.id, income: round2(income), expense: round2(expense) },
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
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
