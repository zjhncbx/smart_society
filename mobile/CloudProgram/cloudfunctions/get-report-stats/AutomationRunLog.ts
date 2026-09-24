export class AutomationRunLog {
  id: string = '';
  orgId: string = '';
  ruleId: string = '';
  ruleName: string = '';
  triggerEventType: string = '';
  status: string = 'success';
  actions: string = '[]';
  runBy: string = 'system';
  runAt: Date | null = null;
  durationMs: number = 0;
  errorMessage: string = '';
  metadata: string = '{}';

  getClassName(): string {
    return 'AutomationRunLog';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('ruleId', 'String');
    map.set('ruleName', 'String');
    map.set('triggerEventType', 'String');
    map.set('status', 'String');
    map.set('actions', 'String');
    map.set('runBy', 'String');
    map.set('runAt', 'Date');
    map.set('durationMs', 'Integer');
    map.set('errorMessage', 'String');
    map.set('metadata', 'String');
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

  static parseFrom(data: any): AutomationRunLog {
    const obj = new AutomationRunLog();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.ruleId = data.ruleId ?? '';
      obj.ruleName = data.ruleName ?? '';
      obj.triggerEventType = data.triggerEventType ?? '';
      obj.status = data.status ?? 'success';
      obj.actions = data.actions ?? '[]';
      obj.runBy = data.runBy ?? 'system';
      obj.runAt = data.runAt ? new Date(data.runAt) : null;
      obj.durationMs = data.durationMs ?? 0;
      obj.errorMessage = data.errorMessage ?? '';
      obj.metadata = data.metadata ?? '{}';
    }
    return obj;
  }
}
