import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/org_config_provider.dart';
import '../providers/finance_provider.dart';
import '../providers/notice_provider.dart';
import '../providers/organization_provider.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final org = context.watch<OrganizationProvider>().currentOrg;
    return Scaffold(
      appBar: AppBar(title: Text(org?.name ?? labels.appTitle)),
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
            icon: const Icon(Icons.task_alt_outlined),
            selectedIcon: const Icon(Icons.task_alt),
            label: labels.tabProjects,
          ),
          NavigationDestination(
            icon: _NoticeTabIcon(selected: false),
            selectedIcon: _NoticeTabIcon(selected: true),
            label: labels.tabNotices,
          ),
          NavigationDestination(
            icon: _FinanceTabIcon(selected: false),
            selectedIcon: _FinanceTabIcon(selected: true),
            label: labels.tabFinance,
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

class _FinanceTabIcon extends StatelessWidget {
  const _FinanceTabIcon({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    final count = context.select<FinanceProvider, int>((p) => p.taskCount);
    return Badge(
      label: Text('$count'),
      isLabelVisible: count > 0,
      child: Icon(
        selected
            ? Icons.account_balance_wallet
            : Icons.account_balance_wallet_outlined,
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
