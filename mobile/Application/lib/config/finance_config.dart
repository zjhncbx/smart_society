import 'org_type.dart';

/// 简化版收支分类
class FinanceCategory {
  const FinanceCategory({required this.id, required this.label});

  final String id;
  final String label;
}

/// 民间非营利组织会计制度科目（社会团体）
class FinanceAccount {
  const FinanceAccount({
    required this.code,
    required this.name,
    required this.category,
  });

  final String code;
  final String name;
  final String category;

  String get label => '$code $name';
}

class FinanceStats {
  const FinanceStats({
    this.income = 0,
    this.expense = 0,
    this.balance = 0,
    this.categories = const [],
    this.projects = const [],
  });

  final double income;
  final double expense;
  final double balance;
  final List<FinanceCategoryStat> categories;
  final List<FinanceProjectStat> projects;

  static const empty = FinanceStats();
}

class FinanceCategoryStat {
  const FinanceCategoryStat({
    required this.key,
    required this.label,
    required this.income,
    required this.expense,
  });

  final String key;
  final String label;
  final double income;
  final double expense;

  factory FinanceCategoryStat.fromJson(Map<String, dynamic> json) =>
      FinanceCategoryStat(
        key: (json['key'] as String?) ?? '',
        label: (json['label'] as String?) ?? '',
        income: (json['income'] as num?)?.toDouble() ?? 0,
        expense: (json['expense'] as num?)?.toDouble() ?? 0,
      );
}

class FinanceProjectStat {
  const FinanceProjectStat({
    required this.projectId,
    required this.income,
    required this.expense,
  });

  final String projectId;
  final double income;
  final double expense;

  factory FinanceProjectStat.fromJson(Map<String, dynamic> json) =>
      FinanceProjectStat(
        projectId: (json['projectId'] as String?) ?? '',
        income: (json['income'] as num?)?.toDouble() ?? 0,
        expense: (json['expense'] as num?)?.toDouble() ?? 0,
      );
}

/// 财务模块文案：社会团体为完整版（会计凭证），另两类为简化版（收支登记）
class FinanceLabels {
  const FinanceLabels({
    required this.title,
    required this.addRecord,
    required this.incomeLabel,
    required this.expenseLabel,
    required this.balanceLabel,
    required this.incomeExpenseNote,
    required this.incomeCategories,
    required this.expenseCategories,
    required this.accounts,
    required this.isFullAccounting,
    required this.formTitle,
    required this.formHint,
    required this.voucherNoLabel,
    required this.entryLabel,
    required this.accountLabel,
    required this.debitLabel,
    required this.creditLabel,
    required this.balanceOk,
    required this.balanceBad,
    required this.addEntry,
    required this.amountLabel,
    required this.dateLabel,
    required this.summaryLabel,
    required this.counterpartyLabel,
    required this.projectLabel,
    required this.noProject,
    required this.statusApproving,
    required this.statusApproved,
    required this.statusRejected,
    required this.approvalFlows,
    required this.newFlow,
    required this.flowName,
    required this.defaultFlow,
    required this.enableFlow,
    required this.addNode,
    required this.nodeApprove,
    required this.nodeHandle,
    required this.nodeCc,
    required this.nodeName,
    required this.assigneeRoles,
    required this.myTasks,
    required this.tasksEmpty,
    required this.approve,
    required this.reject,
    required this.done,
    required this.commentLabel,
    required this.commentHint,
    required this.submittedHint,
    required this.approvalProcess,
    required this.flowNameLabel,
    required this.applicant,
    required this.projectFinance,
    required this.budgetLabel,
    required this.spentLabel,
    required this.linkRecord,
    required this.reportsTitle,
    required this.trialBalance,
    required this.balanceSheet,
    required this.activityStatement,
    required this.cashFlow,
    required this.ledgerTitle,
    required this.openingBalance,
    required this.closePeriod,
    required this.yearLabel,
    required this.accountColumn,
    required this.openDebit,
    required this.openCredit,
    required this.curDebit,
    required this.curCredit,
    required this.endDebit,
    required this.endCredit,
    required this.freeLabel,
    required this.restrictedLabel,
    required this.totalLabel,
    required this.assetsLabel,
    required this.liabilitiesLabel,
    required this.netAssetsLabel,
    required this.operatingLabel,
    required this.investingLabel,
    required this.financingLabel,
    required this.carryFromPrev,
    required this.closedBadge,
    required this.notClosedBadge,
    required this.incomeTotal,
    required this.expenseTotal,
    required this.netChange,
    required this.balanceLabel2,
    required this.balanceTitle,
  });

