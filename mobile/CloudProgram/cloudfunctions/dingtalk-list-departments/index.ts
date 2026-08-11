import * as https from 'https';

// Compatible with multiple event shapes: event.body string/object, SDK 'data' wrapper.
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

const DINGTALK_HOST = 'oapi.dingtalk.com';
const HTTP_TIMEOUT = 10000;

function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: HTTP_TIMEOUT }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e: any) {
          reject(new Error(`钉钉接口返回非JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`钉钉接口请求失败: ${e.message}`)));
    req.on('timeout', () => { req.destroy(new Error('钉钉接口请求超时')); });
  });
}

function httpsPost(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: HTTP_TIMEOUT,
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e: any) {
          reject(new Error(`钉钉接口返回非JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`钉钉接口请求失败: ${e.message}`)));
    req.on('timeout', () => { req.destroy(new Error('钉钉接口请求超时')); });
    req.write(payload);
    req.end();
  });
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('dingtalk-list-departments called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const clientId = params?.clientId as string;
    const clientSecret = params?.clientSecret as string;
    if (!orgId || !clientId || !clientSecret) {
      callback({ ret: { code: -1, message: '缺少 orgId/clientId/clientSecret 参数' } });
      return;
    }

    // 1. 获取 access_token
    const tokenRes = await httpsGet(
      `https://${DINGTALK_HOST}/gettoken?appkey=${encodeURIComponent(clientId)}&appsecret=${encodeURIComponent(clientSecret)}`,
    );
    if (tokenRes.errcode !== 0 || !tokenRes.access_token) {
      callback({ ret: { code: -1, message: `钉钉获取凭证失败: ${tokenRes.errmsg || tokenRes.errcode}` } });
      return;
    }
    const token = tokenRes.access_token;

    // 2. 递归遍历部门，返回扁平列表（parentId 用于客户端组树；根节点 deptId=1）
    const depts: Array<{ deptId: number; name: string; parentId: number }> = [];
    depts.push({ deptId: 1, name: '', parentId: 0 });
    const visit = async (parentId: number): Promise<void> => {
      const res = await httpsPost(
        `https://${DINGTALK_HOST}/topapi/v2/department/listsub?access_token=${token}`,
        { dept_id: parentId },
      );
      if (res.errcode !== 0) {
        throw new Error(`钉钉获取部门列表失败: ${res.errmsg || res.errcode}`);
      }
      const subs: any[] = res.result || [];
      for (const d of subs) {
        depts.push({ deptId: d.dept_id, name: d.name || '', parentId });
        await visit(d.dept_id);
      }
    };
    await visit(1);

    logger.info(`dingtalk departments: ${depts.length}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { depts },
      },
    });
  } catch (err: any) {
    logger.error(`dingtalk-list-departments error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
