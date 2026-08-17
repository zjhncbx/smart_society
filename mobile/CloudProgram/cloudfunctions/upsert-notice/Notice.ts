export class Notice {
  id: string = '';
  title: string = '';
  content: string = '';
  publisher: string = '';
  publishTime: Date = new Date();
  isRead: boolean = false;
  isImportant: boolean = false;
  orgId: string = '';
  code: string = '';
  status: string = 'active';
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedBy: string = '';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'Notice';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('title', 'String');
    map.set('content', 'String');
    map.set('publisher', 'String');
    map.set('publishTime', 'Date');
    map.set('isRead', 'Boolean');
    map.set('isImportant', 'Boolean');
    map.set('orgId', 'String');
    map.set('code', 'String');
    map.set('status', 'String');
    map.set('createdAt', 'Date');
    map.set('createdBy', 'String');
    map.set('updatedBy', 'String');
    map.set('version', 'Integer');
    map.set('sourceType', 'String');
    map.set('sourceId', 'String');
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

  static parseFrom(data: any): Notice {
    const obj = new Notice();
    if (data) {
      obj.id = data.id ?? '';
      obj.title = data.title ?? '';
      obj.content = data.content ?? '';
      obj.publisher = data.publisher ?? '';
      obj.publishTime = data.publishTime ? new Date(data.publishTime) : new Date();
      obj.isRead = data.isRead ?? false;
      obj.isImportant = data.isImportant ?? false;
      obj.orgId = data.orgId ?? '';
      obj.code = data.code ?? '';
      obj.status = data.status ?? 'active';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
      obj.createdBy = data.createdBy ?? '';
      obj.updatedBy = data.updatedBy ?? '';
      obj.version = data.version ?? 1;
      obj.sourceType = data.sourceType ?? 'manual';
      obj.sourceId = data.sourceId ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
