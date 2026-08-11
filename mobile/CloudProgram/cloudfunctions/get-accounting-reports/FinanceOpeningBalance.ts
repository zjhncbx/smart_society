export class FinanceOpeningBalance {
  id: string = '';
  orgId: string = '';
  year: string = '';
  accountCode: string = '';
  accountName: string = '';
  debit: number = 0;
  credit: number = 0;
  updatedAt: Date | null = null;

  getClassName(): string {
    return 'FinanceOpeningBalance';
  }

  getFieldTypeMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('id', 'String');
    map.set('orgId', 'String');
    map.set('year', 'String');
    map.set('accountCode', 'String');
    map.set('accountName', 'String');
    map.set('debit', 'Double');
    map.set('credit', 'Double');
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

  static parseFrom(data: any): FinanceOpeningBalance {
    const obj = new FinanceOpeningBalance();
    if (data) {
      obj.id = data.id ?? '';
      obj.orgId = data.orgId ?? '';
      obj.year = data.year ?? '';
      obj.accountCode = data.accountCode ?? '';
      obj.accountName = data.accountName ?? '';
      obj.debit = Number(data.debit) || 0;
      obj.credit = Number(data.credit) || 0;
      obj.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    }
    return obj;
  }
}
