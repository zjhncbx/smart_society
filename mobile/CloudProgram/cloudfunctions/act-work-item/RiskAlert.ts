export class RiskAlert {
  id: string = '';
  orgId: string = '';
  kind: string = 'warning';
  title: string = '';
  description: string = '';
  sourceRuleId: string = '';
  sourceRuleName: string = '';
  sourceEntityType: string = '';
  sourceEntityId: string = '';
  sourceEntityName: string = '';
  triggerEventId: string = '';
  severity: string = 'medium';
  status: string = 'open';
  ownerId: string = '';
  ownerName: string = '';
  deadline: Date | null = null;
  resolvedAt: Date | null = null;
  resolvedBy: string = '';
  resolvedByName: string = '';
  metadata: string = '{}';
  correlationId: string = '';
  createdAt: Date | null = null;
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'RiskAlert';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('kind', 'String');
    map.set('title', 'String');
    map.set('description', 'String');
    map.set('sourceRuleId', 'String');
    map.set('sourceRuleName', 'String');
    map.set('sourceEntityType', 'String');
    map.set('sourceEntityId', 'String');
    map.set('sourceEntityName', 'String');
    map.set('triggerEventId', 'String');
    map.set('severity', 'String');
    map.set('status', 'String');
    map.set('ownerId', 'String');
    map.set('ownerName', 'String');
    map.set('deadline', 'Date');
    map.set('resolvedAt', 'Date');
    map.set('resolvedBy', 'String');
    map.set('resolvedByName', 'String');
    map.set('metadata', 'String');
    map.set('correlationId', 'String');
    map.set('createdAt', 'Date');
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

  static parseFrom(data: any): RiskAlert {
    const obj = new RiskAlert();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.kind = data.kind ?? 'warning';
      obj.title = data.title ?? '';
      obj.description = data.description ?? '';
      obj.sourceRuleId = data.sourceRuleId ?? '';
      obj.sourceRuleName = data.sourceRuleName ?? '';
      obj.sourceEntityType = data.sourceEntityType ?? '';
      obj.sourceEntityId = data.sourceEntityId ?? '';
      obj.sourceEntityName = data.sourceEntityName ?? '';
      obj.triggerEventId = data.triggerEventId ?? '';
      obj.severity = data.severity ?? 'medium';
      obj.status = data.status ?? 'open';
      obj.ownerId = data.ownerId ?? '';
      obj.ownerName = data.ownerName ?? '';
      obj.deadline = data.deadline ? new Date(data.deadline) : null;
      obj.resolvedAt = data.resolvedAt ? new Date(data.resolvedAt) : null;
      obj.resolvedBy = data.resolvedBy ?? '';
      obj.resolvedByName = data.resolvedByName ?? '';
      obj.metadata = data.metadata ?? '{}';
      obj.correlationId = data.correlationId ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
