import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/activity_provider.dart';
import 'providers/member_provider.dart';
import 'providers/notice_provider.dart';
import 'router.dart';
import 'services/api_client.dart';
import 'services/storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.instance.init();
  await StorageService.instance.init();
  runApp(const SmartSocietyApp());
}

class SmartSocietyApp extends StatelessWidget {
  const SmartSocietyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MemberProvider()..load()),
        ChangeNotifierProvider(create: (_) => ActivityProvider()..load()),
        ChangeNotifierProvider(create: (_) => NoticeProvider()..load()),
      ],
      child: MaterialApp.router(
        title: '智联社团',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3D6BD6)),
          useMaterial3: true,
        ),
        routerConfig: appRouter,
      ),
    );
  }
}
