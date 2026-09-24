import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { OrgSettings } from './OrgSettings';
import { UserOrganization } from './UserOrganization';
import { AuditLog } from './AuditLog';
import { BusinessEvent } from './BusinessEvent';
import { IdempotencyRecord } from './IdempotencyRecord';

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
const IDEM_TIMEOUT_MS = 120000;

/** 合法规则编号（GR-01~12） */
const VALID_RULE_IDS = new Set([
  'GR-01', 'GR-02', 'GR-03', 'GR-04', 'GR-05', 'GR-06',
  'GR-07', 'GR-08', 'GR-09', 'GR-10', 'GR-11', 'GR-12',
]);

/** 幂等原子认领：done→返回缓存结果；processing 且窗口内→拒绝；否则认领并回读确认 */
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
    // done 之外且超时（或 failed）→ 允许重新认领
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
  if (!key) return;
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
  entityId: string,
  entityName: string,
  actorId: string,
  before: any,
  after: any,
  changeReason: string,
  correlationId: string,
): Promise<void> {
  const now = new Date();
  const log = new AuditLog();
  log.id = 'al' + Date.now() + Math.floor(Math.random() * 100000);
  log.orgId = orgId;
  log.code = '';
  log.action = action;
  log.entityType = 'rule';
  log.entityId = entityId;
  log.entityName = entityName;
  log.actorId = actorId || 'system';
  log.actorName = '组织管理员';
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
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  metadata: Record<string, unknown>,
  correlationId: string,
): Promise<void> {
  const now = new Date();
  const ev = new BusinessEvent();
  ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
  ev.orgId = orgId;
  ev.eventType = 'updated';
  ev.entityType = entityType;
  ev.entityId = entityId;
  ev.entityName = entityName;
  ev.actorId = actorId || 'system';
  ev.actorName = '组织管理员';
  ev.level = 'info';
  ev.metadata = JSON.stringify(metadata);
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.correlationId = correlationId || '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('set-rule-enabled called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');
    const ruleId = String(params?.ruleId || params?.id || '');
    const enabled = params?.enabled === true;
    const idempotencyKey = String(params?.idempotencyKey || '');
    const correlationId = String(params?.correlationId || '');
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }
    if (!ruleId) {
      callback({ ret: { code: -1, message: '缺少 ruleId 参数' } });
      return;
    }
    if (!VALID_RULE_IDS.has(ruleId)) {
      callback({ ret: { code: -1, message: `规则编号无效：${ruleId}` } });
      return;
    }
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey（写操作强制幂等）' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 1. 用户必须是该组织成员且为管理员
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以启停治理规则' } });
      return;
    }

    // 2. 幂等原子认领
    const idemCol: CloudDBCollection<IdempotencyRecord> = db.collection(IdempotencyRecord);
    const requestHash = JSON.stringify({ orgId, ruleId, enabled });
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, 'set-rule-enabled', 'rule', ruleId, requestHash, userId,
    );
    if (claim.status === 'cached') {
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: claim.result ?? { id: ruleId, enabled } } });
      return;
    }
    if (claim.status === 'processing') {
      callback({ ret: { code: -1, message: '操作正在处理中，请勿重复提交' } });
      return;
    }

    // 3. 更新 OrgSettings.ruleConfig（禁用集合增删）
    const settingsCol: CloudDBCollection<OrgSettings> = db.collection(OrgSettings);
    const rows = await settingsCol.query().equalTo('orgId', orgId).get();
    const settings = rows.length > 0 ? rows[0] : new OrgSettings();
    settings.orgId = orgId;

    let config: { disabled?: string[] } = {};
    try {
      config = JSON.parse(settings.ruleConfig || '{}');
      if (!config || typeof config !== 'object' || Array.isArray(config)) config = {};
    } catch {
      config = {};
    }
    const disabled = new Set(Array.isArray(config.disabled) ? config.disabled.map(String) : []);
    const beforeEnabled = !disabled.has(ruleId);
    if (enabled) {
      disabled.delete(ruleId);
    } else {
      disabled.add(ruleId);
    }
    settings.ruleConfig = JSON.stringify({ disabled: Array.from(disabled) });
    await settingsCol.upsert([settings]);

    // 4. 审计 + 事件（correlationId 贯通）
    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, 'set-rule-enabled', ruleId, `治理规则 ${ruleId}`,
      userId,
      { id: ruleId, enabled: beforeEnabled },
      { id: ruleId, enabled },
      enabled ? '启用治理规则' : '停用治理规则',
      correlationId,
    );
    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'rule', ruleId, `治理规则 ${ruleId}`,
      userId,
      { ruleId, enabled, before: beforeEnabled },
      correlationId,
    );

    const result = { id: ruleId, enabled };
    await completeIdempotent(idemCol, idempotencyKey, result);

    logger.info(`set-rule-enabled done: orgId=${orgId}, ruleId=${ruleId}, enabled=${enabled}`);
    callback({ ret: { code: 0, message: 'ok', data: result } });
  } catch (err: any) {
    logger.error(`set-rule-enabled error: ${err.message}`);
    try {
      const params = parseParams(event);
      const idempotencyKey = String(params?.idempotencyKey || '');
      if (idempotencyKey) {
        const db = cloud.database({ zoneName: ZONE_NAME });
        await failIdempotent(db.collection(IdempotencyRecord), idempotencyKey);
      }
    } catch {
      // 幂等记录失败不影响错误返回
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
