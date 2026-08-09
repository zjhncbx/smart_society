import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/org_labels.dart';
import 'providers/activity_provider.dart';
import 'providers/member_provider.dart';
import 'providers/notice_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/settings/setup_wizard_page.dart';
import 'router.dart';
import 'services/api_client.dart';
import 'services/storage_service.dart';

Future<void> mainApp() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.instance.init();
  await StorageService.instance.init();
  final settingsProvider = SettingsProvider();
  await settingsProvider.init();
  runApp(SmartSocietyApp(settingsProvider: settingsProvider));
}

class SmartSocietyApp extends StatelessWidget {
  final SettingsProvider settingsProvider;

  const SmartSocietyApp({super.key, required this.settingsProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: settingsProvider),
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
              theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(
                  seedColor: settings.theme.seedColor,
                ),
                useMaterial3: true,
              ),
              home: const SetupWizardPage(),
            );
          }
          final labels = OrgLabels.forType(settings.orgType);
          return MaterialApp.router(
            title: labels.appTitle,
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: settings.theme.seedColor,
                brightness: settings.theme.brightness,
              ),
              useMaterial3: true,
            ),
            routerConfig: appRouter,
          );
        },
      ),
    );
  }
}
