export class Project {
  id: string = '';
  name: string = '';
  description: string = '';
  managerId: string = '';
  startDate: Date = new Date();
  endDate: Date = new Date();
  status: number = 0;
  progress: number = 0;
  budget: number = 0;
  tasks: string = '[]';
  milestones: string = '[]';
  createdAt: Date = new Date();
  orgId: string = '';
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'Project';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('name', 'String');
    map.set('description', 'String');
    map.set('managerId', 'String');
    map.set('startDate', 'Date');
    map.set('endDate', 'Date');
    map.set('status', 'Integer');
    map.set('progress', 'Integer');
    map.set('budget', 'Double');
    map.set('tasks', 'String');
    map.set('milestones', 'String');
    map.set('createdAt', 'Date');
    map.set('orgId', 'String');
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

  private static toJsonString(value: any): string {
    if (value == null || value === '') return '[]';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return JSON.stringify(value);
    return JSON.stringify(value);
  }

  static parseFrom(data: any): Project {
    const obj = new Project();
    if (data) {
      obj.id = data.id ?? '';
      obj.name = data.name ?? '';
      obj.description = data.description ?? '';
      obj.managerId = data.managerId ?? '';
      obj.startDate = data.startDate ? new Date(data.startDate) : new Date();
      obj.endDate = data.endDate ? new Date(data.endDate) : new Date();
      obj.status = data.status ?? 0;
      obj.progress = data.progress ?? 0;
      obj.budget = Number(data.budget) || 0;
      obj.tasks = Project.toJsonString(data.tasks);
      obj.milestones = Project.toJsonString(data.milestones);
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.orgId = data.orgId ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