  final String title;
  final String addRecord;
  final String incomeLabel;
  final String expenseLabel;
  final String balanceLabel;
  final String incomeExpenseNote;
  final List<FinanceCategory> incomeCategories;
  final List<FinanceCategory> expenseCategories;
  final List<FinanceAccount> accounts;
  final bool isFullAccounting;
  final String formTitle;
  final String formHint;
  final String voucherNoLabel;
  final String entryLabel;
  final String accountLabel;
  final String debitLabel;
  final String creditLabel;
  final String balanceOk;
  final String balanceBad;
  final String addEntry;
  final String amountLabel;
  final String dateLabel;
  final String summaryLabel;
  final String counterpartyLabel;
  final String projectLabel;
  final String noProject;
  final String statusApproving;
  final String statusApproved;
  final String statusRejected;
  final String approvalFlows;
  final String newFlow;
  final String flowName;
  final String defaultFlow;
  final String enableFlow;
  final String addNode;
  final String nodeApprove;
  final String nodeHandle;
  final String nodeCc;
  final String nodeName;
  final String assigneeRoles;
  final String myTasks;
  final String tasksEmpty;
  final String approve;
  final String reject;
  final String done;
  final String commentLabel;
  final String commentHint;
  final String submittedHint;
  final String approvalProcess;
  final String flowNameLabel;
  final String applicant;
  final String projectFinance;
  final String budgetLabel;
  final String spentLabel;
  final String linkRecord;
  final String reportsTitle;
  final String trialBalance;
  final String balanceSheet;
  final String activityStatement;
  final String cashFlow;
  final String ledgerTitle;
  final String openingBalance;
  final String closePeriod;
  final String yearLabel;
  final String accountColumn;
  final String openDebit;
  final String openCredit;
  final String curDebit;
  final String curCredit;
  final String endDebit;
  final String endCredit;
  final String freeLabel;
  final String restrictedLabel;
  final String totalLabel;
  final String assetsLabel;
  final String liabilitiesLabel;
  final String netAssetsLabel;
  final String operatingLabel;
  final String investingLabel;
  final String financingLabel;
  final String carryFromPrev;
  final String closedBadge;
  final String notClosedBadge;
  final String incomeTotal;
  final String expenseTotal;
  final String netChange;
  final String balanceLabel2;
  final String balanceTitle;

  static FinanceLabels forType(OrgType type) {
    return switch (type) {
      OrgType.schoolClub => _simplified(
          income: const [
            FinanceCategory(id: 'donation', label: '捐赠收入'),
            FinanceCategory(id: 'activity', label: '活动收入'),
            FinanceCategory(id: 'fee', label: '会费收入'),
            FinanceCategory(id: 'other', label: '其他收入'),
          ],
          expense: const [
            FinanceCategory(id: 'activity', label: '活动支出'),
            FinanceCategory(id: 'promotion', label: '宣传支出'),
            FinanceCategory(id: 'material', label: '物资采购'),
            FinanceCategory(id: 'other', label: '其他支出'),
          ],
        ),
      OrgType.volunteerTeam => _simplified(
          income: const [
            FinanceCategory(id: 'donation', label: '捐赠收入'),
            FinanceCategory(id: 'project', label: '项目经费'),
            FinanceCategory(id: 'other', label: '其他收入'),
          ],
          expense: const [
            FinanceCategory(id: 'activity', label: '活动支出'),
            FinanceCategory(id: 'material', label: '物资采购'),
            FinanceCategory(id: 'travel', label: '交通补贴'),
            FinanceCategory(id: 'other', label: '其他支出'),
          ],
        ),
      OrgType.socialOrg => _fullAccounting(),
    };
  }

