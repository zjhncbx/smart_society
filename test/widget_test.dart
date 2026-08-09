import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:smart_society/config/org_config_provider.dart';
import 'package:smart_society/providers/role_config_provider.dart';
import 'package:smart_society/providers/settings_provider.dart';
import 'package:smart_society/services/storage_service.dart';
import 'package:smart_society/widgets/app_theme.dart';

void main() {
  setUpAll(() async {
    await StorageService.instance.init();
  });

  testWidgets('应用启动冒烟测试', (WidgetTester tester) async {
    final settingsProvider = SettingsProvider();
    await settingsProvider.init();
    await settingsProvider.completeSetup();

    final roleConfigProvider = RoleConfigProvider();
    await roleConfigProvider.init();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: settingsProvider),
          ChangeNotifierProvider.value(value: roleConfigProvider),
        ],
        child: Builder(
          builder: (context) {
            final labels = context.labels;
            return MaterialApp(
              theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
                useMaterial3: true,
                extensions: [AppTheme.fromColorScheme(ColorScheme.fromSeed(seedColor: Colors.blue))],
              ),
              home: Scaffold(
                body: Column(
                  children: [
                    Text(labels.tabMembers),
                    Text(labels.tabActivities),
                    Text(labels.tabNotices),
                    Text(labels.tabProfile),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('成员'), findsOneWidget);
    expect(find.text('活动'), findsOneWidget);
    expect(find.text('通知'), findsOneWidget);
    expect(find.text('我的'), findsOneWidget);
  });
}
