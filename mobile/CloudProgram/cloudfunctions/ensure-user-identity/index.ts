import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AppUser } from './AppUser';
import { ExternalIdentity } from './ExternalIdentity';

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

function randomId(prefix: string): string {
  return prefix + Date.now() + Math.floor(Math.random() * 1000000);
}

/**
 * 跨端统一身份引导层：外部登录（如华为账号）→ 稳定内部 userId。
 *
 * 规范：docs/跨端统一用户身份与唯一标识规范.md
 * - providerSubject（华为 OpenID 等）不得直接作为业务主键
 * - 同一 provider + providerSubject 始终返回同一个内部 userId
 */
let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('ensure-user-identity called');

  try {
    const params = parseParams(event);
    const provider = String(params?.provider || '').trim();
    const providerSubject = String(params?.providerSubject || '').trim();
    const displayName = String(params?.displayName || '').trim();
    if (!provider || !providerSubject) {
      callback({ ret: { code: -1, message: '缺少 provider/providerSubject 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const eiCol: CloudDBCollection<ExternalIdentity> = db.collection(ExternalIdentity);
    const rows = await eiCol
      .query()
      .equalTo('provider', provider)
      .equalTo('providerSubject', providerSubject)
      .get();

    const now = new Date();
    if (rows.length > 0) {
      const identity = rows[0];
      if (identity.isDeleted) {
        identity.isDeleted = false;
        identity.status = 'active';
        identity.updatedAt = now;
        identity.updatedBy = identity.userId;
        await eiCol.upsert([identity]);
      }
      callback({
        ret: {
          code: 0,
          message: 'ok',
          data: {
            userId: identity.userId,
            identityId: identity.identityId,
            isNew: false,
            displayName: identity.displayName,
          },
        },
      });
      return;
    }

    // 新建内部用户 + 外部身份映射
    const userCol: CloudDBCollection<AppUser> = db.collection(AppUser);
    const userId = randomId('u');
    const user = new AppUser();
    user.id = userId;
    user.displayName = displayName || provider;
    user.createdAt = now;
    user.updatedAt = now;
    await userCol.upsert([user]);

    const identity = new ExternalIdentity();
    identity.identityId = randomId('ei');
    identity.userId = userId;
    identity.provider = provider;
    identity.providerSubject = providerSubject;
    identity.status = 'active';
    identity.displayName = displayName || provider;
    identity.version = 1;
    identity.sourceType = 'manual';
    identity.sourceId = '';
    identity.isDeleted = false;
    identity.createdAt = now;
    identity.createdBy = userId;
    identity.updatedAt = now;
    identity.updatedBy = userId;
    await eiCol.upsert([identity]);

    logger.info(`ensure-user-identity done: userId=${userId}, provider=${provider}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          userId,
          identityId: identity.identityId,
          isNew: true,
          displayName: identity.displayName,
        },
      },
    });
  } catch (err: any) {
    logger.error(`ensure-user-identity error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
