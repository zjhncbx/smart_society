import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { ApprovalFlow } from './ApprovalFlow';
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
const NODE_TYPES = ['approve', 'handle', 'cc'];

function isValidNodes(nodes: any): boolean {
  if (!Array.isArray(nodes) || nodes.length === 0) return false;
  return nodes.every((n: any) =>
    n && typeof n.id === 'string' && NODE_TYPES.includes(n.type) &&
    (Array.isArray(n.roleIds) || Array.isArray(n.userIds)));
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-approval-flow called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const flow = params?.flow as any;
    if (!orgId || !userId || !flow || !flow.id || !flow.name) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/flow 参数' } });
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
      callback({ ret: { code: -1, message: '仅组织管理员可以设置审批流程' } });
      return;
    }

    const nodes = flow.nodes ?? [];
    if (!isValidNodes(nodes)) {
      callback({ ret: { code: -1, message: '流程节点不合法（需至少一个节点，类型为审批/办理/抄送）' } });
      return;
    }

    const col: CloudDBCollection<ApprovalFlow> = db.collection(ApprovalFlow);
    const bizType = flow.bizType === 'project' ? 'project' : 'finance';
    const now = new Date();
    const obj = new ApprovalFlow();
    obj.id = String(flow.id);
    obj.orgId = orgId;
    obj.name = String(flow.name).trim();
    obj.bizType = bizType;
    obj.nodes = JSON.stringify(nodes);
    obj.enabled = flow.enabled !== false;
    obj.isDefault = flow.isDefault === true;
    obj.createdAt = now;
    obj.updatedAt = now;

    if (obj.isDefault) {
      const others = await col.query().equalTo('orgId', orgId).get();
      for (const o of others) {
        if (o.id !== obj.id && o.bizType === bizType && o.isDefault) {
          o.isDefault = false;
          await col.upsert([o]);
        }
      }
    }

    await col.upsert([obj]);
    logger.info(`save-approval-flow done: orgId=${orgId}, flowId=${obj.id}`);
    callback({ ret: { code: 0, message: 'ok', data: { flowId: obj.id } } });
  } catch (err: any) {
    logger.error(`save-approval-flow error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
