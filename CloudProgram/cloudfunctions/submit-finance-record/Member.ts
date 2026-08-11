export class Member {
  id: string = '';
  name: string = '';
  studentNo: string = '';
  department: string = '';
  roleId: string = '';
  roleLabel: string = '';
  phone: string = '';
  email: string = '';
  joinedAt: Date = new Date();
  dingTalkUserId: string = '';
  syncStatus: string = '';
  lastSyncedAt: Date | null = null;
  orgId: string = '';
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'Member';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('name', 'String');
    map.set('studentNo', 'String');
    map.set('department', 'String');
    map.set('roleId', 'String');
    map.set('roleLabel', 'String');
    map.set('phone', 'String');
    map.set('email', 'String');
    map.set('joinedAt', 'Date');
    map.set('dingTalkUserId', 'String');
    map.set('syncStatus', 'String');
    map.set('lastSyncedAt', 'Date');
    map.set('orgId', 'String');
    map.set('updatedAt', 'Date');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['id'];
  }

  getIndexList(): string[] {
    return ['id'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): Member {
    const obj = new Member();
    if (data) {
      obj.id = data.id ?? '';
      obj.name = data.name ?? '';
      obj.studentNo = data.studentNo ?? '';
      obj.department = data.department ?? '';
      obj.roleId = data.roleId ?? '';
      obj.roleLabel = data.roleLabel ?? '';
      obj.phone = data.phone ?? '';
      obj.email = data.email ?? '';
      obj.joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
      obj.dingTalkUserId = data.dingTalkUserId ?? '';
      obj.syncStatus = data.syncStatus ?? '';
      obj.lastSyncedAt = data.lastSyncedAt ? new Date(data.lastSyncedAt) : null;
      obj.orgId = data.orgId ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
