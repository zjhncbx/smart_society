import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/notice.dart';
import '../../providers/notice_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';

/// 通知详情页：进入时自动标记已读
class NoticeDetailPage extends StatefulWidget {
  const NoticeDetailPage({super.key, required this.id});

  final String id;

  @override
  State<NoticeDetailPage> createState() => _NoticeDetailPageState();
}

class _NoticeDetailPageState extends State<NoticeDetailPage> {
  @override
  void initState() {
    super.initState();
    // 页面打开即标记已读
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NoticeProvider>().markRead(widget.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<NoticeProvider>();
    final notice = provider.findById(widget.id);

    if (notice == null) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.noticeDetailTitle)),
        body: AppEmptyState(
          icon: Icons.campaign_outlined,
          title: labels.labelNoticeNotExist,
        ),
      );
    }

    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(labels.noticeDetailTitle),
        actions: [
          IconButton(
            tooltip: labels.deleteTooltip,
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _deleteNotice(context, provider, notice, labels),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              if (notice.isImportant) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.error.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    labels.importantLabel,
                    style: TextStyle(
                      color: theme.colorScheme.error,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  notice.title,
                  style: theme.textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${notice.publisher} · ${formatDateTime(notice.publishTime)}',
            style: theme.textTheme.bodySmall
                ?.copyWith(color: theme.colorScheme.outline),
          ),
          const Divider(height: 32),
          Text(
            notice.content,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.7),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteNotice(
    BuildContext context,
    NoticeProvider provider,
    Notice notice,
    OrgLabels labels,
  ) async {
    final message = labels.confirmDeleteMsg
        .replaceAll('{type}', labels.deleteNoticeTitle)
        .replaceAll('{name}', notice.title);
    final ok = await showConfirmDialog(
      context,
      title: labels.deleteNoticeTitle,
      message: message,
      confirmText: labels.confirmDelete,
    );
    if (!ok || !context.mounted) return;
    await provider.delete(notice.id);
    if (context.mounted) context.pop();
  }
}
