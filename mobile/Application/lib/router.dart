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
import 'screens/settings/settings_page.dart';
import 'screens/settings/setup_wizard_page.dart';
import 'screens/event/event_center_page.dart';
import 'services/auth_gate.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/home',
  // 路由是全局单例，登出后位置可能残留 /login；重新登录时兜底跳回内容页
  redirect: (context, state) {
    final loc = state.uri.path;
    if (!isAuthenticated && loc != '/login') return '/login';
    if (isAuthenticated && loc == '/login') return '/members';
    return null;
  },
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          HomeShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/home', builder: (c, s) => const HomePage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/members', builder: (c, s) => const MemberListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/projects', builder: (c, s) => const ProjectListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/notices', builder: (c, s) => const NoticeListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/finance', builder: (c, s) => const FinanceListPage()),
          ],
        ),
      ],
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
      builder: (c, s) => const SettingsPage(),
    ),
    GoRoute(
      path: '/events',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const EventCenterPage(),
    ),
    GoRoute(
      path: '/profile',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ProfilePage(),
    ),
    GoRoute(
      path: '/setup',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const SetupWizardPage(),
    ),
  ],
);
