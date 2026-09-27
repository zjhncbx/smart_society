import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/org_config_provider.dart';
import '../config/theme_config.dart';
import '../providers/finance_provider.dart';
import '../providers/notice_provider.dart';
import '../providers/organization_provider.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/member_avatar.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  /// “再按一次退出”防抖时间戳（仅首页 Tab 生效）
  DateTime? _lastBackAt;

  /// Tab 根页面返回键处理（PopScope 挂在 shell 页 ModalRoute 上）：
  /// - 非首页 Tab：切回首页 Tab，不退出应用；
  /// - 首页 Tab：首次返回提示“再按一次退出应用”，2 秒内再次返回才退出。
  void _handleBack() {
    final shell = widget.navigationShell;
    if (shell.currentIndex != 0) {
      shell.goBranch(0, initialLocation: false);
      return;
    }
    final now = DateTime.now();
    if (_lastBackAt == null ||
        now.difference(_lastBackAt!) > const Duration(seconds: 2)) {
      _lastBackAt = now;
      showToast(context, '再按一次退出应用');
      return;
    }
    // flutter-ohos 嵌入层未实际实现 SystemNavigator.pop
    // （PlatformPlugin 委托返回 false 后仅执行 ArkUI router.back()，
    // 单页 ArkUI 栈为 no-op），双击返回的“放行退出”在鸿蒙上暂不生效，
    // 属嵌入层平台限制（见 back-checklist.md §1 结果记录）；
    // 不使用 exit(0) 强杀进程——实测存在引擎死亡但宿主窗口
    // 残留白屏的竞态（僵尸窗口），风险不可接受。
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final org = context.watch<OrganizationProvider>().currentOrg;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
      appBar: AppBar(
        title: Text(org?.name ?? labels.appTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: '全域检索',
            onPressed: () => context.push('/search'),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: () => context.push('/profile'),
              customBorder: const CircleBorder(),
              child: MemberAvatar(
                name: org?.name ?? labels.appTitle,
                colorIndex: org?.orgId.hashCode.abs() ?? 0,
                radius: 17,
              ),
            ),
          ),
        ],
      ),
      body: widget.navigationShell,
      bottomNavigationBar: Container(
        // 底栏顶部 hairline 分隔线（对标飞书）
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: context.appTheme.dividerColor),
          ),
        ),
        child: NavigationBar(
          surfaceTintColor: Colors.transparent,
          height: DesignTokens.bottomNavHeight,
          selectedIndex: widget.navigationShell.currentIndex,
          onDestinationSelected: (index) => widget.navigationShell.goBranch(
              index,
              initialLocation:
                  index == widget.navigationShell.currentIndex),
          destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: labels.tabHome,
          ),
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
          ],
        ),
      ),
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
