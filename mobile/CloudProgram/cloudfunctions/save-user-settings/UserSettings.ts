export class UserSettings {
  userId: string = '';
  nickname: string = '';
  darkMode: boolean = false;

  getClassName(): string {
    return 'UserSettings';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('userId', 'String');
    map.set('nickname', 'String');
    map.set('darkMode', 'Boolean');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['userId'];
  }

  getIndexList(): string[] {
    return ['userId'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): UserSettings {
    const obj = new UserSettings();
    if (data) {
      obj.userId = data.userId ?? '';
      obj.nickname = data.nickname ?? '';
      obj.darkMode = data.darkMode ?? false;
    }
    return obj;
  }
}
