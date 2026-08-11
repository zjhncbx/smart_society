export class FinanceRecord {
  id: string = '';
  orgId: string = '';
  projectId: string = '';
  type: string = 'expense';
  amount: number = 0;
  category: string = '';
  categoryLabel: string = '';
  date: Date = new Date();
  summary: string = '';
  counterparty: string = '';
  voucherNo: string = '';
  entries: string = '[]';
  status: string = 'approving';
  flowId: string = '';
  instanceId: string = '';
  createdBy: string = '';
  createdByName: string = '';
  period: string = '';
  restricted: boolean = false;
  createdAt: Date = new Date();
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'FinanceRecord';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('projectId', 'String');
    map.set('type', 'String');
    map.set('amount', 'Double');
    map.set('category', 'String');
    map.set('categoryLabel', 'String');
    map.set('date', 'Date');
    map.set('summary', 'String');
    map.set('counterparty', 'String');
    map.set('voucherNo', 'String');
    map.set('entries', 'String');
    map.set('status', 'String');
    map.set('flowId', 'String');
    map.set('instanceId', 'String');
    map.set('createdBy', 'String');
    map.set('createdByName', 'String');
    map.set('period', 'String');
    map.set('restricted', 'Boolean');
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

  static parseFrom(data: any): FinanceRecord {
    const obj = new FinanceRecord();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.projectId = data.projectId ?? '';
      obj.type = data.type ?? 'expense';
      obj.amount = Number(data.amount) || 0;
      obj.category = data.category ?? '';
      obj.categoryLabel = data.categoryLabel ?? '';
      obj.date = data.date ? new Date(data.date) : new Date();
      obj.summary = data.summary ?? '';
      obj.counterparty = data.counterparty ?? '';
      obj.voucherNo = data.voucherNo ?? '';
      obj.entries = data.entries ?? '[]';
      obj.status = data.status ?? 'approving';
      obj.flowId = data.flowId ?? '';
      obj.instanceId = data.instanceId ?? '';
      obj.createdBy = data.createdBy ?? '';
      obj.createdByName = data.createdByName ?? '';
      obj.period = data.period ?? '';
      obj.restricted = data.restricted ?? false;
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
