import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/activity/activity_detail_page.dart';
import 'screens/activity/activity_form_page.dart';
import 'screens/activity/activity_list_page.dart';
import 'screens/auth/login_page.dart';
import 'screens/home_shell.dart';
import 'screens/member/member_detail_page.dart';
import 'screens/member/member_form_page.dart';
import 'screens/member/member_list_page.dart';
import 'screens/notice/notice_detail_page.dart';
import 'screens/notice/notice_form_page.dart';
import 'screens/notice/notice_list_page.dart';
import 'screens/org/org_create_page.dart';
import 'screens/org/org_selector_page.dart';
import 'screens/profile/profile_page.dart';
import 'screens/settings/settings_page.dart';
import 'screens/settings/setup_wizard_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/members',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          HomeShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/members', builder: (c, s) => const MemberListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/activities', builder: (c, s) => const ActivityListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/notices', builder: (c, s) => const NoticeListPage()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/profile', builder: (c, s) => const ProfilePage()),
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
      path: '/activities/new',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const ActivityFormPage(),
    ),
    GoRoute(
      path: '/activities/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => ActivityDetailPage(id: s.pathParameters['id']!),
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
      path: '/setup',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (c, s) => const SetupWizardPage(),
    ),
  ],
);
