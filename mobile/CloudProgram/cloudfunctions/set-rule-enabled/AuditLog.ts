export class AuditLog {
  id: string = '';
  orgId: string = '';
  code: string = '';
  action: string = '';
  entityType: string = '';
  entityId: string = '';
  entityName: string = '';
  actorId: string = '';
  actorName: string = '';
  before: string = 'null';
  after: string = 'null';
  changeReason: string = '';
  correlationId: string = '';
  status: string = 'success';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'AuditLog';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('code', 'String');
    map.set('action', 'String');
    map.set('entityType', 'String');
    map.set('entityId', 'String');
    map.set('entityName', 'String');
    map.set('actorId', 'String');
    map.set('actorName', 'String');
    map.set('before', 'String');
    map.set('after', 'String');
    map.set('changeReason', 'String');
    map.set('correlationId', 'String');
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

  static parseFrom(data: any): AuditLog {
    const obj = new AuditLog();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.code = data.code ?? '';
      obj.action = data.action ?? '';
      obj.entityType = data.entityType ?? '';
      obj.entityId = data.entityId ?? '';
      obj.entityName = data.entityName ?? '';
      obj.actorId = data.actorId ?? '';
      obj.actorName = data.actorName ?? '';
      obj.before = data.before ?? 'null';
      obj.after = data.after ?? 'null';
      obj.changeReason = data.changeReason ?? '';
      obj.correlationId = data.correlationId ?? '';
      obj.status = data.status ?? 'success';
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
