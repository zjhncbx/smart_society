import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/notice_provider.dart';

/// 底部导航框架
class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) =>
            navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: '成员',
          ),
          const NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: '活动',
          ),
          NavigationDestination(
            icon: _NoticeTabIcon(selected: false),
            selectedIcon: _NoticeTabIcon(selected: true),
            label: '通知',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: '我的',
          ),
        ],
      ),
    );
  }
}

/// 通知 tab 图标（带未读数徽标）
class _NoticeTabIcon extends StatelessWidget {
  const _NoticeTabIcon({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    final unread = context.select<NoticeProvider, int>((p) => p.unreadCount);
    return Badge(
      label: Text('$unread'),
      isLabelVisible: unread > 0,
      child: Icon(selected ? Icons.campaign : Icons.campaign_outlined),
    );
  }
}
