import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('set-org-admin called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const memberId = ((params?.memberId as string) || '').trim();
    if (!orgId || !userId || !memberId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/memberId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 1. 操作者必须是该组织管理员
    const acting = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (acting.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (acting[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以变更管理员' } });
      return;
    }

    // 2. 目标会员必须已被某账号绑定
    const targets = await uoCol.query().equalTo('memberId', memberId).get();
    if (targets.length === 0) {
      callback({ ret: { code: -1, message: `会员 ${memberId} 未绑定账号，无法变更管理员` } });
      return;
    }
    const target = targets[0];
    if (target.orgId !== orgId) {
      callback({ ret: { code: -1, message: '该会员不属于当前组织' } });
      return;
    }
    if (target.id === acting[0].id) {
      callback({ ret: { code: -1, message: '不能将管理员转让给自己' } });
      return;
    }

    // 3. 会员记录应仍存在（绑定可能因成员被删而失效）
    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const memberRows = await memberCol.query().equalTo('id', memberId).get();
    if (memberRows.length === 0 || memberRows[0].orgId !== orgId) {
      callback({ ret: { code: -1, message: `会员 ${memberId} 不存在` } });
      return;
    }

    // 4. 转让：操作者降为 member，目标升为 admin
    acting[0].role = 'member';
    target.role = 'admin';
    await uoCol.upsert([acting[0], target]);

    logger.info(`set-org-admin done: orgId=${orgId}, admin=${target.userId}, from=${userId}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          orgId,
          previousAdminUserId: userId,
          newAdminUserId: target.userId,
          newAdminMemberId: memberId,
        },
      },
    });
  } catch (err: any) {
    logger.error(`set-org-admin error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
