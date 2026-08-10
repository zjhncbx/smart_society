import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
import { UserOrganization } from './UserOrganization';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('create-org called');

  try {
    const params = event.body ? JSON.parse(event.body) : event;
    const name = params?.name as string;
    const orgType = params?.orgType as string || 'schoolClub';
    const creditCode = params?.creditCode as string || '';
    const description = params?.description as string || '';
    const userId = params?.userId as string;

    if (!name || !name.trim()) {
      callback({ ret: { code: -1, message: '组织名称不能为空' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少用户标识' } });
      return;
    }
    if (!['schoolClub', 'volunteerTeam', 'socialOrg'].includes(orgType)) {
      callback({ ret: { code: -1, message: '无效的组织类型' } });
      return;
    }

    // 社会团体必须提供统一信用代码
    if (orgType === 'socialOrg') {
      if (!creditCode || creditCode.trim().length !== 18) {
        callback({ ret: { code: -1, message: '社会团体需要提供18位统一社会信用代码' } });
        return;
      }
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);

    // 检查名称唯一性
    const existing = await orgCol.query().equalTo('name', name.trim()).get();
    if (existing.length > 0) {
      callback({ ret: { code: -1, message: '组织名称已存在' } });
      return;
    }

    // 生成 orgId
    let orgId: string;
    if (orgType === 'socialOrg') {
      orgId = creditCode.trim();
    } else {
      orgId = `${orgType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    const now = new Date();
    const org = new Organization();
    org.orgId = orgId;
    org.name = name.trim();
    org.orgType = orgType;
    org.creditCode = creditCode.trim();
    org.description = description.trim();
    org.creatorUserId = userId;
    org.createdAt = now;
    org.status = 'active';
    await orgCol.upsert([org]);

    // 创建者加入组织
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const uo = new UserOrganization();
    uo.id = `${orgId}_${userId}`;
    uo.userId = userId;
    uo.orgId = orgId;
    uo.role = 'admin';
    uo.joinedAt = now;
    await uoCol.upsert([uo]);

    logger.info(`create-org done: orgId=${orgId}, name=${name}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { orgId, name: name.trim(), orgType, createdAt: now.toISOString() },
      },
    });
  } catch (err: any) {
    logger.error(`create-org error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