  static FinanceLabels _simplified({
    required List<FinanceCategory> income,
    required List<FinanceCategory> expense,
  }) {
    return FinanceLabels(
      title: '财务管理',
      addRecord: '记一笔',
      incomeLabel: '收入',
      expenseLabel: '支出',
      balanceLabel: '结余',
      incomeExpenseNote: '仅统计已生效（审批通过）的单据',
      incomeCategories: income,
      expenseCategories: expense,
      accounts: const [],
      isFullAccounting: false,
      formTitle: '新增收支',
      formHint: '简化收支登记：提交后进入审批流程（如已配置）',
      voucherNoLabel: '单号',
      entryLabel: '分类',
      accountLabel: '会计科目',
      debitLabel: '借方金额',
      creditLabel: '贷方金额',
      balanceOk: '借贷平衡',
      balanceBad: '借贷不平衡，请检查分录',
      addEntry: '添加分录',
      amountLabel: '金额',
      dateLabel: '业务日期',
      summaryLabel: '用途说明',
      counterpartyLabel: '对方单位/经手人',
      projectLabel: '关联项目',
      noProject: '不关联项目',
      statusApproving: '审批中',
      statusApproved: '已通过',
      statusRejected: '已驳回',
      approvalFlows: '审批流程',
      newFlow: '新建流程',
      flowName: '流程名称',
      defaultFlow: '设为默认流程',
      enableFlow: '启用',
      addNode: '添加节点',
      nodeApprove: '审批',
      nodeHandle: '办理',
      nodeCc: '抄送',
      nodeName: '节点名称',
      assigneeRoles: '处理人角色',
      myTasks: '我的待办',
      tasksEmpty: '暂无待办',
      approve: '通过',
      reject: '驳回',
      done: '完成',
      commentLabel: '审批意见',
      commentHint: '填写意见（可选）',
      submittedHint: '已提交审批',
      approvalProcess: '审批进度',
      flowNameLabel: '流程',
      applicant: '申请人',
      projectFinance: '项目财务',
      budgetLabel: '预算',
      spentLabel: '已支出',
      linkRecord: '记一笔',
      reportsTitle: '财务报表',
      trialBalance: '科目余额表',
      balanceSheet: '资产负债表',
      activityStatement: '业务活动表',
      cashFlow: '现金流量表',
      ledgerTitle: '总账/明细账',
      openingBalance: '期初余额',
      closePeriod: '期末结账',
      yearLabel: '年度',
      accountColumn: '科目',
      openDebit: '期初借方',
      openCredit: '期初贷方',
      curDebit: '本期借方',
      curCredit: '本期贷方',
      endDebit: '期末借方',
      endCredit: '期末贷方',
      freeLabel: '非限定性',
      restrictedLabel: '限定性',
      totalLabel: '合计',
      assetsLabel: '资产',
      liabilitiesLabel: '负债',
      netAssetsLabel: '净资产',
      operatingLabel: '经营活动',
      investingLabel: '投资活动',
      financingLabel: '筹资活动',
      carryFromPrev: '从上期结转',
      closedBadge: '已结账',
      notClosedBadge: '未结账',
      incomeTotal: '收入合计',
      expenseTotal: '费用合计',
      netChange: '净资产变动额',
      balanceLabel2: '结余',
      balanceTitle: '资产负债表',
    );
  }

