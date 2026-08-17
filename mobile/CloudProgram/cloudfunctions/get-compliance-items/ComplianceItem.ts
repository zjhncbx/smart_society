export class ComplianceItem {
  id: string = ''; orgId: string = ''; code: string = ''; name: string = '';
  itemType: string = 'other'; deadline: Date | null = null; status: string = 'pending';
  responsibleMemberId: string = ''; responsibleName: string = ''; correlationId: string = '';
  version: number = 1; sourceType: string = 'manual'; sourceId: string = ''; isDeleted: boolean = false;
  createdAt: Date | null = null; createdBy: string = '';
  updatedAt: Date | null = null; updatedBy: string = '';
  getClassName(): string { return 'ComplianceItem'; }
  getFieldTypeMap(): Map<string, string> {
    const m = new Map<string, string>();
    m.set('id', 'String'); m.set('orgId', 'String'); m.set('code', 'String'); m.set('name', 'String');
    m.set('itemType', 'String'); m.set('deadline', 'Date'); m.set('status', 'String');
    m.set('responsibleMemberId', 'String'); m.set('responsibleName', 'String'); m.set('correlationId', 'String');
    m.set('version', 'Integer'); m.set('sourceType', 'String'); m.set('sourceId', 'String'); m.set('isDeleted', 'Boolean');
    m.set('createdAt', 'Date'); m.set('createdBy', 'String'); m.set('updatedAt', 'Date'); m.set('updatedBy', 'String');
    return m;
  }
  getPrimaryKeyList(): string[] { return ['id']; }
  getIndexList(): string[] { return ['id']; }
  getEncryptedFieldList(): string[] { return []; }
  static parseFrom(data: any): ComplianceItem {
    const o = new ComplianceItem();
    if (data) {
      o.id = data.id ?? ''; o.orgId = data.orgId ?? ''; o.code = data.code ?? ''; o.name = data.name ?? '';
      o.itemType = data.itemType ?? 'other'; o.deadline = data.deadline ? new Date(data.deadline) : null;
      o.status = data.status ?? 'pending'; o.responsibleMemberId = data.responsibleMemberId ?? '';
      o.responsibleName = data.responsibleName ?? ''; o.correlationId = data.correlationId ?? '';
      o.version = data.version ?? 1; o.sourceType = data.sourceType ?? 'manual'; o.sourceId = data.sourceId ?? '';
      o.isDeleted = data.isDeleted === true; o.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      o.createdBy = data.createdBy ?? ''; o.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
      o.updatedBy = data.updatedBy ?? '';
    }
    return o;
  }
}
