import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../models/notice.dart';
import '../../providers/notice_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';

/// 通知公告列表页
class NoticeListPage extends StatelessWidget {
  const NoticeListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<NoticeProvider>();
    final notices = provider.sortedNotices;

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.noticeMgmtTitle),
        actions: [
          IconButton(
            tooltip: labels.publishButton,
            icon: const Icon(Icons.edit_note),
            onPressed: () => context.push('/notices/new'),
          ),
        ],
      ),
      body: notices.isEmpty
          ? AppEmptyState(
              icon: Icons.campaign_outlined,
              title: labels.emptyNotices,
              action: FilledButton.icon(
                onPressed: () => context.push('/notices/new'),
                icon: const Icon(Icons.add),
                label: Text(labels.publishButton),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notices.length,
              separatorBuilder: (_, _) => const Divider(
                height: 1,
                indent: 16,
                endIndent: 16,
              ),
              itemBuilder: (context, index) {
                final notice = notices[index];
                return _NoticeTile(notice: notice);
              },
            ),
    );
  }
}

class _NoticeTile extends StatelessWidget {
  const _NoticeTile({required this.notice});

  final Notice notice;

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final theme = Theme.of(context);
    final titleStyle = theme.textTheme.bodyLarge?.copyWith(
      fontWeight: notice.isRead ? FontWeight.normal : FontWeight.w600,
      color: notice.isRead
          ? theme.colorScheme.onSurfaceVariant
          : theme.colorScheme.onSurface,
    );

    return ListTile(
      leading: notice.isImportant
          ? Tooltip(
              message: labels.importantLabel,
              child: Icon(Icons.warning_amber_rounded,
                  color: theme.colorScheme.error),
            )
          : Icon(
              notice.isRead
                  ? Icons.mark_email_read_outlined
                  : Icons.mark_email_unread_outlined,
              color: notice.isRead
                  ? theme.colorScheme.outlineVariant
                  : theme.colorScheme.primary,
            ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              notice.title,
              style: titleStyle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (notice.isImportant)
            Padding(
              padding: const EdgeInsets.only(left: 6),
              child: StatusBadge(
                label: labels.importantLabel,
                variant: BadgeVariant.warning,
              ),
            ),
          if (!notice.isRead)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(left: 6),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
      subtitle: Text(
        '${notice.publisher} · ${formatRelative(notice.publishTime, today: labels.todayLabel, yesterday: labels.yesterdayLabel, daysAgo: labels.daysAgo)}',
        style: theme.textTheme.bodySmall
            ?.copyWith(color: theme.colorScheme.outline),
      ),
      onTap: () => context.push('/notices/${notice.id}'),
    );
  }
}
