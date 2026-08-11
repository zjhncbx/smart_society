import 'org_type.dart';

enum RoleCategory {
  leadership,
  deputy,
  board,
  department,
}

class RoleConfig {
  final String id;
  final String label;
  final RoleCategory category;
  final int maxCount;

  const RoleConfig({
    required this.id,
    required this.label,
    this.category = RoleCategory.department,
    this.maxCount = -1,
  });
}

class OrgLabels {
  final String appTitle;
  final String tabMembers;
  final String tabProjects;
  final String tabNotices;
  final String tabFinance;
  final String tabProfile;
  final List<RoleConfig> roles;
  final String deptLabel;
  final List<String> defaultDepts;
  final String labelStudentNo;
  final String labelRole;
  final String labelChangeRole;
  final String labelJoinDate;
  final String labelManager;
  final String memberMgmtTitle;
  final String memberDetailTitle;
  final String addMemberTitle;
  final String editMemberTitle;
  final String projectMgmtTitle;
  final String createProjectTitle;
  final String projectDetailTitle;
  final String noticeMgmtTitle;
  final String noticeDetailTitle;
  final String publishNoticeTitle;
  final String labelTotalMembers;
  final String labelOngoingProjects;
  final String labelUnreadNotices;
  final String emptyMembers;
  final String emptyProjects;
  final String emptyNotices;
  final String searchHint;
  final String addButton;
  final String createButton;
  final String publishButton;
  final String editTooltip;
  final String deleteTooltip;
  final String confirmDelete;
  final String confirmDeleteMsg;
  final String deleteMemberTitle;
  final String deleteProjectTitle;
  final String deleteNoticeTitle;
  final String saveButton;
  final String aboutTitle;
  final String aboutSubtitle;
  final String aboutContent;
  final String profileTitle;
  final String importantLabel;
  final String todayLabel;
  final String yesterdayLabel;
  final String daysAgo;
  final String notFilled;
  final String statusPreparing;
  final String statusInProgress;
  final String statusPaused;
  final String statusCompleted;
  final String statusAll;
  final String saveSuccess;
  final String addSuccess;
  final String publishSuccess;
  final String orgTypeLabel;
  final String themeLabel;
  final String aboutDialogTitle;
  final String labelName;
  final String labelPhone;
  final String labelEmail;
  final String labelTitleRequired;
  final String labelStudentNoRequired;
  final String labelDeptRequired;
  final String labelProjectName;
  final String labelProjectDesc;
  final String labelProjectNameRequired;
  final String labelManagerRequired;
  final String labelStartDate;
  final String labelEndDate;
  final String labelStartDateRequired;
  final String labelEndDateRequired;
  final String labelNoticeTitle;
  final String labelNoticeContent;
  final String labelPublisher;
  final String labelNoticeTitleRequired;
  final String labelNoticeContentRequired;
  final String labelPublisherRequired;
  final String labelImportantNotice;
  final String labelImportantNoticeHint;
  final String labelEmailInvalid;
  final String labelProjectCreated;
  final String labelMemberNotExist;
  final String labelProjectNotExist;
  final String labelNoticeNotExist;
  final String labelSettingsTitle;
  final String labelSetupWelcome;
  final String labelSetupSelectOrg;
  final String labelSetupSelectTheme;
  final String labelSetupStart;
  final String labelOrgTypeSwitchTitle;
  final String labelOrgTypeSwitchMsg;
  final String labelSwitchCancel;
  final String labelDelete;
  final String labelDashboard;
  final String labelEditRoles;
  final String labelResetRoles;
  final String labelRoleNameHint;
  final String labelDingTalkSettings;
  final String labelSyncNow;
  final String labelLastSync;
  final String labelDingTalkSyncing;
  final String labelDingTalkNeverSynced;
  final String labelDingTalkLastSync;
  final String labelDingTalkManagedHint;
  final String labelWebAdmin;
  final String labelWebAdminHint;
  final String labelTasks;
  final String labelMilestones;
  final String labelProgress;
  final String labelAssignee;
  final String labelPriority;
  final String labelDueDate;
  final String labelAddTask;
  final String labelEditTask;
  final String labelAddMilestone;
  final String labelManageTasks;
  final String labelManageMilestones;
  final String labelTaskTodo;
  final String labelTaskDoing;
  final String labelTaskDone;
  final String labelMilestoneUndone;
  final String labelMilestoneDone;
  final String labelPriorityLow;
  final String labelPriorityMedium;
  final String labelPriorityHigh;
  final String labelStatusTransition;
  final String labelConfirmTransition;
  final String emptyTasks;
  final String emptyMilestones;
  final String deleteTaskTitle;
  final String deleteMilestoneTitle;

