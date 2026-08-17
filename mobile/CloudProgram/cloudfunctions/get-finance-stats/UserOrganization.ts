export class UserOrganization {
  id: string = '';
  userId: string = '';
  orgId: string = '';
  role: string = 'admin';
  memberId: string = '';
  roleId: string = '';
  dataScope: string = 'org';
  status: string = 'active';
  joinedAt: Date = new Date();

  getClassName(): string {
    return 'UserOrganization';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('userId', 'String');
    map.set('orgId', 'String');
    map.set('role', 'String');
    map.set('memberId', 'String');
    map.set('roleId', 'String');
    map.set('dataScope', 'String');
    map.set('status', 'String');
    map.set('joinedAt', 'Date');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['id'];
  }

  getIndexList(): string[] {
    return ['id', 'userId', 'memberId'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): UserOrganization {
    const obj = new UserOrganization();
    if (data) {
      obj.id = data.id ?? '';
      obj.userId = data.userId ?? '';
      obj.orgId = data.orgId ?? '';
      obj.role = data.role ?? 'admin';
      obj.memberId = data.memberId ?? '';
      obj.roleId = data.roleId ?? '';
      obj.dataScope = data.dataScope ?? 'org';
      obj.status = data.status ?? 'active';
      obj.joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    }
    return obj;
  }
}
