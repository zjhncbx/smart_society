export class Resolution {
  id: string = '';
  orgId: string = '';
  code: string = '';
  title: string = '';
  content: string = '';
  status: string = 'pending';
  responsibleMemberId: string = '';
  responsibleName: string = '';
  deadline: Date | null = null;
  meetingId: string = '';
  projectId: string = '';
  sourceRuleId: string = '';
  correlationId: string = '';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'Resolution';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('code', 'String');
    map.set('title', 'String');
    map.set('content', 'String');
    map.set('status', 'String');
    map.set('responsibleMemberId', 'String');
    map.set('responsibleName', 'String');
    map.set('deadline', 'Date');
    map.set('meetingId', 'String');
    map.set('projectId', 'String');
    map.set('sourceRuleId', 'String');
    map.set('correlationId', 'String');
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

  static parseFrom(data: any): Resolution {
    const obj = new Resolution();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.code = data.code ?? '';
      obj.title = data.title ?? '';
      obj.content = data.content ?? '';
      obj.status = data.status ?? 'pending';
      obj.responsibleMemberId = data.responsibleMemberId ?? '';
      obj.responsibleName = data.responsibleName ?? '';
      obj.deadline = data.deadline ? new Date(data.deadline) : null;
      obj.meetingId = data.meetingId ?? '';
      obj.projectId = data.projectId ?? '';
      obj.sourceRuleId = data.sourceRuleId ?? '';
      obj.correlationId = data.correlationId ?? '';
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
