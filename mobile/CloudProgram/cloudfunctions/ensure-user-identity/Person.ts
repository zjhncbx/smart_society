export class Person {
  personId: string = '';
  userId: string = '';
  name: string = '';
  phone: string = '';
  email: string = '';
  status: string = 'active';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'Person';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('personId', 'String');
    map.set('userId', 'String');
    map.set('name', 'String');
    map.set('phone', 'String');
    map.set('email', 'String');
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
    return ['personId'];
  }

  getIndexList(): string[] {
    return ['personId', 'userId'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): Person {
    const obj = new Person();
    if (data) {
      obj.personId = data.personId ?? '';
      obj.userId = data.userId ?? '';
      obj.name = data.name ?? '';
      obj.phone = data.phone ?? '';
      obj.email = data.email ?? '';
      obj.status = data.status ?? 'active';
      obj.version = data.version ?? 1;
      obj.sourceType = data.sourceType ?? 'manual';
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
