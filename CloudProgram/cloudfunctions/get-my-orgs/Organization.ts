export class Organization {
  orgId: string = '';
  name: string = '';
  orgType: string = 'schoolClub';
  creditCode: string = '';
  description: string = '';
  parentOrgId: string = '';
  creatorUserId: string = '';
  createdAt: Date = new Date();
  status: string = 'active';

  getClassName(): string {
    return 'Organization';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('orgId', 'String');
    map.set('name', 'String');
    map.set('orgType', 'String');
    map.set('creditCode', 'String');
    map.set('description', 'String');
    map.set('parentOrgId', 'String');
    map.set('creatorUserId', 'String');
    map.set('createdAt', 'Date');
    map.set('status', 'String');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['orgId'];
  }

  getIndexList(): string[] {
    return ['orgId', 'name'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): Organization {
    const obj = new Organization();
    if (data) {
      obj.orgId = data.orgId ?? '';
      obj.name = data.name ?? '';
      obj.orgType = data.orgType ?? 'schoolClub';
      obj.creditCode = data.creditCode ?? '';
      obj.description = data.description ?? '';
      obj.parentOrgId = data.parentOrgId ?? '';
      obj.creatorUserId = data.creatorUserId ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.status = data.status ?? 'active';
    }
    return obj;
  }
}
