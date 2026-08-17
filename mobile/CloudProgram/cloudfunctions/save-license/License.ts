export class License {
  id: string = ''; orgId: string = ''; code: string = ''; name: string = '';
  licenseNo: string = ''; issuer: string = ''; issuedAt: Date | null = null;
  expireAt: Date | null = null; status: string = 'active'; ownerId: string = '';
  ownerName: string = ''; correlationId: string = ''; version: number = 1;
  sourceType: string = 'manual'; sourceId: string = ''; isDeleted: boolean = false;
  createdAt: Date | null = null; createdBy: string = '';
  updatedAt: Date | null = null; updatedBy: string = '';
  getClassName(): string { return 'License'; }
  getFieldTypeMap(): Map<string, string> {
    const m = new Map<string, string>();
    m.set('id', 'String'); m.set('orgId', 'String'); m.set('code', 'String'); m.set('name', 'String');
    m.set('licenseNo', 'String'); m.set('issuer', 'String'); m.set('issuedAt', 'Date'); m.set('expireAt', 'Date');
    m.set('status', 'String'); m.set('ownerId', 'String'); m.set('ownerName', 'String'); m.set('correlationId', 'String');
    m.set('version', 'Integer'); m.set('sourceType', 'String'); m.set('sourceId', 'String'); m.set('isDeleted', 'Boolean');
    m.set('createdAt', 'Date'); m.set('createdBy', 'String'); m.set('updatedAt', 'Date'); m.set('updatedBy', 'String');
    return m;
  }
  getPrimaryKeyList(): string[] { return ['id']; }
  getIndexList(): string[] { return ['id']; }
  getEncryptedFieldList(): string[] { return []; }
  static parseFrom(data: any): License {
    const o = new License();
    if (data) {
      o.id = data.id ?? ''; o.orgId = data.orgId ?? ''; o.code = data.code ?? ''; o.name = data.name ?? '';
      o.licenseNo = data.licenseNo ?? ''; o.issuer = data.issuer ?? '';
      o.issuedAt = data.issuedAt ? new Date(data.issuedAt) : null; o.expireAt = data.expireAt ? new Date(data.expireAt) : null;
      o.status = data.status ?? 'active'; o.ownerId = data.ownerId ?? ''; o.ownerName = data.ownerName ?? '';
      o.correlationId = data.correlationId ?? ''; o.version = data.version ?? 1;
      o.sourceType = data.sourceType ?? 'manual'; o.sourceId = data.sourceId ?? ''; o.isDeleted = data.isDeleted === true;
      o.createdAt = data.createdAt ? new Date(data.createdAt) : null; o.createdBy = data.createdBy ?? '';
      o.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null; o.updatedBy = data.updatedBy ?? '';
    }
    return o;
  }
}
