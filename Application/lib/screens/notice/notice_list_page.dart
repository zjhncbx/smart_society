import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
import '../../models/notice.dart';
import '../../providers/notice_provider.dart';
import '../../utils/date_format.dart';
import '../../widgets/app_badges.dart';
import '../../widgets/app_empty_state.dart';

/// 通知公告列表页：搜索 + 未读筛选 + 全部已读
class NoticeListPage extends StatefulWidget {
  const NoticeListPage({super.key});

  @override
  State<NoticeListPage> createState() => _NoticeListPageState();
}

class _NoticeListPageState extends State<NoticeListPage> {
  final _searchController = TextEditingController();
  String _keyword = '';
  bool _unreadOnly = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    final provider = context.watch<NoticeProvider>();
    final notices = provider.sortedNotices.where((n) {
      if (_unreadOnly && n.isRead) return false;
      if (_keyword.isNotEmpty &&
          !n.title.toLowerCase().contains(_keyword) &&
          !(n.content.toLowerCase().contains(_keyword))) {
        return false;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(labels.noticeMgmtTitle),
        actions: [
          if (provider.unreadCount > 0)
            IconButton(
              tooltip: '全部已读',
              icon: const Icon(Icons.done_all),
              onPressed: () => provider.markAllRead(),
            ),
          IconButton(
            tooltip: labels.publishButton,
            icon: const Icon(Icons.edit_note),
            onPressed: () => context.push('/notices/new'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _keyword = v.trim().toLowerCase()),
              decoration: InputDecoration(
                hintText: '搜索通知标题 / 内容',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
              ),
            ),
          ),
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: const Text('全部'),
                    selected: !_unreadOnly,
                    onSelected: (_) => setState(() => _unreadOnly = false),
                  ),
                ),
                ChoiceChip(
                  label: Text('未读 (${provider.unreadCount})'),
                  selected: _unreadOnly,
                  onSelected: (_) => setState(() => _unreadOnly = true),
                ),
              ],
            ),
          ),
          Expanded(
            child: notices.isEmpty
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
          ),
        ],
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
        '${notice.publisher} 路 ${formatRelative(notice.publishTime, today: labels.todayLabel, yesterday: labels.yesterdayLabel, daysAgo: labels.daysAgo)}',
        style: theme.textTheme.bodySmall
            ?.copyWith(color: theme.colorScheme.outline),
      ),
      onTap: () => context.push('/notices/${notice.id}'),
    );
  }
}
