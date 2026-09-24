export class AutoTask {
  id: string = '';
  orgId: string = '';
  title: string = '';
  description: string = '';
  sourceType: string = 'auto';
  correlationId: string = '';
  sourceRuleId: string = '';
  sourceRuleName: string = '';
  sourceEntityType: string = '';
  sourceEntityId: string = '';
  sourceEntityName: string = '';
  triggerEventId: string = '';
  assigneeId: string = '';
  assigneeName: string = '';
  priority: string = 'medium';
  status: string = 'open';
  slaDeadline: Date | null = null;
  escalationLevel: number = 0;
  escalatedAt: Date | null = null;
  completedAt: Date | null = null;
  completedBy: string = '';
  completedByName: string = '';
  createdAt: Date | null = null;
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'AutoTask';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('title', 'String');
    map.set('description', 'String');
    map.set('sourceType', 'String');
    map.set('correlationId', 'String');
    map.set('sourceRuleId', 'String');
    map.set('sourceRuleName', 'String');
    map.set('sourceEntityType', 'String');
    map.set('sourceEntityId', 'String');
    map.set('sourceEntityName', 'String');
    map.set('triggerEventId', 'String');
    map.set('assigneeId', 'String');
    map.set('assigneeName', 'String');
    map.set('priority', 'String');
    map.set('status', 'String');
    map.set('slaDeadline', 'Date');
    map.set('escalationLevel', 'Integer');
    map.set('escalatedAt', 'Date');
    map.set('completedAt', 'Date');
    map.set('completedBy', 'String');
    map.set('completedByName', 'String');
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

  static parseFrom(data: any): AutoTask {
    const obj = new AutoTask();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.title = data.title ?? '';
      obj.description = data.description ?? '';
      obj.sourceType = data.sourceType ?? 'auto';
      obj.correlationId = data.correlationId ?? '';
      obj.sourceRuleId = data.sourceRuleId ?? '';
      obj.sourceRuleName = data.sourceRuleName ?? '';
      obj.sourceEntityType = data.sourceEntityType ?? '';
      obj.sourceEntityId = data.sourceEntityId ?? '';
      obj.sourceEntityName = data.sourceEntityName ?? '';
      obj.triggerEventId = data.triggerEventId ?? '';
      obj.assigneeId = data.assigneeId ?? '';
      obj.assigneeName = data.assigneeName ?? '';
      obj.priority = data.priority ?? 'medium';
      obj.status = data.status ?? 'open';
      obj.slaDeadline = data.slaDeadline ? new Date(data.slaDeadline) : null;
      obj.escalationLevel = data.escalationLevel ?? 0;
      obj.escalatedAt = data.escalatedAt ? new Date(data.escalatedAt) : null;
      obj.completedAt = data.completedAt ? new Date(data.completedAt) : null;
      obj.completedBy = data.completedBy ?? '';
      obj.completedByName = data.completedByName ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
