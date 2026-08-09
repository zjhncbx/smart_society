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
  final String tabActivities;
  final String tabNotices;
  final String tabProfile;
  final List<RoleConfig> roles;
  final String deptLabel;
  final List<String> defaultDepts;
  final String labelStudentNo;
  final String labelRole;
  final String labelJoinDate;
  final String labelOrganizer;
  final String labelCapacity;
  final String labelSignUp;
  final String labelSignedUp;
  final String labelFull;
  final String memberMgmtTitle;
  final String memberDetailTitle;
  final String addMemberTitle;
  final String editMemberTitle;
  final String activityMgmtTitle;
  final String createActivityTitle;
  final String activityDetailTitle;
  final String noticeMgmtTitle;
  final String noticeDetailTitle;
  final String publishNoticeTitle;
  final String labelTotalMembers;
  final String labelMySignUps;
  final String labelOngoingActs;
  final String labelUnreadNotices;
  final String emptyMembers;
  final String emptyActivities;
  final String emptyNotices;
  final String emptyParticipants;
  final String searchHint;
  final String addButton;
  final String createButton;
  final String publishButton;
  final String editTooltip;
  final String deleteTooltip;
  final String confirmDelete;
  final String confirmDeleteMsg;
  final String deleteMemberTitle;
  final String deleteActivityTitle;
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
  final String unknownMember;
  final String meLabel;
  final String notFilled;
  final String statusNotStarted;
  final String statusInProgress;
  final String statusEnded;
  final String statusAll;
  final String signUpSuccess;
  final String signUpFail;
  final String cancelSignUp;
  final String saveSuccess;
  final String addSuccess;
  final String publishSuccess;
  final String volunteerHoursLabel;
  final String signUpProgress;
  final String orgTypeLabel;
  final String themeLabel;
  final String aboutDialogTitle;
  final String labelName;
  final String labelPhone;
  final String labelEmail;
  final String labelTitleRequired;
  final String labelStudentNoRequired;
  final String labelDeptRequired;
  final String labelActivityTitle;
  final String labelActivityDesc;
  final String labelActivityLocation;
  final String labelActivityTitleRequired;
  final String labelActivityLocationRequired;
  final String labelCapacityRequired;
  final String labelOrganizerRequired;
  final String labelNoticeTitle;
  final String labelNoticeContent;
  final String labelPublisher;
  final String labelNoticeTitleRequired;
  final String labelNoticeContentRequired;
  final String labelPublisherRequired;
  final String labelImportantNotice;
  final String labelImportantNoticeHint;
  final String labelEmailInvalid;
  final String labelActivityCreated;
  final String labelMemberNotExist;
  final String labelActivityNotExist;
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
  final String labelActivityIntro;
  final String labelDashboard;
  final String labelManageParticipants;
  final String labelAddParticipant;
  final String labelRemoveParticipant;
  final String labelEditRoles;
  final String labelResetRoles;
  final String labelRoleNameHint;
  final String labelDingTalkSync;
  final String labelDingTalkSettings;
  final String labelSyncNow;
  final String labelLastSync;
  final String labelCloudSync;
  final String labelCloudSyncDone;
  final String labelCloudSyncFail;
  final String labelWebAdmin;
  final String labelWebAdminHint;
  final String labelStartTime;
  final String labelEndTime;

  const OrgLabels({
    required this.appTitle,
    required this.tabMembers,
    required this.tabActivities,
    required this.tabNotices,
    required this.tabProfile,
    required this.roles,
    required this.deptLabel,
    required this.defaultDepts,
    required this.labelStudentNo,
    required this.labelRole,
    required this.labelJoinDate,
    required this.labelOrganizer,
    required this.labelCapacity,
    required this.labelSignUp,
    required this.labelSignedUp,
    required this.labelFull,
    required this.memberMgmtTitle,
    required this.memberDetailTitle,
    required this.addMemberTitle,
    required this.editMemberTitle,
    required this.activityMgmtTitle,
    required this.createActivityTitle,
    required this.activityDetailTitle,
    required this.noticeMgmtTitle,
    required this.noticeDetailTitle,
    required this.publishNoticeTitle,
    required this.labelTotalMembers,
    required this.labelMySignUps,
    required this.labelOngoingActs,
    required this.labelUnreadNotices,
    required this.emptyMembers,
    required this.emptyActivities,
    required this.emptyNotices,
    required this.emptyParticipants,
    required this.searchHint,
    required this.addButton,
    required this.createButton,
    required this.publishButton,
    required this.editTooltip,
    required this.deleteTooltip,
    required this.confirmDelete,
    required this.confirmDeleteMsg,
    required this.deleteMemberTitle,
    required this.deleteActivityTitle,
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
    required this.unknownMember,
    required this.meLabel,
    required this.notFilled,
    required this.statusNotStarted,
    required this.statusInProgress,
    required this.statusEnded,
    required this.statusAll,
    required this.signUpSuccess,
    required this.signUpFail,
    required this.cancelSignUp,
    required this.saveSuccess,
    required this.addSuccess,
    required this.publishSuccess,
    required this.volunteerHoursLabel,
    required this.signUpProgress,
    required this.orgTypeLabel,
    required this.themeLabel,
    required this.aboutDialogTitle,
    required this.labelName,
    required this.labelPhone,
    required this.labelEmail,
    required this.labelTitleRequired,
    required this.labelStudentNoRequired,
    required this.labelDeptRequired,
    required this.labelActivityTitle,
    required this.labelActivityDesc,
    required this.labelActivityLocation,
    required this.labelActivityTitleRequired,
    required this.labelActivityLocationRequired,
    required this.labelCapacityRequired,
    required this.labelOrganizerRequired,
    required this.labelNoticeTitle,
    required this.labelNoticeContent,
    required this.labelPublisher,
    required this.labelNoticeTitleRequired,
    required this.labelNoticeContentRequired,
    required this.labelPublisherRequired,
    required this.labelImportantNotice,
    required this.labelImportantNoticeHint,
    required this.labelEmailInvalid,
    required this.labelActivityCreated,
    required this.labelMemberNotExist,
    required this.labelActivityNotExist,
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
    required this.labelActivityIntro,
    required this.labelDashboard,
    required this.labelManageParticipants,
    required this.labelAddParticipant,
    required this.labelRemoveParticipant,
    required this.labelEditRoles,
    required this.labelResetRoles,
    required this.labelRoleNameHint,
    required this.labelDingTalkSync,
    required this.labelDingTalkSettings,
    required this.labelSyncNow,
    required this.labelLastSync,
    required this.labelCloudSync,
    required this.labelCloudSyncDone,
    required this.labelCloudSyncFail,
    required this.labelWebAdmin,
    required this.labelWebAdminHint,
    required this.labelStartTime,
    required this.labelEndTime,
  });

  static const _schoolClub = OrgLabels(
    appTitle: '智联社团',
    tabMembers: '成员',
    tabActivities: '活动',
    tabNotices: '通知',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'president', label: '社长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'director', label: '部长', category: RoleCategory.department),
    ],
    deptLabel: '部门',
    defaultDepts: ['主席团', '宣传部', '组织部', '技术部', '外联部'],
    labelStudentNo: '学号',
    labelRole: '角色',
    labelJoinDate: '加入时间',
    labelOrganizer: '组织者',
    labelCapacity: '名额',
    labelSignUp: '管理参与人',
    labelSignedUp: '已参与',
    labelFull: '名额已满',
    memberMgmtTitle: '成员管理',
    memberDetailTitle: '成员详情',
    addMemberTitle: '添加成员',
    editMemberTitle: '编辑成员',
    activityMgmtTitle: '活动管理',
    createActivityTitle: '创建活动',
    activityDetailTitle: '活动详情',
    noticeMgmtTitle: '通知公告',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '社团成员总数',
    labelMySignUps: '管理活动',
    labelOngoingActs: '进行中活动',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的成员',
    emptyActivities: '暂无活动',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无参与人',
    searchHint: '搜索姓名 / 学号 / 部门',
    addButton: '添加成员',
    createButton: '创建活动',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除成员',
    deleteActivityTitle: '删除活动',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存',
    aboutTitle: '关于智联社团',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的社团管理应用\n开发周期：第1-12周',
    profileTitle: '管理',
    importantLabel: '重要',
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    daysAgo: '天前',
    unknownMember: '未知成员',
    meLabel: '我',
    notFilled: '未填写',
    statusNotStarted: '未开始',
    statusInProgress: '进行中',
    statusEnded: '已结束',
    statusAll: '全部',
    signUpSuccess: '报名成功',
    signUpFail: '报名失败',
    cancelSignUp: '已取消',
    saveSuccess: '已保存',
    addSuccess: '成员已添加',
    publishSuccess: '公告已发布',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '参与情况',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于智联社团',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入学号',
    labelDeptRequired: '请输入部门',
    labelActivityTitle: '活动标题',
    labelActivityDesc: '活动介绍',
    labelActivityLocation: '活动地点',
    labelActivityTitleRequired: '请输入活动标题',
    labelActivityLocationRequired: '请输入活动地点',
    labelCapacityRequired: '请输入有效名额',
    labelOrganizerRequired: '请输入组织者',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelActivityCreated: '活动创建成功',
    labelMemberNotExist: '成员不存在',
    labelActivityNotExist: '活动不存在',
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
    labelActivityIntro: '活动介绍',
    labelDashboard: '管理概览',
    labelManageParticipants: '管理参与人',
    labelAddParticipant: '添加参与人',
    labelRemoveParticipant: '移除参与人',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSync: '钉钉同步',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelCloudSync: '云端数据同步',
    labelCloudSyncDone: '云端同步完成',
    labelCloudSyncFail: '云端同步失败',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelStartTime: '开始时间',
    labelEndTime: '结束时间',
  );

  static const _volunteerTeam = OrgLabels(
    appTitle: '志愿之家',
    tabMembers: '志愿者',
    tabActivities: '志愿项目',
    tabNotices: '公告',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'leader', label: '队长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'director', label: '部长', category: RoleCategory.department),
    ],
    deptLabel: '服务组',
    defaultDepts: ['社区服务组', '环保服务组', '支教服务组', '助老服务组'],
    labelStudentNo: '编号',
    labelRole: '身份',
    labelJoinDate: '注册时间',
    labelOrganizer: '负责人',
    labelCapacity: '人数上限',
    labelSignUp: '管理参与人',
    labelSignedUp: '已参与',
    labelFull: '已满员',
    memberMgmtTitle: '志愿者管理',
    memberDetailTitle: '志愿者详情',
    addMemberTitle: '添加志愿者',
    editMemberTitle: '编辑志愿者',
    activityMgmtTitle: '志愿项目管理',
    createActivityTitle: '发起项目',
    activityDetailTitle: '项目详情',
    noticeMgmtTitle: '公告通知',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '志愿者总数',
    labelMySignUps: '管理项目',
    labelOngoingActs: '进行中项目',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的志愿者',
    emptyActivities: '暂无项目',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无参与人',
    searchHint: '搜索姓名 / 编号 / 服务组',
    addButton: '添加志愿者',
    createButton: '发起项目',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除志愿者',
    deleteActivityTitle: '删除项目',
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
    unknownMember: '未知志愿者',
    meLabel: '我',
    notFilled: '未填写',
    statusNotStarted: '未开始',
    statusInProgress: '进行中',
    statusEnded: '已结束',
    statusAll: '全部',
    signUpSuccess: '加入成功',
    signUpFail: '加入失败',
    cancelSignUp: '已退出',
    saveSuccess: '已保存',
    addSuccess: '志愿者已添加',
    publishSuccess: '公告已发布',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '参与情况',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于志愿之家',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入编号',
    labelDeptRequired: '请输入服务组',
    labelActivityTitle: '项目名称',
    labelActivityDesc: '项目介绍',
    labelActivityLocation: '项目地点',
    labelActivityTitleRequired: '请输入项目名称',
    labelActivityLocationRequired: '请输入项目地点',
    labelCapacityRequired: '请输入有效人数',
    labelOrganizerRequired: '请输入负责人',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelActivityCreated: '项目创建成功',
    labelMemberNotExist: '志愿者不存在',
    labelActivityNotExist: '项目不存在',
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
    labelActivityIntro: '项目介绍',
    labelDashboard: '管理概览',
    labelManageParticipants: '管理参与人',
    labelAddParticipant: '添加参与人',
    labelRemoveParticipant: '移除参与人',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSync: '钉钉同步',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelCloudSync: '云端数据同步',
    labelCloudSyncDone: '云端同步完成',
    labelCloudSyncFail: '云端同步失败',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelStartTime: '开始时间',
    labelEndTime: '结束时间',
  );

  static const _socialOrg = OrgLabels(
    appTitle: '组织通',
    tabMembers: '会员',
    tabActivities: '活动',
    tabNotices: '公告',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'chairman', label: '会长', category: RoleCategory.leadership, maxCount: 1),
      RoleConfig(id: 'vice_chairman', label: '副会长', category: RoleCategory.deputy),
      RoleConfig(id: 'secretary_general', label: '秘书长', category: RoleCategory.department, maxCount: 1),
      RoleConfig(id: 'director', label: '理事', category: RoleCategory.board),
      RoleConfig(id: 'chief_supervisor', label: '监事长', category: RoleCategory.board, maxCount: 1),
      RoleConfig(id: 'supervisor', label: '监事', category: RoleCategory.board),
    ],
    deptLabel: '部门',
    defaultDepts: ['秘书处', '财务部', '会员部', '外联部', '宣传部'],
    labelStudentNo: '会员编号',
    labelRole: '职务',
    labelJoinDate: '入会时间',
    labelOrganizer: '主办方',
    labelCapacity: '名额',
    labelSignUp: '管理参与人',
    labelSignedUp: '已参与',
    labelFull: '名额已满',
    memberMgmtTitle: '会员管理',
    memberDetailTitle: '会员详情',
    addMemberTitle: '添加会员',
    editMemberTitle: '编辑会员',
    activityMgmtTitle: '活动管理',
    createActivityTitle: '创建活动',
    activityDetailTitle: '活动详情',
    noticeMgmtTitle: '公告通知',
    noticeDetailTitle: '公告详情',
    publishNoticeTitle: '发布公告',
    labelTotalMembers: '会员总数',
    labelMySignUps: '管理活动',
    labelOngoingActs: '进行中活动',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的会员',
    emptyActivities: '暂无活动',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无参与人',
    searchHint: '搜索姓名 / 会员编号 / 部门',
    addButton: '添加会员',
    createButton: '创建活动',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定删除',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除会员',
    deleteActivityTitle: '删除活动',
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
    unknownMember: '未知会员',
    meLabel: '我',
    notFilled: '未填写',
    statusNotStarted: '未开始',
    statusInProgress: '进行中',
    statusEnded: '已结束',
    statusAll: '全部',
    signUpSuccess: '报名成功',
    signUpFail: '报名失败',
    cancelSignUp: '已取消',
    saveSuccess: '已保存',
    addSuccess: '会员已添加',
    publishSuccess: '公告已发布',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '参与情况',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于组织通',
    labelName: '姓名',
    labelPhone: '电话',
    labelEmail: '邮箱',
    labelTitleRequired: '请输入姓名',
    labelStudentNoRequired: '请输入会员编号',
    labelDeptRequired: '请输入部门',
    labelActivityTitle: '活动标题',
    labelActivityDesc: '活动介绍',
    labelActivityLocation: '活动地点',
    labelActivityTitleRequired: '请输入活动标题',
    labelActivityLocationRequired: '请输入活动地点',
    labelCapacityRequired: '请输入有效名额',
    labelOrganizerRequired: '请输入主办方',
    labelNoticeTitle: '公告标题',
    labelNoticeContent: '公告内容',
    labelPublisher: '发布人',
    labelNoticeTitleRequired: '请输入公告标题',
    labelNoticeContentRequired: '请输入公告内容',
    labelPublisherRequired: '请输入发布人',
    labelImportantNotice: '标记为重要公告',
    labelImportantNoticeHint: '重要公告将在列表中突出显示',
    labelEmailInvalid: '邮箱格式不正确',
    labelActivityCreated: '活动创建成功',
    labelMemberNotExist: '会员不存在',
    labelActivityNotExist: '活动不存在',
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
    labelActivityIntro: '活动介绍',
    labelDashboard: '管理概览',
    labelManageParticipants: '管理参与人',
    labelAddParticipant: '添加参与人',
    labelRemoveParticipant: '移除参与人',
    labelEditRoles: '编辑角色名称',
    labelResetRoles: '恢复默认',
    labelRoleNameHint: '请输入角色名称',
    labelDingTalkSync: '钉钉同步',
    labelDingTalkSettings: '钉钉同步设置',
    labelSyncNow: '立即同步',
    labelLastSync: '上次同步',
    labelCloudSync: '云端数据同步',
    labelCloudSyncDone: '云端同步完成',
    labelCloudSyncFail: '云端同步失败',
    labelWebAdmin: 'Web管理后台',
    labelWebAdminHint: '访问Web管理后台进行高级管理',
    labelStartTime: '开始时间',
    labelEndTime: '结束时间',
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
