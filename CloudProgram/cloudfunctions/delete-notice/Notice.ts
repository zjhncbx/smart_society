export class Notice {
  id: string = '';
  title: string = '';
  content: string = '';
  publisher: string = '';
  publishTime: Date = new Date();
  isRead: boolean = false;
  isImportant: boolean = false;

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
    }
    return obj;
  }
}
