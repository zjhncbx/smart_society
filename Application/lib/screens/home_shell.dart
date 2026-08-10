import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/org_config_provider.dart';
import '../providers/notice_provider.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        surfaceTintColor: Colors.transparent,
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) =>
            navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.people_outline),
            selectedIcon: const Icon(Icons.people),
            label: labels.tabMembers,
          ),
          NavigationDestination(
            icon: const Icon(Icons.event_outlined),
            selectedIcon: const Icon(Icons.event),
            label: labels.tabActivities,
          ),
          NavigationDestination(
            icon: _NoticeTabIcon(selected: false),
            selectedIcon: _NoticeTabIcon(selected: true),
            label: labels.tabNotices,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: labels.tabProfile,
          ),
        ],
      ),
    );
  }
}

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
