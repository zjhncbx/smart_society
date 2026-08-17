export class Role {
  id: string = '';
  orgId: string = '';
  code: string = '';
  name: string = '';
  builtin: boolean = true;
  permissions: string = '[]';
  dataScope: string = 'org';
  status: string = 'active';
  version: number = 1;
  sourceType: string = 'system';
  sourceId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'Role';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('code', 'String');
    map.set('name', 'String');
    map.set('builtin', 'Boolean');
    map.set('permissions', 'String');
    map.set('dataScope', 'String');
    map.set('status', 'String');
    map.set('version', 'Integer');
    map.set('sourceType', 'String');
    map.set('sourceId', 'String');
    map.set('isDeleted', 'Boolean');
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

  static parseFrom(data: any): Role {
    const obj = new Role();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.code = data.code ?? '';
      obj.name = data.name ?? '';
      obj.builtin = data.builtin !== false;
      obj.permissions = data.permissions ?? '[]';
      obj.dataScope = data.dataScope ?? 'org';
      obj.status = data.status ?? 'active';
      obj.version = data.version ?? 1;
      obj.sourceType = data.sourceType ?? 'system';
      obj.sourceId = data.sourceId ?? '';
      obj.isDeleted = data.isDeleted === true;
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.createdBy = data.createdBy ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
      obj.updatedBy = data.updatedBy ?? '';
    }
    return obj;
  }
}