  const OrgLabels({
    required this.appTitle,
    required this.tabMembers,
    required this.tabProjects,
    required this.tabNotices,
    required this.tabFinance,
    required this.tabProfile,
    required this.roles,
    required this.deptLabel,
    required this.defaultDepts,
    required this.labelStudentNo,
    required this.labelRole,
    required this.labelChangeRole,
    required this.labelJoinDate,
    required this.labelManager,
    required this.memberMgmtTitle,
    required this.memberDetailTitle,
    required this.addMemberTitle,
    required this.editMemberTitle,
    required this.projectMgmtTitle,
    required this.createProjectTitle,
    required this.projectDetailTitle,
    required this.noticeMgmtTitle,
    required this.noticeDetailTitle,
    required this.publishNoticeTitle,
    required this.labelTotalMembers,
    required this.labelOngoingProjects,
    required this.labelUnreadNotices,
    required this.emptyMembers,
    required this.emptyProjects,
    required this.emptyNotices,
    required this.searchHint,
    required this.addButton,
    required this.createButton,
    required this.publishButton,
    required this.editTooltip,
    required this.deleteTooltip,
    required this.confirmDelete,
    required this.confirmDeleteMsg,
    required this.deleteMemberTitle,
    required this.deleteProjectTitle,
    required this.deleteNoticeTitle,
    required this.saveButton,
    required this.aboutTitle,
    required this.aboutSubtitle,
    required this.aboutContent,
    required this.profileTitle,
    required this.importantLabel,
    required this.todayLabel,
    required this.yesterdayLabel,
    required this.daysAgo,
    required this.notFilled,
    required this.statusPreparing,
    required this.statusInProgress,
    required this.statusPaused,
    required this.statusCompleted,
    required this.statusAll,
    required this.saveSuccess,
    required this.addSuccess,
    required this.publishSuccess,
    required this.orgTypeLabel,
    required this.themeLabel,
    required this.aboutDialogTitle,
    required this.labelName,
    required this.labelPhone,
    required this.labelEmail,
    required this.labelTitleRequired,
    required this.labelStudentNoRequired,
    required this.labelDeptRequired,
    required this.labelProjectName,
    required this.labelProjectDesc,
    required this.labelProjectNameRequired,
    required this.labelManagerRequired,
    required this.labelStartDate,
    required this.labelEndDate,
    required this.labelStartDateRequired,
    required this.labelEndDateRequired,
    required this.labelNoticeTitle,
    required this.labelNoticeContent,
    required this.labelPublisher,
    required this.labelNoticeTitleRequired,
    required this.labelNoticeContentRequired,
    required this.labelPublisherRequired,
    required this.labelImportantNotice,
    required this.labelImportantNoticeHint,
    required this.labelEmailInvalid,
    required this.labelProjectCreated,
    required this.labelMemberNotExist,
    required this.labelProjectNotExist,
    required this.labelNoticeNotExist,
    required this.labelSettingsTitle,
    required this.labelSetupWelcome,
    required this.labelSetupSelectOrg,
    required this.labelSetupSelectTheme,
    required this.labelSetupStart,
    required this.labelOrgTypeSwitchTitle,
    required this.labelOrgTypeSwitchMsg,
    required this.labelSwitchCancel,
    required this.labelDelete,
    required this.labelDashboard,
    required this.labelEditRoles,
    required this.labelResetRoles,
    required this.labelRoleNameHint,
    required this.labelDingTalkSettings,
    required this.labelSyncNow,
    required this.labelLastSync,
    required this.labelDingTalkSyncing,
    required this.labelDingTalkNeverSynced,
    required this.labelDingTalkLastSync,
    required this.labelDingTalkManagedHint,
    required this.labelWebAdmin,
    required this.labelWebAdminHint,
    required this.labelTasks,
    required this.labelMilestones,
    required this.labelProgress,
    required this.labelAssignee,
    required this.labelPriority,
    required this.labelDueDate,
    required this.labelAddTask,
    required this.labelEditTask,
    required this.labelAddMilestone,
    required this.labelManageTasks,
    required this.labelManageMilestones,
    required this.labelTaskTodo,
    required this.labelTaskDoing,
    required this.labelTaskDone,
    required this.labelMilestoneUndone,
    required this.labelMilestoneDone,
    required this.labelPriorityLow,
    required this.labelPriorityMedium,
    required this.labelPriorityHigh,
    required this.labelStatusTransition,
    required this.labelConfirmTransition,
    required this.emptyTasks,
    required this.emptyMilestones,
    required this.deleteTaskTitle,
    required this.deleteMilestoneTitle,
  });

