export class OrganizationRelationship {
  relId: string = '';
  orgId: string = '';
  relatedOrgId: string = '';
  relType: string = 'partner';
  shareMembers: boolean = false;
  shareActivities: boolean = false;
  shareNotices: boolean = false;

  getClassName(): string {
    return 'OrganizationRelationship';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('relId', 'String');
    map.set('orgId', 'String');
    map.set('relatedOrgId', 'String');
    map.set('relType', 'String');
    map.set('shareMembers', 'Boolean');
    map.set('shareActivities', 'Boolean');
    map.set('shareNotices', 'Boolean');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['relId'];
  }

  getIndexList(): string[] {
    return ['relId'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): OrganizationRelationship {
    const obj = new OrganizationRelationship();
    if (data) {
      obj.relId = data.relId ?? '';
      obj.orgId = data.orgId ?? '';
      obj.relatedOrgId = data.relatedOrgId ?? '';
      obj.relType = data.relType ?? 'partner';
      obj.shareMembers = data.shareMembers ?? false;
      obj.shareActivities = data.shareActivities ?? false;
      obj.shareNotices = data.shareNotices ?? false;
    }
    return obj;
  }
}
