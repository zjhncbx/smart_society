import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/auth/login_page.dart';
import 'screens/home_shell.dart';
import 'screens/home/home_page.dart';
import 'screens/member/member_detail_page.dart';
import 'screens/member/member_form_page.dart';
import 'screens/member/member_list_page.dart';
import 'screens/notice/notice_detail_page.dart';
import 'screens/notice/notice_form_page.dart';
import 'screens/notice/notice_list_page.dart';
import 'screens/org/org_create_page.dart';
import 'screens/finance/approval_flow_designer_page.dart';
import 'screens/finance/approval_inbox_page.dart';
import 'screens/finance/accounting_reports_page.dart';
import 'screens/finance/finance_list_page.dart';
import 'screens/finance/finance_record_detail_page.dart';
import 'screens/finance/finance_record_form_page.dart';
import 'screens/finance/opening_balance_page.dart';
import 'screens/project/project_detail_page.dart';
import 'screens/project/project_form_page.dart';
import 'screens/project/project_list_page.dart';
import 'screens/project/project_board_page.dart';
import 'screens/org/org_selector_page.dart';
import 'screens/profile/profile_page.dart';
import 'screens/profile/org_portrait_page.dart';
import 'screens/settings/settings_page.dart';
import 'screens/settings/setup_wizard_page.dart';
import 'screens/event/event_center_page.dart';
import 'screens/data_quality/data_quality_center_page.dart';
import 'screens/governance/auto_task_center_page.dart';
import 'screens/governance/risk_center_page.dart';
import 'screens/governance/risk_detail_page.dart';
import 'screens/search/global_search_page.dart';
import 'screens/sync/sync_center_page.dart';
import 'screens/todo/todo_center_page.dart';
import 'screens/work_item/work_item_center_page.dart';
import 'services/auth_gate.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

// Tab 分支根路由不再挂 onExit 做返回键拦截：
// go_router 14.x 中 onExit 在 setNewRoutePath 的路由 diff 中也会被调用，
// goBranch 切换 Tab 时旧分支根的 onExit 返回 false 会静默取消整个导航，
// 导致底部 Tab 永远无法切换；而系统返回键在根导航器 bubble 路径上
// 根本不会触发 onExit（两处路径均验证失效）。
// 返回键拦截改由 HomeShell 内的 PopScope 承担（挂在 shell 页 ModalRoute 上）。

/// 详情路由 id 参数缺失/为空时兜底重定向首页。
/// 正常路径匹配（`:id` 存在）不会触发，属防御处理，替代裸 `!` 断言崩溃。
String? _guardIdParam(BuildContext context, GoRouterState state) {
  final id = state.pathParameters['id'];
  if (id == null || id.isEmpty) return '/home';
  return null;
}

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/home',
  // 路由是全局单例，登出后位置可能残留 /login；重新登录时兜底跳回内容页
  redirect: (context, state) {
    final loc = state.uri.path;
    if (!isAuthenticated && loc != '/login') return '/login';
    if (isAuthenticated && loc == '/login') return '/home';
    if (isAuthenticated && consumePendingHomeAfterLogin()) return '/home';
    return null;
  },
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          HomeShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (c, s) => const HomePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/members',
              builder: (c, s) => const MemberListPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/projects',
              builder: (c, s) => const ProjectListPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/notices',
              builder: (c, s) => const NoticeListPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/finance',
              builder: (c, s) => const FinanceListPage(),
            ),
          ],
        ),
      ],
    ),
    // root 级“模块列表”路由：供首页/待办/画像等入口 push 打开，
    // 返回键可以回到来源页面，而不是把 Tab 栈替换掉后直接退出应用。
    GoRoute(
      path: '/members/list',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const MemberListPage(),
    ),
    GoRoute(
      path: '/projects/list',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ProjectListPage(),
    ),
    GoRoute(
      path: '/notices/list',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const NoticeListPage(),
    ),
    GoRoute(
      path: '/finance/list',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const FinanceListPage(),
    ),
    GoRoute(
      path: '/login',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const LoginPage(),
    ),
    GoRoute(
      path: '/orgs/create',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const OrgCreatePage(),
    ),
    GoRoute(
      path: '/orgs/select',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const OrgSelectorPage(),
    ),
    GoRoute(
      path: '/members/new',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const MemberFormPage(),
    ),
    GoRoute(
      path: '/members/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => MemberDetailPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/members/:id/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => MemberFormPage(id: s.pathParameters['id']),
    ),
    GoRoute(
      path: '/projects/new',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ProjectFormPage(),
    ),
    GoRoute(
      path: '/projects/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => ProjectDetailPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/projects/:id/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => ProjectFormPage(id: s.pathParameters['id']),
    ),
    GoRoute(
      path: '/projects/:id/board',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => ProjectBoardPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/notices/new',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const NoticeFormPage(),
    ),
    GoRoute(
      path: '/notices/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => NoticeDetailPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/finance/new',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => FinanceRecordFormPage(
        projectId: s.uri.queryParameters['projectId'],
      ),
    ),
    GoRoute(
      path: '/finance/tasks',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ApprovalInboxPage(),
    ),
    GoRoute(
      path: '/finance/flows',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ApprovalFlowDesignerPage(),
    ),
    GoRoute(
      path: '/finance/flows/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => ApprovalFlowDesignerPage(
        flowId: s.uri.queryParameters['flowId'],
      ),
    ),
    GoRoute(
      path: '/finance/reports',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const AccountingReportsPage(),
    ),
    GoRoute(
      path: '/finance/opening',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const OpeningBalancePage(),
    ),
    GoRoute(
      path: '/finance/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => FinanceRecordDetailPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/settings',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const SettingsPage(),
    ),
    GoRoute(
      path: '/settings/roles',
      parentNavigatorKey: _rootNavigatorKey,
      // 独立可达的角色管理入口：复用 SettingsPage 并定位到角色分区
      builder: (c, s) => const SettingsPage(focusRoles: true),
    ),
    GoRoute(
      path: '/events',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const EventCenterPage(),
    ),
    GoRoute(
      path: '/quality',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const DataQualityCenterPage(),
    ),
    GoRoute(
      path: '/governance/tasks',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const AutoTaskCenterPage(),
    ),
    GoRoute(
      path: '/governance/risks',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const RiskCenterPage(),
    ),
    GoRoute(
      path: '/governance/risks/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: _guardIdParam,
      builder: (c, s) => RiskDetailPage(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/search',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const GlobalSearchPage(),
    ),
    GoRoute(
      path: '/todo',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const TodoCenterPage(),
    ),
    GoRoute(
      path: '/work-items',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const WorkItemCenterPage(),
    ),
    GoRoute(
      path: '/sync',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const SyncCenterPage(),
    ),
    GoRoute(
      path: '/profile',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ProfilePage(),
    ),
    GoRoute(
      path: '/portrait',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const OrgPortraitPage(),
    ),
    GoRoute(
      path: '/setup',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const SetupWizardPage(),
    ),
  ],
);