  static FinanceLabels _fullAccounting() {
    return FinanceLabels(
      title: '财务管理',
      addRecord: '记账',
      incomeLabel: '收入',
      expenseLabel: '费用',
      balanceLabel: '结余',
      incomeExpenseNote: '按《民间非营利组织会计制度》记账，收入费用表仅统计已生效凭证',
      incomeCategories: const [],
      expenseCategories: const [],
      accounts: const [
        FinanceAccount(code: '1001', name: '现金', category: '资产'),
        FinanceAccount(code: '1002', name: '银行存款', category: '资产'),
        FinanceAccount(code: '1101', name: '短期投资', category: '资产'),
        FinanceAccount(code: '1201', name: '应收款项', category: '资产'),
        FinanceAccount(code: '1301', name: '存货', category: '资产'),
        FinanceAccount(code: '1401', name: '待摊费用', category: '资产'),
        FinanceAccount(code: '1501', name: '长期股权投资', category: '资产'),
        FinanceAccount(code: '1502', name: '长期债权投资', category: '资产'),
        FinanceAccount(code: '1601', name: '固定资产', category: '资产'),
        FinanceAccount(code: '1602', name: '累计折旧', category: '资产'),
        FinanceAccount(code: '1701', name: '无形资产', category: '资产'),
        FinanceAccount(code: '1801', name: '受托代理资产', category: '资产'),
        FinanceAccount(code: '2101', name: '借入款项', category: '负债'),
        FinanceAccount(code: '2201', name: '应付款项', category: '负债'),
        FinanceAccount(code: '2301', name: '应付工资', category: '负债'),
        FinanceAccount(code: '2302', name: '应交税金', category: '负债'),
        FinanceAccount(code: '2401', name: '预收账款', category: '负债'),
        FinanceAccount(code: '2501', name: '预提费用', category: '负债'),
        FinanceAccount(code: '2601', name: '预计负债', category: '负债'),
        FinanceAccount(code: '2701', name: '长期应付款', category: '负债'),
        FinanceAccount(code: '2801', name: '受托代理负债', category: '负债'),
        FinanceAccount(code: '3101', name: '非限定性净资产', category: '净资产'),
        FinanceAccount(code: '3201', name: '限定性净资产', category: '净资产'),
        FinanceAccount(code: '4101', name: '捐赠收入', category: '收入'),
        FinanceAccount(code: '4102', name: '会费收入', category: '收入'),
        FinanceAccount(code: '4103', name: '提供服务收入', category: '收入'),
        FinanceAccount(code: '4104', name: '政府补助收入', category: '收入'),
        FinanceAccount(code: '4105', name: '投资收益', category: '收入'),
        FinanceAccount(code: '4106', name: '商品销售收入', category: '收入'),
        FinanceAccount(code: '4109', name: '其他收入', category: '收入'),
        FinanceAccount(code: '5101', name: '业务活动成本', category: '费用'),
        FinanceAccount(code: '5201', name: '管理费用', category: '费用'),
        FinanceAccount(code: '5301', name: '筹资费用', category: '费用'),
        FinanceAccount(code: '5401', name: '其他费用', category: '费用'),
      ],
      isFullAccounting: true,
      formTitle: '记账凭证',
      formHint: '按《民间非营利组织会计制度》录入借贷分录，借贷必须平衡',
      voucherNoLabel: '凭证字号',
      entryLabel: '分录',
      accountLabel: '会计科目',
      debitLabel: '借方',
      creditLabel: '贷方',
      balanceOk: '借贷平衡，可以提交',
      balanceBad: '借贷不平衡，请检查分录',
      addEntry: '添加分录',
      amountLabel: '金额',
      dateLabel: '凭证日期',
      summaryLabel: '摘要',
      counterpartyLabel: '对方单位/经手人',
      projectLabel: '关联项目',
      noProject: '不关联项目',
      statusApproving: '审批中',
      statusApproved: '已通过',
      statusRejected: '已驳回',
      approvalFlows: '审批流程',
      newFlow: '新建流程',
      flowName: '流程名称',
      defaultFlow: '设为默认流程',
      enableFlow: '启用',
      addNode: '添加节点',
      nodeApprove: '审批',
      nodeHandle: '办理',
      nodeCc: '抄送',
      nodeName: '节点名称',
      assigneeRoles: '处理人角色',
      myTasks: '我的待办',
      tasksEmpty: '暂无待办',
      approve: '通过',
      reject: '驳回',
      done: '完成',
      commentLabel: '审批意见',
      commentHint: '填写意见（可选）',
      submittedHint: '已提交审批',
      approvalProcess: '审批进度',
      flowNameLabel: '流程',
      applicant: '申请人',
      projectFinance: '项目财务',
      budgetLabel: '预算',
      spentLabel: '已支出',
      linkRecord: '记一笔',
      reportsTitle: '财务报表',
      trialBalance: '科目余额表',
      balanceSheet: '资产负债表',
      activityStatement: '业务活动表',
      cashFlow: '现金流量表',
      ledgerTitle: '总账/明细账',
      openingBalance: '期初余额',
      closePeriod: '期末结账',
      yearLabel: '年度',
      accountColumn: '科目',
      openDebit: '期初借方',
      openCredit: '期初贷方',
      curDebit: '本期借方',
      curCredit: '本期贷方',
      endDebit: '期末借方',
      endCredit: '期末贷方',
      freeLabel: '非限定性',
      restrictedLabel: '限定性',
      totalLabel: '合计',
      assetsLabel: '资产',
      liabilitiesLabel: '负债',
      netAssetsLabel: '净资产',
      operatingLabel: '经营活动',
      investingLabel: '投资活动',
      financingLabel: '筹资活动',
      carryFromPrev: '从上期结转',
      closedBadge: '已结账',
      notClosedBadge: '未结账',
      incomeTotal: '收入合计',
      expenseTotal: '费用合计',
      netChange: '净资产变动额',
      balanceLabel2: '结余',
      balanceTitle: '资产负债表',
    );
  }
}
