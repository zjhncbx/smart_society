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
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** 按手机号在组织内查找会员（phone 无索引，分页全扫） */
async function findMemberByPhone(col: CloudDBCollection<Member>, orgId: string, phone: string): Promise<Member | null> {
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    if (rows.length === 0) break;
    for (const m of rows) {
      if ((m.phone || '').trim() === phone) return m;
    }
  }
  return null;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('bind-member called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const phone = ((params?.phone as string) || '').trim();
    if (!orgId || !userId || !phone) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/phone 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);

    // 1. 用户必须是该组织成员
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const myUo = mine[0];

    // 2. 按手机号定位会员
    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const member = await findMemberByPhone(memberCol, orgId, phone);
    if (!member) {
      callback({ ret: { code: -1, message: `未找到手机号为「${phone}」的会员` } });
      return;
    }

    // 3. 会员只能被一个账号绑定
    const boundBy = await uoCol.query().equalTo('memberId', member.id).get();
    if (boundBy.length > 0 && boundBy[0].userId !== userId) {
      callback({ ret: { code: -1, message: `会员「${member.name}」已被其他账号绑定` } });
      return;
    }

    // 4. 写绑定（重复绑定同一会员为幂等；换绑需目标会员未占用）
    if (myUo.memberId === member.id) {
      callback({
        ret: {
          code: 0,
          message: 'ok',
          data: { memberId: member.id, memberName: member.name, memberPhone: member.phone },
        },
      });
      return;
    }
    myUo.memberId = member.id;
    await uoCol.upsert([myUo]);

    logger.info(`bind-member done: orgId=${orgId}, userId=${userId}, memberId=${member.id}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { memberId: member.id, memberName: member.name, memberPhone: member.phone },
      },
    });
  } catch (err: any) {
    logger.error(`bind-member error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
