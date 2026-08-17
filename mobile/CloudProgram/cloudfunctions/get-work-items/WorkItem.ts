export class WorkItem {
  id: string = '';
  orgId: string = '';
  code: string = '';
  workItemType: string = '';
  originType: string = '';
  originId: string = '';
  originName: string = '';
  title: string = '';
  description: string = '';
  ownerId: string = '';
  ownerName: string = '';
  priority: string = 'medium';
  status: string = 'open';
  deadline: Date | null = null;
  slaDeadline: Date | null = null;
  escalationLevel: number = 0;
  completionCondition: string = '';
  sourceRuleId: string = '';
  sourceRuleName: string = '';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  correlationId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'WorkItem';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('code', 'String');
    map.set('workItemType', 'String');
    map.set('originType', 'String');
    map.set('originId', 'String');
    map.set('originName', 'String');
    map.set('title', 'String');
    map.set('description', 'String');
    map.set('ownerId', 'String');
    map.set('ownerName', 'String');
    map.set('priority', 'String');
    map.set('status', 'String');
    map.set('deadline', 'Date');
    map.set('slaDeadline', 'Date');
    map.set('escalationLevel', 'Integer');
    map.set('completionCondition', 'String');
    map.set('sourceRuleId', 'String');
    map.set('sourceRuleName', 'String');
    map.set('version', 'Integer');
    map.set('sourceType', 'String');
    map.set('sourceId', 'String');
    map.set('correlationId', 'String');
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

  static parseFrom(data: any): WorkItem {
    const obj = new WorkItem();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.code = data.code ?? '';
      obj.workItemType = data.workItemType ?? '';
      obj.originType = data.originType ?? '';
      obj.originId = data.originId ?? '';
      obj.originName = data.originName ?? '';
      obj.title = data.title ?? '';
      obj.description = data.description ?? '';
      obj.ownerId = data.ownerId ?? '';
      obj.ownerName = data.ownerName ?? '';
      obj.priority = data.priority ?? 'medium';
      obj.status = data.status ?? 'open';
      obj.deadline = data.deadline ? new Date(data.deadline) : null;
      obj.slaDeadline = data.slaDeadline ? new Date(data.slaDeadline) : null;
      obj.escalationLevel = data.escalationLevel ?? 0;
      obj.completionCondition = data.completionCondition ?? '';
      obj.sourceRuleId = data.sourceRuleId ?? '';
      obj.sourceRuleName = data.sourceRuleName ?? '';
      obj.version = data.version ?? 1;
      obj.sourceType = data.sourceType ?? 'manual';
      obj.sourceId = data.sourceId ?? '';
      obj.correlationId = data.correlationId ?? '';
      obj.isDeleted = data.isDeleted === true;
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.createdBy = data.createdBy ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
      obj.updatedBy = data.updatedBy ?? '';
    }
    return obj;
  }
}
