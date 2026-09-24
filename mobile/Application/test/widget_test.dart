import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smart_society/config/org_type.dart';
import 'package:smart_society/providers/auth_provider.dart';
import 'package:smart_society/providers/finance_provider.dart';
import 'package:smart_society/providers/notice_provider.dart';
import 'package:smart_society/providers/organization_provider.dart';
import 'package:smart_society/providers/role_config_provider.dart';
import 'package:smart_society/providers/settings_provider.dart';
import 'package:smart_society/screens/home_shell.dart';
import 'package:smart_society/services/storage_service.dart';
import 'package:smart_society/widgets/app_theme.dart';

/// 底部 5 Tab 冒烟测试：与 lib/screens/home_shell.dart 的 Tab 结构、
/// lib/config/org_labels.dart 的实际文案保持一致。
/// 注意：「我的」是路由页（/profile）而非 Tab；tabProjects 三类组织
/// 分别为 项目 / 志愿项目 / 项目，不存在「活动」。
///
/// testWidgets 主体运行在 FakeAsync 区域，Hive 等真实文件 IO 的完成事件
/// 不会被派发（裸 await 会永久挂起），因此所有 Provider 初始化（含 Hive
/// 读写）必须包在 tester.runAsync 中执行。
void main() {
  final tabExpectations = <OrgType, List<String>>{
    OrgType.schoolClub: ['首页', '成员', '项目', '通知', '财务'],
    OrgType.volunteerTeam: ['首页', '志愿者', '志愿项目', '公告', '财务'],
    OrgType.socialOrg: ['首页', '会员', '项目', '公告', '财务'],
  };

  for (final entry in tabExpectations.entries) {
    testWidgets('底部 5 Tab 冒烟（${entry.key.name}）', (tester) async {
      // 构造 Provider（构造函数本身无 IO）
      final authProvider = AuthProvider();
      final settingsProvider = SettingsProvider();
      final roleConfigProvider = RoleConfigProvider();

      // 真实 IO 初始化（Hive）：必须在 runAsync 中执行
      await tester.runAsync(() async {
        await StorageService.instance.init();
        await settingsProvider.init();
        await settingsProvider.completeSetup();
        await settingsProvider.setOrgType(entry.key);
        await roleConfigProvider.init();
      });

      // 不触发云端 init()，仅构造 Provider 供 HomeShell 渲染
      final organizationProvider = OrganizationProvider(
        auth: authProvider,
        settings: settingsProvider,
        roleConfig: roleConfigProvider,
      );
      final noticeProvider = NoticeProvider(orgIdGetter: () => 'org_test');
      final financeProvider = FinanceProvider(
        orgIdGetter: () => 'org_test',
        userIdGetter: () => '',
        userNameGetter: () => '',
      );

      // 与 lib/router.dart 一致的 5 分支 Shell 骨架
      final router = GoRouter(
        initialLocation: '/home',
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) =>
                HomeShell(navigationShell: navigationShell),
            branches: [
              for (final path in [
                '/home',
                '/members',
                '/projects',
                '/notices',
                '/finance',
              ])
                StatefulShellBranch(
                  routes: [
                    GoRoute(
                      path: path,
                      builder: (c, s) =>
                          const Scaffold(body: SizedBox.shrink()),
                    ),
                  ],
                ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: authProvider),
            ChangeNotifierProvider.value(value: settingsProvider),
            ChangeNotifierProvider.value(value: roleConfigProvider),
            ChangeNotifierProvider.value(value: organizationProvider),
            ChangeNotifierProvider.value(value: noticeProvider),
            ChangeNotifierProvider.value(value: financeProvider),
          ],
          child: MaterialApp.router(
            title: '社易管',
            routerConfig: router,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
              useMaterial3: true,
              extensions: [
                AppTheme.fromColorScheme(
                  ColorScheme.fromSeed(seedColor: Colors.blue),
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 5 Tab 文案逐一断言（NavigationBar 中渲染）
      for (final label in entry.value) {
        expect(find.text(label), findsWidgets);
      }
      // 「我的」是路由页而非 Tab，底部导航不应出现
      expect(find.text('我的'), findsNothing);
      // 历史遗留文案「活动」不存在于 Tab
      expect(find.text('活动'), findsNothing);
    });
  }
}
