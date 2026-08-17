export class ExternalIdentity {
  identityId: string = '';
  userId: string = '';
  provider: string = '';
  providerSubject: string = '';
  status: string = 'active';
  displayName: string = '';
  version: number = 1;
  sourceType: string = 'manual';
  sourceId: string = '';
  isDeleted: boolean = false;
  createdAt: Date | null = null;
  createdBy: string = '';
  updatedAt: Date | null = null;
  updatedBy: string = '';

  getClassName(): string {
    return 'ExternalIdentity';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('identityId', 'String');
    map.set('userId', 'String');
    map.set('provider', 'String');
    map.set('providerSubject', 'String');
    map.set('status', 'String');
    map.set('displayName', 'String');
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
    return ['identityId'];
  }

  getIndexList(): string[] {
    return ['identityId', 'provider', 'providerSubject'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): ExternalIdentity {
    const obj = new ExternalIdentity();
    if (data) {
      obj.identityId = data.identityId ?? '';
      obj.userId = data.userId ?? '';
      obj.provider = data.provider ?? '';
      obj.providerSubject = data.providerSubject ?? '';
      obj.status = data.status ?? 'active';
      obj.displayName = data.displayName ?? '';
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
