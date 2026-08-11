export class ApprovalFlow {
  id: string = '';
  orgId: string = '';
  name: string = '';
  bizType: string = 'finance';
  nodes: string = '[]';
  enabled: boolean = true;
  isDefault: boolean = false;
  createdAt: Date = new Date();
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'ApprovalFlow';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('name', 'String');
    map.set('bizType', 'String');
    map.set('nodes', 'String');
    map.set('enabled', 'Boolean');
    map.set('isDefault', 'Boolean');
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

  static parseFrom(data: any): ApprovalFlow {
    const obj = new ApprovalFlow();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.name = data.name ?? '';
      obj.bizType = data.bizType ?? 'finance';
      obj.nodes = data.nodes ?? '[]';
      obj.enabled = data.enabled ?? true;
      obj.isDefault = data.isDefault ?? false;
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