  static const _schoolClub = OrgLabels(
    appTitle: '社易管',
    tabMembers: '成员',
    tabProjects: '项目',
    tabNotices: '通知',
    tabFinance: '财务',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'president', label: '社长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'director', label: '部长', category: RoleCategory.department),
      RoleConfig(id: 'member', label: '社员', category: RoleCategory.department),
    ],
    deptLabel: '部门',
    defaultDepts: ['主席团', '宣传部', '组织部', '技术部', '外联部'],
    labelStudentNo: '学号',
    labelRole: '角色',
    labelChangeRole: '变更角色',
    labelJoinDate: '加入时间',
    labelManager: '负责人',
    memberMgmtTitle: '成员管理',
    memberDetailTitle: '成员详情',
    addMemberTitle: '添加成员',
    editMemberTitle: '编辑成员',
    projectMgmtTitle: '项目管理',
    createProjectTitle: '创建项目',
    projectDetailTitle: '项目详情',
    noticeMgmtTitle: '通知公告',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '社团成员总数',
    labelOngoingProjects: '进行中项目',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的成员',
    emptyProjects: '暂无项目',
    emptyNotices: '暂无公告',
    searchHint: '搜索姓名 / 学号 / 部门',
    addButton: '添加成员',
    createButton: '创建项目',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除成员',
    deleteProjectTitle: '删除项目',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存',
    aboutTitle: '关于社易管',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的多组织管理应用\n开发周期：第1-12周',
    profileTitle: '管理',
    importantLabel: '重要',
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    daysAgo: '天前',
    notFilled: '未填写',
    statusPreparing: '筹备中',
    statusInProgress: '进行中',
    statusPaused: '已暂停',
    statusCompleted: '已完成',
    statusAll: '全部',
    saveSuccess: '已保存',
    addSuccess: '成员已添加',
    publishSuccess: '公告已发布',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于社易管',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入学号',
    labelDeptRequired: '请输入部门',
    labelProjectName: '项目名称',
    labelProjectDesc: '项目介绍',
    labelProjectNameRequired: '请输入项目名称',
    labelManagerRequired: '请选择项目负责人',
    labelStartDate: '开始日期',
    labelEndDate: '结束日期',
    labelStartDateRequired: '请选择开始日期',
    labelEndDateRequired: '请选择结束日期',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelProjectCreated: '项目创建成功',
    labelMemberNotExist: '成员不存在',
    labelProjectNotExist: '项目不存在',
    labelNoticeNotExist: '公告不存在',
    labelSettingsTitle: '设置',
    labelSetupWelcome: '欢迎使用',
    labelSetupSelectOrg: '选择组织类型',
    labelSetupSelectTheme: '选择主题风格',
    labelSetupStart: '开始使用',
    labelOrgTypeSwitchTitle: '切换组织类型',
    labelOrgTypeSwitchMsg: '切换组织类型将重置角色和部门标签，确定继续？',
    labelSwitchCancel: '取消',
    labelDelete: '删除',
    labelDashboard: '管理概览',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelDingTalkSyncing: '正在同步通讯录…',
    labelDingTalkNeverSynced: '从未同步',
    labelDingTalkLastSync: '上次同步',
    labelDingTalkManagedHint: '该组织已启用钉钉同步，成员由钉钉通讯录管理，不可手动增删改',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelTasks: '任务',
    labelMilestones: '里程碑',
    labelProgress: '项目进度',
    labelAssignee: '任务负责人',
    labelPriority: '优先级',
    labelDueDate: '截止日期',
    labelAddTask: '添加任务',
    labelEditTask: '编辑任务',
    labelAddMilestone: '添加里程碑',
    labelManageTasks: '管理任务',
    labelManageMilestones: '管理里程碑',
    labelTaskTodo: '待办',
    labelTaskDoing: '进行中',
    labelTaskDone: '已完成',
    labelMilestoneUndone: '未完成',
    labelMilestoneDone: '已完成',
    labelPriorityLow: '低',
    labelPriorityMedium: '中',
    labelPriorityHigh: '高',
    labelStatusTransition: '状态流转',
    labelConfirmTransition: '确定将项目状态流转为「{status}」？',
    emptyTasks: '暂无任务',
    emptyMilestones: '暂无里程碑',
    deleteTaskTitle: '删除任务',
    deleteMilestoneTitle: '删除里程碑',
  );

  static const _volunteerTeam = OrgLabels(
    appTitle: '志愿之家',
    tabMembers: '志愿者',
    tabProjects: '志愿项目',
    tabNotices: '公告',
    tabFinance: '财务',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'leader', label: '队长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'director', label: '部长', category: RoleCategory.department),
      RoleConfig(id: 'member', label: '队员', category: RoleCategory.department),
    ],
    deptLabel: '服务组',
    defaultDepts: ['社区服务组', '环保服务组', '支教服务组', '助老服务组'],
    labelStudentNo: '编号',
    labelRole: '身份',
    labelChangeRole: '变更身份',
    labelJoinDate: '注册时间',
    labelManager: '项目负责人',
    memberMgmtTitle: '志愿者管理',
    memberDetailTitle: '志愿者详情',
    addMemberTitle: '添加志愿者',
    editMemberTitle: '编辑志愿者',
    projectMgmtTitle: '志愿项目管理',
    createProjectTitle: '发起项目',
    projectDetailTitle: '项目详情',
    noticeMgmtTitle: '公告通知',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '志愿者总数',
    labelOngoingProjects: '进行中项目',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的志愿者',
    emptyProjects: '暂无项目',
    emptyNotices: '暂无公告',
    searchHint: '搜索姓名 / 编号 / 服务组',
    addButton: '添加志愿者',
    createButton: '发起项目',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除志愿者',
    deleteProjectTitle: '删除项目',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存',
    aboutTitle: '关于志愿之家',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的志愿服务管理应用\n开发周期：第1-12周',
    profileTitle: '管理',
    importantLabel: '重要',
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    daysAgo: '天前',
    notFilled: '未填写',
    statusPreparing: '筹备中',
    statusInProgress: '进行中',
    statusPaused: '已暂停',
    statusCompleted: '已完成',
    statusAll: '全部',
    saveSuccess: '已保存',
    addSuccess: '志愿者已添加',
    publishSuccess: '公告已发布',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于志愿之家',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入编号',
    labelDeptRequired: '请输入服务组',
    labelProjectName: '项目名称',
    labelProjectDesc: '项目介绍',
    labelProjectNameRequired: '请输入项目名称',
    labelManagerRequired: '请选择项目负责人',
    labelStartDate: '开始日期',
    labelEndDate: '结束日期',
    labelStartDateRequired: '请选择开始日期',
    labelEndDateRequired: '请选择结束日期',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelProjectCreated: '项目创建成功',
    labelMemberNotExist: '志愿者不存在',
    labelProjectNotExist: '项目不存在',
    labelNoticeNotExist: '公告不存在',
    labelSettingsTitle: '设置',
    labelSetupWelcome: '欢迎使用',
    labelSetupSelectOrg: '选择组织类型',
    labelSetupSelectTheme: '选择主题风格',
    labelSetupStart: '开始使用',
    labelOrgTypeSwitchTitle: '切换组织类型',
    labelOrgTypeSwitchMsg: '切换组织类型将重置角色和部门标签，确定继续？',
    labelSwitchCancel: '取消',
    labelDelete: '删除',
    labelDashboard: '管理概览',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelDingTalkSyncing: '正在同步通讯录…',
    labelDingTalkNeverSynced: '从未同步',
    labelDingTalkLastSync: '上次同步',
    labelDingTalkManagedHint: '该组织已启用钉钉同步，成员由钉钉通讯录管理，不可手动增删改',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelTasks: '任务',
    labelMilestones: '里程碑',
    labelProgress: '项目进度',
    labelAssignee: '任务负责人',
    labelPriority: '优先级',
    labelDueDate: '截止日期',
    labelAddTask: '添加任务',
    labelEditTask: '编辑任务',
    labelAddMilestone: '添加里程碑',
    labelManageTasks: '管理任务',
    labelManageMilestones: '管理里程碑',
    labelTaskTodo: '待办',
    labelTaskDoing: '进行中',
    labelTaskDone: '已完成',
    labelMilestoneUndone: '未完成',
    labelMilestoneDone: '已完成',
    labelPriorityLow: '低',
    labelPriorityMedium: '中',
    labelPriorityHigh: '高',
    labelStatusTransition: '状态流转',
    labelConfirmTransition: '确定将项目状态流转为「{status}」？',
    emptyTasks: '暂无任务',
    emptyMilestones: '暂无里程碑',
    deleteTaskTitle: '删除任务',
    deleteMilestoneTitle: '删除里程碑',
  );

  static const _socialOrg = OrgLabels(
    appTitle: '组织通',
    tabMembers: '会员',
    tabProjects: '项目',
    tabNotices: '公告',
    tabFinance: '财务',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'chairman', label: '会长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'vice_chairman', label: '副会长', category: RoleCategory.deputy),
      RoleConfig(id: 'secretary_general', label: '秘书长', category: RoleCategory.department, maxCount: 1),
      RoleConfig(id: 'director', label: '理事', category: RoleCategory.board),
      RoleConfig(id: 'chief_supervisor', label: '监事长', category: RoleCategory.board, maxCount: 1),
      RoleConfig(id: 'supervisor', label: '监事', category: RoleCategory.board),
      RoleConfig(id: 'member', label: '会员', category: RoleCategory.department),
    ],
    deptLabel: '部门',
    defaultDepts: ['秘书处', '财务部', '会员部', '外联部', '宣传部'],
    labelStudentNo: '会员编号',
    labelRole: '职务',
    labelChangeRole: '变更职务',
    labelJoinDate: '入会时间',
    labelManager: '负责人',
    memberMgmtTitle: '会员管理',
    memberDetailTitle: '会员详情',
    addMemberTitle: '添加会员',
    editMemberTitle: '编辑会员',
    projectMgmtTitle: '项目管理',
    createProjectTitle: '创建项目',
    projectDetailTitle: '项目详情',
    noticeMgmtTitle: '公告通知',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '会员总数',
    labelOngoingProjects: '进行中项目',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的会员',
    emptyProjects: '暂无项目',
    emptyNotices: '暂无公告',
    searchHint: '搜索姓名 / 会员编号 / 部门',
    addButton: '添加会员',
    createButton: '创建项目',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除会员',
    deleteProjectTitle: '删除项目',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存',
    aboutTitle: '关于组织通',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的组织管理应用\n开发周期：第1-12周',
    profileTitle: '管理',
    importantLabel: '重要',
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    daysAgo: '天前',
    notFilled: '未填写',
    statusPreparing: '筹备中',
    statusInProgress: '进行中',
    statusPaused: '已暂停',
    statusCompleted: '已完成',
    statusAll: '全部',
    saveSuccess: '已保存',
    addSuccess: '会员已添加',
    publishSuccess: '公告已发布',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于组织通',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入会员编号',
    labelDeptRequired: '请输入部门',
    labelProjectName: '项目名称',
    labelProjectDesc: '项目介绍',
    labelProjectNameRequired: '请输入项目名称',
    labelManagerRequired: '请选择项目负责人',
    labelStartDate: '开始日期',
    labelEndDate: '结束日期',
    labelStartDateRequired: '请选择开始日期',
    labelEndDateRequired: '请选择结束日期',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelProjectCreated: '项目创建成功',
    labelMemberNotExist: '会员不存在',
    labelProjectNotExist: '项目不存在',
    labelNoticeNotExist: '公告不存在',
    labelSettingsTitle: '设置',
    labelSetupWelcome: '欢迎使用',
    labelSetupSelectOrg: '选择组织类型',
    labelSetupSelectTheme: '选择主题风格',
    labelSetupStart: '开始使用',
    labelOrgTypeSwitchTitle: '切换组织类型',
    labelOrgTypeSwitchMsg: '切换组织类型将重置角色和部门标签，确定继续？',
    labelSwitchCancel: '取消',
    labelDelete: '删除',
    labelDashboard: '管理概览',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelDingTalkSyncing: '正在同步通讯录…',
    labelDingTalkNeverSynced: '从未同步',
    labelDingTalkLastSync: '上次同步',
    labelDingTalkManagedHint: '该组织已启用钉钉同步，成员由钉钉通讯录管理，不可手动增删改',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelTasks: '任务',
    labelMilestones: '里程碑',
    labelProgress: '项目进度',
    labelAssignee: '任务负责人',
    labelPriority: '优先级',
    labelDueDate: '截止日期',
    labelAddTask: '添加任务',
    labelEditTask: '编辑任务',
    labelAddMilestone: '添加里程碑',
    labelManageTasks: '管理任务',
    labelManageMilestones: '管理里程碑',
    labelTaskTodo: '待办',
    labelTaskDoing: '进行中',
    labelTaskDone: '已完成',
    labelMilestoneUndone: '未完成',
    labelMilestoneDone: '已完成',
    labelPriorityLow: '低',
    labelPriorityMedium: '中',
    labelPriorityHigh: '高',
    labelStatusTransition: '状态流转',
    labelConfirmTransition: '确定将项目状态流转为「{status}」？',
    emptyTasks: '暂无任务',
    emptyMilestones: '暂无里程碑',
    deleteTaskTitle: '删除任务',
    deleteMilestoneTitle: '删除里程碑',
  );

  static OrgLabels forType(OrgType type) {
    return switch (type) {
      OrgType.schoolClub => _schoolClub,
      OrgType.volunteerTeam => _volunteerTeam,
      OrgType.socialOrg => _socialOrg,
    };
  }

  String roleLabel(String roleId) {
    for (final r in roles) {
      if (r.id == roleId) return r.label;
    }
    return roleId;
  }
}
