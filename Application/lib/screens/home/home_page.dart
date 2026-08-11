import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../models/project.dart';
import '../../providers/finance_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/sync_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_theme.dart';

/// 工作台首页：问候 + 统计 + 快捷入口 + 最近动态（钉钉/飞书风格）
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? _lastOrgId;
  bool _watching = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refresh());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_watching) return;
    _watching = true;
    final org = context.read<OrganizationProvider>();
    _lastOrgId = org.currentOrgId;
    org.addListener(_onOrgChanged);
  }

  @override
  void dispose() {
    context.read<OrganizationProvider>().removeListener(_onOrgChanged);
    super.dispose();
  }

  void _onOrgChanged() {
    final orgId = context.read<OrganizationProvider>().currentOrgId;
    if (orgId != _lastOrgId) {
      _lastOrgId = orgId;
      _refresh();
    }
  }

  Future<void> _refresh() async {
    final orgId = context.read<OrganizationProvider>().currentOrgId;
    final finance = context.read<FinanceProvider>();
    finance.loadStats();
    finance.loadTasks();
    if (orgId != null && orgId.isNotEmpty) {
      await SyncProvider.instance.pullAndRefresh(orgId);
    }
    if (mounted) setState(() {});
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 6) return '夜深了';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    final org = context.watch<OrganizationProvider>().currentOrg;
    final members = context.watch<MemberProvider>().totalCount;
    final projects = context.watch<ProjectProvider>().projects;
    final activeProjects = projects.where((p) => p.status == kProjectActive).toList();
    final unread = context.watch<NoticeProvider>().unreadCount;
    final notices = context.watch<NoticeProvider>().sortedNotices.take(3).toList();
    final taskCount = context.watch<FinanceProvider>().taskCount;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
        children: [
          Text(
            '${_greeting()}，${org?.name ?? ''}',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '今天也要元气满满地组织活动',
            style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
          ),
          const SizedBox(height: 16),
          // 统计卡
          Row(
            children: [
              _StatCard(
                label: '成员总数',
                value: '$members',
                icon: Icons.people_outline,
                color: const Color(0xFF3370FF),
                onTap: () => context.go('/members'),
              ),
              const SizedBox(width: 12),
              _StatCard(
                label: '进行中项目',
                value: '${activeProjects.length}',
                icon: Icons.task_alt_outlined,
                color: const Color(0xFF00B96B),
                onTap: () => context.go('/projects'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _StatCard(
                label: '未读通知',
                value: '$unread',
                icon: Icons.campaign_outlined,
                color: const Color(0xFFFF8800),
                onTap: () => context.go('/notices'),
              ),
              const SizedBox(width: 12),
              _StatCard(
                label: '我的待办',
                value: '$taskCount',
                icon: Icons.inbox_outlined,
                color: const Color(0xFFF54A45),
                onTap: () => context.go('/finance/tasks'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // 快捷入口
          AppCard(
            margin: EdgeInsets.zero,
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Row(
                  children: [
                    _QuickAction(
                      label: labels.tabMembers,
                      icon: Icons.people_outline,
                      color: const Color(0xFF3370FF),
                      onTap: () => context.go('/members'),
                    ),
                    _QuickAction(
                      label: labels.tabProjects,
                      icon: Icons.task_alt_outlined,
                      color: const Color(0xFF00B96B),
                      onTap: () => context.go('/projects'),
                    ),
                    _QuickAction(
                      label: labels.tabNotices,
                      icon: Icons.campaign_outlined,
                      color: const Color(0xFFFF8800),
                      onTap: () => context.go('/notices'),
                    ),
                    _QuickAction(
                      label: labels.tabFinance,
                      icon: Icons.account_balance_wallet_outlined,
                      color: const Color(0xFF7B61FF),
                      onTap: () => context.go('/finance'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _QuickAction(
                      label: '审批待办',
                      icon: Icons.fact_check_outlined,
                      color: const Color(0xFFF54A45),
                      onTap: () => context.go('/finance/tasks'),
                    ),
                    _QuickAction(
                      label: '设置',
                      icon: Icons.settings_outlined,
                      color: const Color(0xFF8A9099),
                      onTap: () => context.go('/settings'),
                    ),
                    const _QuickAction(
                      label: '',
                      icon: Icons.circle,
                      color: Colors.transparent,
                      onTap: null,
                    ),
                    const _QuickAction(
                      label: '',
                      icon: Icons.circle,
                      color: Colors.transparent,
                      onTap: null,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // 最近动态
          Text(
            '进行中项目',
            style: theme.textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (activeProjects.isEmpty)
            AppCard(
              margin: EdgeInsets.zero,
              child: Text(
                '暂无进行中的项目',
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            )
          else
            for (final p in activeProjects.take(3))
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.go('/projects/${p.id}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            p.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          '${p.progress}%',
                          style: TextStyle(
                            fontSize: 13,
                            color: appTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: p.progress / 100,
                        minHeight: 6,
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      ),
                    ),
                  ],
                ),
              ),
          const SizedBox(height: 12),
          Text(
            '最新通知',
            style: theme.textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (notices.isEmpty)
            AppCard(
              margin: EdgeInsets.zero,
              child: Text(
                '暂无通知',
                style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
              ),
            )
          else
            for (final n in notices)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.go('/notices/${n.id}'),
                child: Row(
                  children: [
                    if (!n.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF54A45),
                          shape: BoxShape.circle,
                        ),
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            formatDate(n.publishTime),
                            style: TextStyle(
                              fontSize: 12,
                              color: appTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return Expanded(
      child: AppCard(
        margin: EdgeInsets.zero,
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 22, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: appTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 24, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
