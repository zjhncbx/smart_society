export class Term {
  id: string = ''; orgId: string = ''; code: string = ''; title: string = '';
  governanceBody: string = ''; startDate: Date | null = null; endDate: Date | null = null;
  status: string = 'active'; correlationId: string = ''; version: number = 1;
  sourceType: string = 'manual'; sourceId: string = ''; isDeleted: boolean = false;
  createdAt: Date | null = null; createdBy: string = '';
  updatedAt: Date | null = null; updatedBy: string = '';
  getClassName(): string { return 'Term'; }
  getFieldTypeMap(): Map<string, string> {
    const m = new Map<string, string>();
    m.set('id', 'String'); m.set('orgId', 'String'); m.set('code', 'String'); m.set('title', 'String');
    m.set('governanceBody', 'String'); m.set('startDate', 'Date'); m.set('endDate', 'Date'); m.set('status', 'String');
    m.set('correlationId', 'String'); m.set('version', 'Integer'); m.set('sourceType', 'String'); m.set('sourceId', 'String');
    m.set('isDeleted', 'Boolean'); m.set('createdAt', 'Date'); m.set('createdBy', 'String');
    m.set('updatedAt', 'Date'); m.set('updatedBy', 'String');
    return m;
  }
  getPrimaryKeyList(): string[] { return ['id']; }
  getIndexList(): string[] { return ['id']; }
  getEncryptedFieldList(): string[] { return []; }
  static parseFrom(data: any): Term {
    const o = new Term();
    if (data) {
      o.id = data.id ?? ''; o.orgId = data.orgId ?? ''; o.code = data.code ?? ''; o.title = data.title ?? '';
      o.governanceBody = data.governanceBody ?? ''; o.startDate = data.startDate ? new Date(data.startDate) : null;
      o.endDate = data.endDate ? new Date(data.endDate) : null; o.status = data.status ?? 'active';
      o.correlationId = data.correlationId ?? ''; o.version = data.version ?? 1;
      o.sourceType = data.sourceType ?? 'manual'; o.sourceId = data.sourceId ?? ''; o.isDeleted = data.isDeleted === true;
      o.createdAt = data.createdAt ? new Date(data.createdAt) : null; o.createdBy = data.createdBy ?? '';
      o.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null; o.updatedBy = data.updatedBy ?? '';
    }
    return o;
  }
}
