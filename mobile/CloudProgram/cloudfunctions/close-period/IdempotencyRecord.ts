export class IdempotencyRecord {
  id: string = '';
  orgId: string = '';
  action: string = '';
  entityType: string = '';
  entityId: string = '';
  result: string = '{}';
  status: string = 'processing';
  claimId: string = '';
  requestHash: string = '';
  code: string = '';
  updatedBy: string = '';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  createdAt: Date | null = null;
  expiresAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;

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
    map.set('status', 'String');
    map.set('claimId', 'String');
    map.set('requestHash', 'String');
    map.set('code', 'String');
    map.set('updatedBy', 'String');
    map.set('version', 'Integer');
    map.set('sourceType', 'String');
    map.set('sourceId', 'String');
    map.set('createdAt', 'Date');
    map.set('expiresAt', 'Date');
    map.set('createdBy', 'String');
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

  static parseFrom(data: any): IdempotencyRecord {
    const obj = new IdempotencyRecord();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.action = data.action ?? '';
      obj.entityType = data.entityType ?? '';
      obj.entityId = data.entityId ?? '';
      obj.result = data.result ?? '{}';
      obj.status = data.status ?? 'processing';
      obj.claimId = data.claimId ?? '';
      obj.requestHash = data.requestHash ?? '';
      obj.code = data.code ?? '';
      obj.updatedBy = data.updatedBy ?? '';
      obj.version = data.version ?? 1;
      obj.sourceType = data.sourceType ?? 'manual';
      obj.sourceId = data.sourceId ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      obj.createdBy = data.createdBy ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
