export class DataScope {
  id: string = '';
  orgId: string = '';
  roleId: string = '';
  userId: string = '';
  scopeType: string = 'org';
  dataTypes: string = '[]';
  status: string = 'active';
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'DataScope';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('roleId', 'String');
    map.set('userId', 'String');
    map.set('scopeType', 'String');
    map.set('dataTypes', 'String');
    map.set('status', 'String');
    map.set('createdAt', 'Date');
    map.set('createdBy', 'String');
    map.set('updatedAt', 'Date');
    map.set('updatedBy', 'String');
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

  static parseFrom(data: any): DataScope {
    const obj = new DataScope();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.roleId = data.roleId ?? '';
      obj.userId = data.userId ?? '';
      obj.scopeType = data.scopeType ?? 'org';
      obj.dataTypes = data.dataTypes ?? '[]';
      obj.status = data.status ?? 'active';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.createdBy = data.createdBy ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
      obj.updatedBy = data.updatedBy ?? '';
    }
    return obj;
  }
}
