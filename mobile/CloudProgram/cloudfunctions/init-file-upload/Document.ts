export class Document {
  id: string = ''; orgId: string = ''; code: string = ''; name: string = '';
  fileName: string = ''; contentType: string = ''; size: number = 0;
  domain: string = 'attachment'; refType: string = ''; refId: string = '';
  storagePath: string = ''; uploadPath: string = ''; checksum: string = '';
  status: string = 'uploading'; downloadCount: number = 0; ownerId: string = '';
  ownerName: string = ''; correlationId: string = ''; version: number = 1;
  sourceType: string = 'manual'; sourceId: string = ''; isDeleted: boolean = false;
  createdAt: Date | null = null; createdBy: string = '';
  updatedAt: Date | null = null; updatedBy: string = '';
  getClassName(): string { return 'Document'; }
  getFieldTypeMap(): Map<string, string> {
    const m = new Map<string, string>();
    m.set('id', 'String'); m.set('orgId', 'String'); m.set('code', 'String'); m.set('name', 'String');
    m.set('fileName', 'String'); m.set('contentType', 'String'); m.set('size', 'Integer'); m.set('domain', 'String');
    m.set('refType', 'String'); m.set('refId', 'String'); m.set('storagePath', 'String'); m.set('uploadPath', 'String');
    m.set('checksum', 'String'); m.set('status', 'String'); m.set('downloadCount', 'Integer'); m.set('ownerId', 'String');
    m.set('ownerName', 'String'); m.set('correlationId', 'String'); m.set('version', 'Integer'); m.set('sourceType', 'String');
    m.set('sourceId', 'String'); m.set('isDeleted', 'Boolean'); m.set('createdAt', 'Date'); m.set('createdBy', 'String');
    m.set('updatedAt', 'Date'); m.set('updatedBy', 'String');
    return m;
  }
  getPrimaryKeyList(): string[] { return ['id']; }
  getIndexList(): string[] { return ['id']; }
  getEncryptedFieldList(): string[] { return []; }
  static parseFrom(data: any): Document {
    const o = new Document();
    if (data) {
      o.id = data.id ?? ''; o.orgId = data.orgId ?? ''; o.code = data.code ?? ''; o.name = data.name ?? '';
      o.fileName = data.fileName ?? ''; o.contentType = data.contentType ?? ''; o.size = data.size ?? 0;
      o.domain = data.domain ?? 'attachment'; o.refType = data.refType ?? ''; o.refId = data.refId ?? '';
      o.storagePath = data.storagePath ?? ''; o.uploadPath = data.uploadPath ?? ''; o.checksum = data.checksum ?? '';
      o.status = data.status ?? 'uploading'; o.downloadCount = data.downloadCount ?? 0;
      o.ownerId = data.ownerId ?? ''; o.ownerName = data.ownerName ?? ''; o.correlationId = data.correlationId ?? '';
      o.version = data.version ?? 1; o.sourceType = data.sourceType ?? 'manual'; o.sourceId = data.sourceId ?? '';
      o.isDeleted = data.isDeleted === true;
      o.createdAt = data.createdAt ? new Date(data.createdAt) : null; o.createdBy = data.createdBy ?? '';
      o.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null; o.updatedBy = data.updatedBy ?? '';
    }
    return o;
  }
}
