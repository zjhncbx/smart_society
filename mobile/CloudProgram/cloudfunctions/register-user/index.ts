import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import * as crypto from 'crypto';
import { AppUser } from './AppUser';

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

function detectAccount(account: string): 'phone' | 'email' | '' {
  if (/^1\d{10}$/.test(account)) return 'phone';
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(account)) return 'email';
  return '';
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('register-user called');

  try {
    const params = parseParams(event);
    const account = String(params?.account || '').trim().toLowerCase();
    const password = String(params?.password || '');
    const displayName = String(params?.displayName || '').trim();
    if (!account || !password) {
      callback({ ret: { code: -1, message: '请输入手机号/邮箱与密码' } });
      return;
    }
    const type = detectAccount(account);
    if (!type) {
      callback({ ret: { code: -1, message: '请输入正确的手机号或邮箱' } });
      return;
    }
    if (password.length < 6) {
      callback({ ret: { code: -1, message: '密码长度至少 6 位' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<AppUser> = db.collection(AppUser);
    const dup = await (type === 'phone'
      ? col.query().equalTo('phone', account)
      : col.query().equalTo('email', account)
    ).get();
    if (dup.length > 0) {
      callback({ ret: { code: -1, message: '该账号已注册，请直接登录' } });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const now = new Date();
    const user = new AppUser();
    user.id = 'u' + Date.now();
    if (type === 'phone') user.phone = account;
    if (type === 'email') user.email = account;
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.displayName = displayName || (type === 'phone' ? '用户' : account.split('@')[0]);
    user.createdAt = now;
    user.updatedAt = now;
    await col.upsert([user]);

    logger.info(`register-user done: id=${user.id}, type=${type}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { userId: user.id, displayName: user.displayName },
      },
    });
  } catch (err: any) {
    logger.error(`register-user error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
