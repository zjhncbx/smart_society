export class IdempotencyRecord {
  id: string = '';
  orgId: string = '';
  action: string = '';
  entityType: string = '';
  entityId: string = '';
  result: string = '{}';
  createdAt: Date | null = null;
  expiresAt: Date | null = null;
  createdBy: string = '';

  getClassName(): string {
    return 'IdempotencyRecord';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('action', 'String');
    map.set('entityType', 'String');
    map.set('entityId', 'String');
    map.set('result', 'String');
    map.set('createdAt', 'Date');
    map.set('expiresAt', 'Date');
    map.set('createdBy', 'String');
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

  static parseFrom(data: any): IdempotencyRecord {
    const obj = new IdempotencyRecord();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.action = data.action ?? '';
      obj.entityType = data.entityType ?? '';
      obj.entityId = data.entityId ?? '';
      obj.result = data.result ?? '{}';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      obj.createdBy = data.createdBy ?? '';
    }
    return obj;
  }
}
