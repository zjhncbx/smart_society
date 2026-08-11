export class OrgSettings {
  orgId: string = '';
  roleLabels: string = '{}';
  dingtalkClientId: string = '';
  dingtalkClientSecret: string = '';
  dingtalkLastSyncAt: number = 0;
  dingtalkLastResult: string = '';

  getClassName(): string {
    return 'OrgSettings';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('orgId', 'String');
    map.set('roleLabels', 'String');
    map.set('dingtalkClientId', 'String');
    map.set('dingtalkClientSecret', 'String');
    map.set('dingtalkLastSyncAt', 'Long');
    map.set('dingtalkLastResult', 'String');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['orgId'];
  }

  getIndexList(): string[] {
    return ['orgId'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): OrgSettings {
    const obj = new OrgSettings();
    if (data) {
      obj.orgId = data.orgId ?? '';
      obj.roleLabels = data.roleLabels ?? '{}';
      obj.dingtalkClientId = data.dingtalkClientId ?? '';
      obj.dingtalkClientSecret = data.dingtalkClientSecret ?? '';
      obj.dingtalkLastSyncAt = data.dingtalkLastSyncAt ?? 0;
      obj.dingtalkLastResult = data.dingtalkLastResult ?? '';
    }
    return obj;
  }
}
