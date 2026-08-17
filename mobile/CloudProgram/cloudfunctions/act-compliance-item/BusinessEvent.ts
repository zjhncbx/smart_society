export class BusinessEvent {
  id: string = '';
  orgId: string = '';
  eventType: string = 'created';
  entityType: string = '';
  entityId: string = '';
  entityName: string = '';
  actorId: string = '';
  actorName: string = '';
  level: string = 'info';
  metadata: string = '{}';
  sourceType: string = 'manual';
  sourceId: string = '';
  correlationId: string = '';
  code: string = '';
  status: string = 'active';
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';
  version: number = 1;
  isDeleted: boolean = false;
  occurredAt: Date = new Date();
  createdAt: Date | null = null;

  getClassName(): string {
    return 'BusinessEvent';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('eventType', 'String');
    map.set('entityType', 'String');
    map.set('entityId', 'String');
    map.set('entityName', 'String');
    map.set('actorId', 'String');
    map.set('actorName', 'String');
    map.set('level', 'String');
    map.set('metadata', 'String');
    map.set('sourceType', 'String');
    map.set('sourceId', 'String');
    map.set('correlationId', 'String');
    map.set('code', 'String');
    map.set('status', 'String');
    map.set('createdBy', 'String');
    map.set('updatedAt', 'Date');
    map.set('updatedBy', 'String');
    map.set('version', 'Integer');
    map.set('isDeleted', 'Boolean');
    map.set('occurredAt', 'Date');
    map.set('createdAt', 'Date');
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

  static parseFrom(data: any): BusinessEvent {
    const obj = new BusinessEvent();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.eventType = data.eventType ?? 'created';
      obj.entityType = data.entityType ?? '';
      obj.entityId = data.entityId ?? '';
      obj.entityName = data.entityName ?? '';
      obj.actorId = data.actorId ?? '';
      obj.actorName = data.actorName ?? '';
      obj.level = data.level ?? 'info';
      obj.metadata = data.metadata ?? '{}';
      obj.sourceType = data.sourceType ?? 'manual';
      obj.sourceId = data.sourceId ?? '';
      obj.correlationId = data.correlationId ?? '';
      obj.code = data.code ?? '';
      obj.status = data.status ?? 'active';
      obj.createdBy = data.createdBy ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
      obj.updatedBy = data.updatedBy ?? '';
      obj.version = data.version ?? 1;
      obj.isDeleted = data.isDeleted === true;
      obj.occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    }
    return obj;
  }
}
