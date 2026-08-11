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
  logger.info('login-user called');

  try {
    const params = parseParams(event);
    const account = String(params?.account || '').trim().toLowerCase();
    const password = String(params?.password || '');
    if (!account || !password) {
      callback({ ret: { code: -1, message: '请输入手机号/邮箱与密码' } });
      return;
    }
    const type = detectAccount(account);
    if (!type) {
      callback({ ret: { code: -1, message: '请输入正确的手机号或邮箱' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const col: CloudDBCollection<AppUser> = db.collection(AppUser);
    const rows = await (type === 'phone'
      ? col.query().equalTo('phone', account)
      : col.query().equalTo('email', account)
    ).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '账号不存在或未注册' } });
      return;
    }
    const user = rows[0];
    const hash = crypto.scryptSync(password, user.passwordSalt, 64);
    const stored = Buffer.from(user.passwordHash, 'hex');
    const ok = stored.length === hash.length && crypto.timingSafeEqual(hash, stored);
    if (!ok) {
      callback({ ret: { code: -1, message: '密码错误' } });
      return;
    }

    logger.info(`login-user done: id=${user.id}, type=${type}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          userId: user.id,
          displayName: user.displayName,
          phone: user.phone,
          email: user.email,
        },
      },
    });
  } catch (err: any) {
    logger.error(`login-user error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
