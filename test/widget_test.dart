import 'package:flutter_test/flutter_test.dart';

import 'package:smart_society/app.dart';
import 'package:smart_society/services/storage_service.dart';

void main() {
  setUpAll(() async {
    await StorageService.instance.init();
  });

  testWidgets('应用启动冒烟测试', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartSocietyApp());
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));

    // 底部导航四个 tab 存在
    expect(find.text('成员管理'), findsOneWidget);
    expect(find.text('活动'), findsOneWidget);
    expect(find.text('通知'), findsOneWidget);
    expect(find.text('我的'), findsOneWidget);
  });
}
