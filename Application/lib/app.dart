import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/org_labels.dart';
import 'config/theme_config.dart';
import 'providers/auth_provider.dart';
import 'providers/member_provider.dart';
import 'providers/notice_provider.dart';
import 'providers/organization_provider.dart';
import 'providers/project_provider.dart';
import 'providers/role_config_provider.dart';
import 'providers/settings_provider.dart';
import 'providers/sync_provider.dart';
import 'screens/auth/login_page.dart';
import 'screens/settings/setup_wizard_page.dart';
import 'router.dart';
import 'services/api_client.dart';
import 'services/storage_service.dart';
import 'widgets/app_theme.dart';

Future<void> mainApp() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.instance.init();
  await StorageService.instance.init();

  final authProvider = AuthProvider();
  await authProvider.init();

  final settingsProvider = SettingsProvider();
  await settingsProvider.init();

  final roleConfigProvider = RoleConfigProvider();
  await roleConfigProvider.init();

  final syncProvider = SyncProvider.instance;
  await syncProvider.init();

  runApp(SmartSocietyApp(
    authProvider: authProvider,
    settingsProvider: settingsProvider,
    roleConfigProvider: roleConfigProvider,
    syncProvider: syncProvider,
  ));
}

class SmartSocietyApp extends StatelessWidget {
  final AuthProvider authProvider;
  final SettingsProvider settingsProvider;
  final RoleConfigProvider roleConfigProvider;
  final SyncProvider syncProvider;

  const SmartSocietyApp({
    super.key,
    required this.authProvider,
    required this.settingsProvider,
    required this.roleConfigProvider,
    required this.syncProvider,
  });

  ThemeData _buildTheme(ThemeConfig config) {
    final cs = ColorScheme.fromSeed(
      seedColor: config.seedColor,
      brightness: config.brightness,
    );
    return ThemeData(
      colorScheme: cs,
      useMaterial3: true,
      extensions: [AppTheme.fromColorScheme(cs)],
      cardTheme: CardThemeData(
        elevation: 1,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cs.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: cs.primaryContainer,
        surfaceTintColor: Colors.transparent,
      ),
      appBarTheme: AppBarTheme(
        surfaceTintColor: Colors.transparent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 运行时求值，避免在 Provider 创建时捕获尚未初始化的 currentOrgId
    String Function() orgIdGetter() =>
        () => settingsProvider.currentOrgId ?? '';
    // 钉钉管理组织（已配置钉钉）成员只读
    bool Function() isDingTalkManaged() =>
        () => settingsProvider.isDingTalkConfigured(settingsProvider.currentOrgId ?? '');
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: settingsProvider),
        ChangeNotifierProvider.value(value: roleConfigProvider),
        ChangeNotifierProvider.value(value: syncProvider),
        ChangeNotifierProvider(
          create: (_) => OrganizationProvider(auth: authProvider, settings: settingsProvider)
            ..init(userId: authProvider.user?.openId ?? ''),
        ),
        ChangeNotifierProvider(
          create: (_) {
            final p = MemberProvider(orgIdGetter: orgIdGetter(), isDingTalkManaged: isDingTalkManaged());
            SyncProvider.instance.registerRefreshListener(() => p.load());
            p.load();
            return p;
          },
        ),
        ChangeNotifierProvider(
          create: (_) {
            final p = ProjectProvider(orgIdGetter: orgIdGetter());
            SyncProvider.instance.registerRefreshListener(() => p.load());
            p.load();
            return p;
          },
        ),
        ChangeNotifierProvider(
          create: (_) {
            final p = NoticeProvider(orgIdGetter: orgIdGetter());
            SyncProvider.instance.registerRefreshListener(() => p.load());
            p.load();
            return p;
          },
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final settings = context.watch<SettingsProvider>();
          if (!auth.isAuthenticated) {
            return MaterialApp(
              title: '社易管',
              debugShowCheckedModeBanner: false,
              theme: _buildTheme(settings.theme),
              home: const LoginPage(),
            );
          }
          return Consumer<OrganizationProvider>(
            builder: (context, orgProvider, _) {
              if (!orgProvider.hasOrg && !settings.isInitialized) {
                return MaterialApp(
                  title: '社易管',
                  debugShowCheckedModeBanner: false,
                  theme: _buildTheme(settings.theme),
                  home: const SetupWizardPage(),
                );
              }
              if (!orgProvider.hasOrg) {
                return MaterialApp(
                  title: '社易管',
                  debugShowCheckedModeBanner: false,
                  theme: _buildTheme(settings.theme),
                  home: const SetupWizardPage(),
                );
              }
              if (orgProvider.currentOrgId != null &&
                  settings.currentOrgId != orgProvider.currentOrgId) {
                settings.setCurrentOrgId(orgProvider.currentOrgId);
              }
              final labels = OrgLabels.forType(settings.orgType);
              return MaterialApp.router(
                title: labels.appTitle,
                debugShowCheckedModeBanner: false,
                theme: _buildTheme(settings.theme),
                routerConfig: appRouter,
              );
            },
          );
        },
      ),
    );
  }
}
