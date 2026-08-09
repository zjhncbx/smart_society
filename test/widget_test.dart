import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:smart_society/config/org_config_provider.dart';
import 'package:smart_society/providers/settings_provider.dart';
import 'package:smart_society/services/storage_service.dart';

void main() {
  setUpAll(() async {
    await StorageService.instance.init();
  });

  testWidgets('应用启动冒烟测试', (WidgetTester tester) async {
    final settingsProvider = SettingsProvider();
    await settingsProvider.init();
    // Force initialized so setup wizard is skipped
    await settingsProvider.completeSetup();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: settingsProvider),
        ],
        child: Builder(
          builder: (context) {
            final labels = context.labels;
            return MaterialApp(
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
