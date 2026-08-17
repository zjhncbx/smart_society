import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/org_labels.dart';
import 'config/theme_config.dart';
import 'providers/auth_provider.dart';
import 'providers/data_quality_provider.dart';
import 'providers/event_provider.dart';
import 'providers/finance_provider.dart';
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

  final roleConfigProvider = RoleConfigProvider()
    ..userId = authProvider.user?.openId;
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
    final appTheme = AppTheme.fromColorScheme(cs);
    final dark = config.brightness == Brightness.dark;
    final scaffoldBg = appTheme.scaffoldBackground;
    final cardColor = appTheme.cardColor;
    final borderColor = appTheme.cardBorderColor;
    final inputFill = dark
        ? const Color(0xFF232326)
        : const Color(0xFFF2F3F5);
    final navLabelStyle = WidgetStateProperty.resolveWith<TextStyle?>((states) {
      final selected = states.contains(WidgetState.selected);
      return TextStyle(
        fontSize: 11,
        fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
        color: selected ? cs.primary : appTheme.textSecondary,
      );
    });
    final navIconStyle = WidgetStateProperty.resolveWith<IconThemeData?>(
      (states) => IconThemeData(
        color: states.contains(WidgetState.selected)
            ? cs.primary
            : appTheme.textSecondary,
      ),
    );
    return ThemeData(
      colorScheme: cs,
      useMaterial3: true,
      extensions: [appTheme],
      scaffoldBackgroundColor: scaffoldBg,
      cardTheme: CardThemeData(
        elevation: 0,
        color: cardColor,
        shadowColor: Colors.black.withValues(alpha: dark ? 0.25 : 0.04),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(appTheme.cardRadius),
          side: BorderSide(color: borderColor),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputFill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(appTheme.controlRadius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(appTheme.controlRadius),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(appTheme.controlRadius),
          borderSide: BorderSide(color: cs.primary, width: 1.4),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: dark ? const Color(0xFF161618) : Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 64,
        indicatorColor: cs.primary.withValues(alpha: 0.12),
        labelTextStyle: navLabelStyle,
        iconTheme: navIconStyle,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: scaffoldBg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: cs.onSurface,
        ),
        iconTheme: IconThemeData(color: cs.onSurface),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(appTheme.controlRadius),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(appTheme.controlRadius),
          ),
          side: BorderSide(color: cs.outlineVariant),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: cs.outlineVariant),
        ),
        backgroundColor: dark ? cs.surfaceContainerHigh : const Color(0xFFF2F3F5),
        labelStyle: TextStyle(fontSize: 13, color: cs.onSurface),
        secondaryLabelStyle: TextStyle(fontSize: 13, color: cs.onSurface),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: cardColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: dark ? cs.inverseSurface : const Color(0xFF333333),
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: appTheme.dividerColor,
        thickness: 1,
        space: 1,
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 0,
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: cs.primary),
      textTheme: ThemeData.light().textTheme.copyWith(
            titleMedium: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            titleSmall: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            bodyMedium: const TextStyle(fontSize: 15),
            bodySmall: const TextStyle(fontSize: 13),
          ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
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
          create: (_) => OrganizationProvider(
            auth: authProvider,
            settings: settingsProvider,
            roleConfig: roleConfigProvider,
          )..init(userId: authProvider.user?.openId ?? ''),
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
        ChangeNotifierProvider(
          create: (_) => FinanceProvider(
            orgIdGetter: orgIdGetter(),
            userIdGetter: () => authProvider.user?.openId ?? '',
            userNameGetter: () => settingsProvider.nickname,
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => EventProvider(
            orgIdGetter: orgIdGetter(),
            userIdGetter: () => authProvider.user?.openId ?? '',
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => DataQualityProvider(
            orgIdGetter: orgIdGetter(),
            userIdGetter: () => authProvider.user?.openId ?? '',
            userNameGetter: () => settingsProvider.nickname,
          ),
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final settings = context.watch<SettingsProvider>();
          if (!auth.isAuthenticated) {
            return MaterialApp(
              title: '社易管',
              debugShowCheckedModeBanner: false,
              theme: _buildTheme(settings.effectiveTheme),
              home: const LoginPage(),
            );
          }
          return Consumer<OrganizationProvider>(
            builder: (context, orgProvider, _) {
              if (!orgProvider.hasOrg && !settings.isInitialized) {
                return MaterialApp(
                  title: '社易管',
                  debugShowCheckedModeBanner: false,
                  theme: _buildTheme(settings.effectiveTheme),
                  home: const SetupWizardPage(),
                );
              }
              if (!orgProvider.hasOrg) {
                return MaterialApp(
                  title: '社易管',
                  debugShowCheckedModeBanner: false,
                  theme: _buildTheme(settings.effectiveTheme),
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
                theme: _buildTheme(settings.effectiveTheme),
                routerConfig: appRouter,
              );
            },
          );
        },
      ),
    );
  }
}
