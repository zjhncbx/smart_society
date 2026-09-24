export class DataQualitySnapshot {
  id: string = '';
  orgId: string = '';
  score: number = 100;
  dimensions: string = '{}';
  counts: string = '{}';
  ruleCount: number = 0;
  issueCount: number = 0;
  checkedAt: Date | null = null;
  checkedBy: string = '';
  createdAt: Date | null = null;

  getClassName(): string {
    return 'DataQualitySnapshot';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('score', 'Integer');
    map.set('dimensions', 'String');
    map.set('counts', 'String');
    map.set('ruleCount', 'Integer');
    map.set('issueCount', 'Integer');
    map.set('checkedAt', 'Date');
    map.set('checkedBy', 'String');
    map.set('createdAt', 'Date');
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

  static parseFrom(data: any): DataQualitySnapshot {
    const obj = new DataQualitySnapshot();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.score = data.score ?? 100;
      obj.dimensions = data.dimensions ?? '{}';
      obj.counts = data.counts ?? '{}';
      obj.ruleCount = data.ruleCount ?? 0;
      obj.issueCount = data.issueCount ?? 0;
      obj.checkedAt = data.checkedAt ? new Date(data.checkedAt) : null;
      obj.checkedBy = data.checkedBy ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    }
    return obj;
  }
}
