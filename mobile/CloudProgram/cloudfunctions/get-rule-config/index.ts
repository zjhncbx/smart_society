import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { OrgSettings } from './OrgSettings';
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

/** GR-01~12 静态规则定义（语义与 run-governance-rules 引擎一致） */
interface RuleDef {
  id: string;
  name: string;
  category: string;
  whenText: string;
  ifText: string;
  thenText: string;
}

const RULE_DEFS: RuleDef[] = [
  {
    id: 'GR-01', name: '任务逾期自动升级', category: 'project',
    whenText: '项目任务设置了截止日期',
    ifText: '任务超过截止日期未完成（逾期 7 天预警、14 天升级为风险）',
    thenText: '生成自动任务，并按逾期天数升级优先级与风险等级',
  },
  {
    id: 'GR-02', name: '项目进度偏差', category: 'project',
    whenText: '项目处于未完结状态',
    ifText: '已超过计划结束日期，或时间进度过半（60%）而完成率不足 40%',
    thenText: '登记风险/预警并生成项目处理任务',
  },
  {
    id: 'GR-03', name: '审批SLA超时', category: 'approval',
    whenText: '审批流程处于运行中',
    ifText: '审批停留超过 3 天未处理',
    thenText: '登记预警，停留 7 天以上升级为风险',
  },
  {
    id: 'GR-04', name: '数据质量自动任务', category: 'data-quality',
    whenText: '数据质量检查发现问题',
    ifText: '问题严重级别为 medium/high 且未关闭',
    thenText: '自动生成修复任务并指派给问题责任人',
  },
  {
    id: 'GR-05', name: '预算执行异常', category: 'finance',
    whenText: '项目设置了预算',
    ifText: '已批准支出累计超过项目预算',
    thenText: '登记财务异常预警并生成预算处理任务',
  },
  {
    id: 'GR-06', name: '关键治理职位空缺', category: 'org',
    whenText: '组织类型定义了关键治理职位（会长/秘书长/监事长等）',
    ifText: '关键职位当前无在职成员',
    thenText: '登记高风险并生成任职安排任务',
  },
  {
    id: 'GR-07', name: '审批驳回异常', category: 'approval',
    whenText: '审批流程存在处理历史',
    ifText: '同一流程被驳回 2 次及以上',
    thenText: '登记预警并生成整改任务给发起人',
  },
  {
    id: 'GR-08', name: '项目长时间未更新', category: 'project',
    whenText: '项目未完结',
    ifText: '项目超过 60 天未更新',
    thenText: '登记预警并生成进度更新任务给项目负责人',
  },
  {
    id: 'GR-09', name: '决议逾期未执行', category: 'governance',
    whenText: '决议未完成',
    ifText: '决议超过截止日期仍未执行',
    thenText: '登记预警并生成推进任务给责任人',
  },
  {
    id: 'GR-10', name: '证照到期提醒', category: 'governance',
    whenText: '证照未过期且未删除',
    ifText: '距到期日 ≤90/30 天或已过期',
    thenText: '分级登记预警并生成续期任务',
  },
  {
    id: 'GR-11', name: '任期届满提醒', category: 'governance',
    whenText: '任期未归档',
    ifText: '距届满日 ≤180/90/30 天或已届满',
    thenText: '分级登记预警并生成换届准备任务',
  },
  {
    id: 'GR-12', name: '合规事项逾期', category: 'governance',
    whenText: '合规事项未完成',
    ifText: '超过截止日期未完成',
    thenText: '登记预警并生成完成整改任务',
  },
];

/** 解析 OrgSettings.ruleConfig 中的禁用规则集合 */
function parseDisabled(ruleConfig: string): Set<string> {
  const disabled = new Set<string>();
  try {
    const parsed = JSON.parse(ruleConfig || '{}');
    const list = parsed && Array.isArray(parsed.disabled) ? parsed.disabled : [];
    for (const id of list) disabled.add(String(id));
  } catch {
    // 配置损坏时按全部启用处理
  }
  return disabled;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-rule-config called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
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

    // 读取组织级规则启停配置
    const settingsCol: CloudDBCollection<OrgSettings> = db.collection(OrgSettings);
    const settingsRows = await settingsCol.query().equalTo('orgId', orgId).get();
    const disabled = parseDisabled(settingsRows.length > 0 ? settingsRows[0].ruleConfig : '{}');

    const rules = RULE_DEFS.map((def) => ({
      id: def.id,
      name: def.name,
      category: def.category,
      whenText: def.whenText,
      ifText: def.ifText,
      thenText: def.thenText,
      enabled: !disabled.has(def.id),
    }));

    logger.info(`get-rule-config done: orgId=${orgId}, rules=${rules.length}, disabled=${disabled.size}`);
    callback({ ret: { code: 0, message: 'ok', data: { rules } } });
  } catch (err: any) {
    logger.error(`get-rule-config error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
