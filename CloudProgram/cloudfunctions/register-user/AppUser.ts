export class AppUser {
  id: string = '';
  phone: string = '';
  email: string = '';
  passwordHash: string = '';
  passwordSalt: string = '';
  displayName: string = '';
  createdAt: Date = new Date();
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'AppUser';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('phone', 'String');
    map.set('email', 'String');
    map.set('passwordHash', 'String');
    map.set('passwordSalt', 'String');
    map.set('displayName', 'String');
    map.set('createdAt', 'Date');
    map.set('updatedAt', 'Date');
    return map;
  }

  getPrimaryKeyList(): string[] {
    return ['id'];
  }

  getIndexList(): string[] {
    return ['id', 'phone', 'email'];
  }

  getEncryptedFieldList(): string[] {
    return [];
  }

  static parseFrom(data: any): AppUser {
    const obj = new AppUser();
    if (data) {
      obj.id = data.id ?? '';
      obj.phone = data.phone ?? '';
      obj.email = data.email ?? '';
      obj.passwordHash = data.passwordHash ?? '';
      obj.passwordSalt = data.passwordSalt ?? '';
      obj.displayName = data.displayName ?? '';
      obj.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
