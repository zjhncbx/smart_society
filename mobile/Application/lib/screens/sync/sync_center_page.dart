import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/organization_provider.dart';
import '../../providers/sync_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/app_theme.dart';

/// 同步中心：数据状态、最近同步、待同步队列与同步原则说明。
class SyncCenterPage extends StatefulWidget {
  const SyncCenterPage({super.key});

  @override
  State<SyncCenterPage> createState() => _SyncCenterPageState();
}

class _SyncCenterPageState extends State<SyncCenterPage> {
  bool _busy = false;

  Future<void> _syncNow() async {
    final orgId = context.read<OrganizationProvider>().currentOrgId;
    if (orgId == null || orgId.isEmpty) return;
    setState(() => _busy = true);
    try {
      await SyncProvider.instance.pullAndRefresh(orgId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('同步完成，数据已更新')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('同步失败：$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();
    final appTheme = context.appTheme;
    final synced = sync.pendingCount == 0 && !sync.isSyncing;
    return Scaffold(
      appBar: AppBar(title: const Text('同步中心')),
      body: RefreshIndicator(
        onRefresh: () async {
          final orgId = context.read<OrganizationProvider>().currentOrgId;
          if (orgId != null && orgId.isNotEmpty) {
            await SyncProvider.instance.pullAndRefresh(orgId);
          }
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            AppCard(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          synced
                              ? Icons.cloud_done_outlined
                              : Icons.cloud_sync_outlined,
                          color: synced
                              ? const Color(0xFF00B96B)
                              : const Color(0xFFFF8800),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            sync.isSyncing
                                ? '同步中…'
                                : synced
                                    ? '数据状态：已同步'
                                    : '数据状态：有待同步项',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        FilledButton.icon(
                          onPressed: _busy || sync.isSyncing ? null : _syncNow,
                          icon: const Icon(Icons.sync, size: 18),
                          label: Text(_busy || sync.isSyncing ? '同步中…' : '立即同步'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _SyncStat(
                          label: '最近同步',
                          value: sync.lastSyncedAt == null
                              ? '--'
                              : formatDateTime(sync.lastSyncedAt!),
                          color: appTheme.textSecondary,
                        ),
                        _SyncStat(
                          label: '待同步',
                          value: '${sync.pendingCount}',
                          color: sync.pendingCount > 0
                              ? const Color(0xFFF54A45)
                              : const Color(0xFF00B96B),
                        ),
                        _SyncStat(
                          label: '周期',
                          value: '30s',
                          color: appTheme.textSecondary,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '待同步队列（${sync.queue.length}）',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            if (sync.queue.isEmpty)
              const AppEmptyState(
                icon: Icons.check_circle_outline,
                title: '队列为空',
                subtitle: '本地操作会先落盘，联网后自动推送到云端',
              )
            else
              for (final entry in sync.queue)
                AppCard(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    dense: true,
                    leading: Icon(
                      entry.op == SyncOp.delete
                          ? Icons.delete_outline
                          : Icons.upload_outlined,
                      color: entry.op == SyncOp.delete
                          ? const Color(0xFFF54A45)
                          : const Color(0xFF3370FF),
                    ),
                    title: Text(
                      '${entry.op == SyncOp.delete ? '删除' : '推送'} ${_typeLabel(entry.type)}：${entry.id}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      formatDateTime(entry.createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: appTheme.textSecondary,
                      ),
                    ),
                  ),
                ),
            const SizedBox(height: 16),
            Text(
              '同步原则',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            AppCard(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _PrincipleRow(
                      icon: Icons.cloud_upload_outlined,
                      text: '本地优先：所有写入先落 Hive，界面即时响应，操作自动入队',
                    ),
                    _PrincipleRow(
                      icon: Icons.sync_outlined,
                      text: '周期推送：30 秒自动处理队列，失败保留重试，不静默丢失',
                    ),
                    _PrincipleRow(
                      icon: Icons.cloud_download_outlined,
                      text: '队列清空后自动拉取云端最新数据，覆盖本地对应组织缓存',
                    ),
                    _PrincipleRow(
                      icon: Icons.shield_outlined,
                      text: '冲突处理：云端拉取以服务端版本为准；静默覆盖场景将逐步引入版本对比与冲突确认',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'member':
        return '成员';
      case 'project':
        return '项目';
      case 'notice':
        return '公告';
      default:
        return type;
    }
  }
}

class _SyncStat extends StatelessWidget {
  const _SyncStat({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _PrincipleRow extends StatelessWidget {
  const _PrincipleRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF3370FF)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 13, color: appTheme.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
