import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../providers/finance_provider.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_empty_state.dart';

class ApprovalInboxPage extends StatefulWidget {
  const ApprovalInboxPage({super.key});

  @override
  State<ApprovalInboxPage> createState() => _ApprovalInboxPageState();
}

class _ApprovalInboxPageState extends State<ApprovalInboxPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().loadTasks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final provider = context.watch<FinanceProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(labels.myTasks)),
      body: provider.tasks.isEmpty
          ? const AppEmptyState(
              icon: Icons.inbox_outlined,
              title: '暂无待办',
            )
          : RefreshIndicator(
              onRefresh: () => provider.loadTasks(),
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  for (final task in provider.tasks)
                    Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                          child: Icon(Icons.fact_check_outlined),
                        ),
                        title: Text(
                          task.record?.summary ?? task.instance.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          '${task.node.nodeName}'
                          '${task.record != null ? ' · ¥${formatAmount(task.record!.amount)}' : ''}'
                          ' · ${task.instance.flowName}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () async {
                          final recordId =
                              task.record?.id ?? task.instance.bizId;
                          if (recordId.isEmpty) return;
                          final provider = context.read<FinanceProvider>();
                          await context.push('/finance/$recordId');
                          if (mounted) {
                            provider.loadTasks();
                          }
                        },
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
