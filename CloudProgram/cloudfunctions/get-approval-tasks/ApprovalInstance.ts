export class ApprovalInstance {
  id: string = '';
  orgId: string = '';
  flowId: string = '';
  flowName: string = '';
  bizType: string = 'finance';
  bizId: string = '';
  title: string = '';
  status: string = 'running';
  currentIndex: number = 0;
  nodeSnapshot: string = '{}';
  history: string = '[]';
  createdBy: string = '';
  createdByName: string = '';
  createdAt: Date = new Date();
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'ApprovalInstance';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('flowId', 'String');
    map.set('flowName', 'String');
    map.set('bizType', 'String');
    map.set('bizId', 'String');
    map.set('title', 'String');
    map.set('status', 'String');
    map.set('currentIndex', 'Integer');
    map.set('nodeSnapshot', 'String');
    map.set('history', 'String');
    map.set('createdBy', 'String');
    map.set('createdByName', 'String');
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

  static parseFrom(data: any): ApprovalInstance {
    const obj = new ApprovalInstance();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.flowId = data.flowId ?? '';
      obj.flowName = data.flowName ?? '';
      obj.bizType = data.bizType ?? 'finance';
      obj.bizId = data.bizId ?? '';
      obj.title = data.title ?? '';
      obj.status = data.status ?? 'running';
      obj.currentIndex = Number(data.currentIndex) || 0;
      obj.nodeSnapshot = data.nodeSnapshot ?? '{}';
      obj.history = data.history ?? '[]';
      obj.createdBy = data.createdBy ?? '';
      obj.createdByName = data.createdByName ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
