import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/org_labels.dart';
import 'config/theme_config.dart';
import 'providers/activity_provider.dart';
import 'providers/member_provider.dart';
import 'providers/notice_provider.dart';
import 'providers/role_config_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/settings/setup_wizard_page.dart';
import 'router.dart';
import 'services/api_client.dart';
import 'services/storage_service.dart';
import 'widgets/app_theme.dart';

Future<void> mainApp() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.instance.init();
  await StorageService.instance.init();
  final settingsProvider = SettingsProvider();
  await settingsProvider.init();
  final roleConfigProvider = RoleConfigProvider();
  await roleConfigProvider.init();
  runApp(SmartSocietyApp(
    settingsProvider: settingsProvider,
    roleConfigProvider: roleConfigProvider,
  ));
}

class SmartSocietyApp extends StatelessWidget {
  final SettingsProvider settingsProvider;
  final RoleConfigProvider roleConfigProvider;

  const SmartSocietyApp({
    super.key,
    required this.settingsProvider,
    required this.roleConfigProvider,
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
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: settingsProvider),
        ChangeNotifierProvider.value(value: roleConfigProvider),
        ChangeNotifierProvider(create: (_) => MemberProvider()..load()),
        ChangeNotifierProvider(create: (_) => ActivityProvider()..load()),
        ChangeNotifierProvider(create: (_) => NoticeProvider()..load()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          if (!settings.isInitialized) {
            return MaterialApp(
              title: '智联社团',
              debugShowCheckedModeBanner: false,
              theme: _buildTheme(settings.theme),
              home: const SetupWizardPage(),
            );
          }
          final labels = OrgLabels.forType(settings.orgType);
          return MaterialApp.router(
            title: labels.appTitle,
            debugShowCheckedModeBanner: false,
            theme: _buildTheme(settings.theme),
            routerConfig: appRouter,
          );
        },
      ),
    );
  }
}
