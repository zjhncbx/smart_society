import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Organization } from './Organization';
import { UserOrganization } from './UserOrganization';

const ZONE_NAME = 'default';

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('join-org called');

  try {
    const params = event.body ? JSON.parse(event.body) : event;
    const userId = params?.userId as string;
    const orgId = params?.orgId as string;

    if (!userId) {
      callback({ ret: { code: -1, message: '缺少用户标识' } });
      return;
    }
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少组织标识' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });

    // 检查组织是否存在
    const orgCol: CloudDBCollection<Organization> = db.collection(Organization);
    const orgList = await orgCol.query().equalTo('orgId', orgId).get();
    if (orgList.length === 0) {
      callback({ ret: { code: -1, message: '组织不存在' } });
      return;
    }

    // 检查用户是否已加入
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const existing = await uoCol.query().equalTo('userId', userId).equalTo('orgId', orgId).get();
    if (existing.length > 0) {
      callback({ ret: { code: -1, message: '您已是该组织成员' } });
      return;
    }

    const uo = new UserOrganization();
    uo.id = `${orgId}_${userId}`;
    uo.userId = userId;
    uo.orgId = orgId;
    uo.role = 'member';
    uo.joinedAt = new Date();
    await uoCol.upsert([uo]);

    logger.info(`join-org done: userId=${userId}, orgId=${orgId}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`join-org error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
