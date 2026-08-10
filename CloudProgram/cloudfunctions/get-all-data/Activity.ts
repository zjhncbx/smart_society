export class Activity {
  id: string = '';
  title: string = '';
  description: string = '';
  location: string = '';
  startTime: Date = new Date();
  endTime: Date = new Date();
  capacity: number = 0;
  organizer: string = '';
  participants: string = '[]';
  volunteerHours: number | null = null;
  createdAt: Date = new Date();
  orgId: string = '';
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'Activity';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('title', 'String');
    map.set('description', 'String');
    map.set('location', 'String');
    map.set('startTime', 'Date');
    map.set('endTime', 'Date');
    map.set('capacity', 'Integer');
    map.set('organizer', 'String');
    map.set('participants', 'String');
    map.set('volunteerHours', 'Integer');
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

  static parseFrom(data: any): Activity {
    const obj = new Activity();
    if (data) {
      obj.id = data.id ?? '';
      obj.title = data.title ?? '';
      obj.description = data.description ?? '';
      obj.location = data.location ?? '';
      obj.startTime = data.startTime ? new Date(data.startTime) : new Date();
      obj.endTime = data.endTime ? new Date(data.endTime) : new Date();
      obj.capacity = data.capacity ?? 0;
      obj.organizer = data.organizer ?? '';
      obj.participants = data.participants ?? '[]';
      obj.volunteerHours = data.volunteerHours ?? null;
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.orgId = data.orgId ?? '';
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
