import 'org_type.dart';

class RoleConfig {
  final String id;
  final String label;

  const RoleConfig({required this.id, required this.label});
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
  });

  static const _schoolClub = OrgLabels(
    appTitle: '智联社团',
    tabMembers: '成员',
    tabActivities: '活动',
    tabNotices: '通知',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'president', label: '社长'),
      RoleConfig(id: 'vice_president', label: '副社长'),
      RoleConfig(id: 'director', label: '部长'),
      RoleConfig(id: 'officer', label: '干事'),
      RoleConfig(id: 'member', label: '成员'),
    ],
    deptLabel: '部门',
    defaultDepts: ['主席团', '宣传部', '组织部', '技术部', '外联部'],
    labelStudentNo: '学号',
    labelRole: '角色',
    labelJoinDate: '加入时间',
    labelOrganizer: '组织者',
    labelCapacity: '名额',
    labelSignUp: '立即报名',
    labelSignedUp: '已报名，点击取消',
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
    labelMySignUps: '我的报名',
    labelOngoingActs: '进行中的活动',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的成员',
    emptyActivities: '暂无符合条件的活动',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无成员报名',
    searchHint: '搜索姓名 / 学号 / 部门',
    addButton: '添加成员',
    createButton: '创建活动',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除成员',
    deleteActivityTitle: '删除活动',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存修改',
    aboutTitle: '关于智联社团',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的社团管理应用\n开发周期：第1-12周',
    profileTitle: '我的',
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
    signUpFail: '报名失败，请检查名额',
    cancelSignUp: '已取消报名',
    saveSuccess: '已保存修改',
    addSuccess: '成员添加成功',
    publishSuccess: '公告发布成功',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '报名进度',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于智联社团',
  );

  static const _volunteerTeam = OrgLabels(
    appTitle: '志愿之家',
    tabMembers: '志愿者',
    tabActivities: '志愿项目',
    tabNotices: '公告',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'leader', label: '队长'),
      RoleConfig(id: 'vice_leader', label: '副队长'),
      RoleConfig(id: 'group_leader', label: '组长'),
      RoleConfig(id: 'volunteer', label: '志愿者'),
    ],
    deptLabel: '服务组',
    defaultDepts: ['社区服务组', '环保服务组', '支教服务组', '助老服务组'],
    labelStudentNo: '编号',
    labelRole: '身份',
    labelJoinDate: '注册时间',
    labelOrganizer: '负责人',
    labelCapacity: '人数上限',
    labelSignUp: '立即加入',
    labelSignedUp: '已加入，点击取消',
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
    labelMySignUps: '我的项目',
    labelOngoingActs: '进行中的项目',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的志愿者',
    emptyActivities: '暂无符合条件的项目',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无志愿者加入',
    searchHint: '搜索姓名 / 编号 / 服务组',
    addButton: '添加志愿者',
    createButton: '发起项目',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除志愿者',
    deleteActivityTitle: '删除项目',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存修改',
    aboutTitle: '关于志愿之家',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的志愿服务管理应用\n开发周期：第1-12周',
    profileTitle: '我的',
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
    signUpFail: '加入失败，请检查名额',
    cancelSignUp: '已退出项目',
    saveSuccess: '已保存修改',
    addSuccess: '志愿者添加成功',
    publishSuccess: '公告发布成功',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '参与进度',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于志愿之家',
  );

  static const _socialOrg = OrgLabels(
    appTitle: '组织通',
    tabMembers: '会员',
    tabActivities: '活动',
    tabNotices: '公告',
    tabProfile: '我的',
    roles: [
      RoleConfig(id: 'chairman', label: '会长'),
      RoleConfig(id: 'vice_chairman', label: '副会长'),
      RoleConfig(id: 'secretary_general', label: '秘书长'),
      RoleConfig(id: 'director', label: '理事'),
      RoleConfig(id: 'supervisor', label: '监事'),
      RoleConfig(id: 'member', label: '会员'),
    ],
    deptLabel: '部门',
    defaultDepts: ['秘书处', '财务部', '会员部', '外联部', '宣传部'],
    labelStudentNo: '会员编号',
    labelRole: '职务',
    labelJoinDate: '入会时间',
    labelOrganizer: '主办方',
    labelCapacity: '名额',
    labelSignUp: '立即报名',
    labelSignedUp: '已报名，点击取消',
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
    labelMySignUps: '我的报名',
    labelOngoingActs: '进行中的活动',
    labelUnreadNotices: '未读公告',
    emptyMembers: '没有符合条件的会员',
    emptyActivities: '暂无符合条件的活动',
    emptyNotices: '暂无公告',
    emptyParticipants: '暂无会员报名',
    searchHint: '搜索姓名 / 会员编号 / 部门',
    addButton: '添加会员',
    createButton: '创建活动',
    publishButton: '发布公告',
    editTooltip: '编辑',
    deleteTooltip: '删除',
    confirmDelete: '确定',
    confirmDeleteMsg: '确定删除{type}「{name}」吗？',
    deleteMemberTitle: '删除会员',
    deleteActivityTitle: '删除活动',
    deleteNoticeTitle: '删除公告',
    saveButton: '保存修改',
    aboutTitle: '关于组织通',
    aboutSubtitle: 'v1.0.0 · Flutter + HarmonyOS',
    aboutContent: '基于 Flutter-OH 的组织管理应用\n开发周期：第1-12周',
    profileTitle: '我的',
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
    signUpFail: '报名失败，请检查名额',
    cancelSignUp: '已取消报名',
    saveSuccess: '已保存修改',
    addSuccess: '会员添加成功',
    publishSuccess: '公告发布成功',
    volunteerHoursLabel: '志愿时长',
    signUpProgress: '报名进度',
    orgTypeLabel: '组织类型',
    themeLabel: '主题风格',
    aboutDialogTitle: '关于组织通',
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
