export class DataQualityIssue {
  id: string = '';
  orgId: string = '';
  ruleId: string = '';
  ruleName: string = '';
  category: string = '';
  entityType: string = '';
  entityId: string = '';
  entityName: string = '';
  severity: string = 'medium';
  description: string = '';
  detail: string = '{}';
  status: string = 'open';
  assignedTo: string = '';
  assignedToName: string = '';
  checkCount: number = 1;
  lastCheckedAt: Date | null = null;
  resolvedAt: Date | null = null;
  resolvedBy: string = '';
  resolvedByName: string = '';
  createdAt: Date | null = null;
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'DataQualityIssue';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('ruleId', 'String');
    map.set('ruleName', 'String');
    map.set('category', 'String');
    map.set('entityType', 'String');
    map.set('entityId', 'String');
    map.set('entityName', 'String');
    map.set('severity', 'String');
    map.set('description', 'String');
    map.set('detail', 'String');
    map.set('status', 'String');
    map.set('assignedTo', 'String');
    map.set('assignedToName', 'String');
    map.set('checkCount', 'Integer');
    map.set('lastCheckedAt', 'Date');
    map.set('resolvedAt', 'Date');
    map.set('resolvedBy', 'String');
    map.set('resolvedByName', 'String');
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

  static parseFrom(data: any): DataQualityIssue {
    const obj = new DataQualityIssue();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.ruleId = data.ruleId ?? '';
      obj.ruleName = data.ruleName ?? '';
      obj.category = data.category ?? '';
      obj.entityType = data.entityType ?? '';
      obj.entityId = data.entityId ?? '';
      obj.entityName = data.entityName ?? '';
      obj.severity = data.severity ?? 'medium';
      obj.description = data.description ?? '';
      obj.detail = data.detail ?? '{}';
      obj.status = data.status ?? 'open';
      obj.assignedTo = data.assignedTo ?? '';
      obj.assignedToName = data.assignedToName ?? '';
      obj.checkCount = data.checkCount ?? 1;
      obj.lastCheckedAt = data.lastCheckedAt ? new Date(data.lastCheckedAt) : null;
      obj.resolvedAt = data.resolvedAt ? new Date(data.resolvedAt) : null;
      obj.resolvedBy = data.resolvedBy ?? '';
      obj.resolvedByName = data.resolvedByName ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
