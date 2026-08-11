import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/organization_provider.dart';
import '../../widgets/app_card.dart';

class OrgSelectorPage extends StatelessWidget {
  const OrgSelectorPage({super.key});

  @override
  Widget build(BuildContext context) {
    final orgProvider = context.watch<OrganizationProvider>();
    final theme = Theme.of(context);
    final orgs = orgProvider.orgs;

    return Scaffold(
      appBar: AppBar(title: const Text('切换组织')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          ...orgs.map((org) {
            final isCurrent = org.orgId == orgProvider.currentOrgId;
            return AppCard(
              margin: const EdgeInsets.symmetric(vertical: 4),
              onTap: () async {
                await orgProvider.switchOrg(org.orgId);
                if (!context.mounted) return;
                // 等本帧重建完成后跳转，避免路由移除与子树重建竞态
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (context.mounted) context.go('/members');
                });
              },
              child: Row(
                children: [
                  Icon(
                    isCurrent ? Icons.check_circle : Icons.circle_outlined,
                    color: isCurrent ? theme.colorScheme.primary : theme.colorScheme.outline,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(org.name, style: theme.textTheme.titleSmall),
                        Text(org.orgId, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                      ],
                    ),
                  ),
                  if (isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('当前', style: theme.textTheme.labelSmall),
                    ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          AppCard(
            margin: const EdgeInsets.symmetric(vertical: 4),
            onTap: () => context.push('/orgs/create'),
            child: Row(
              children: [
                Icon(Icons.add, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Text('注册新组织', style: theme.textTheme.titleSmall),
              ],
            ),
          ),
          AppCard(
            margin: const EdgeInsets.symmetric(vertical: 4),
            onTap: () => _joinOrg(context),
            child: Row(
              children: [
                Icon(Icons.group_add, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Text('加入已有组织', style: theme.textTheme.titleSmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _joinOrg(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('加入组织'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: '输入组织ID'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
          FilledButton(
            onPressed: () async {
              final id = controller.text.trim();
              if (id.isEmpty) return;
              try {
                await context.read<OrganizationProvider>().joinOrg(id);
                if (ctx.mounted) Navigator.pop(ctx);
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('加入失败: $e')));
                }
              }
            },
            child: const Text('加入'),
          ),
        ],
      ),
    );
  }
}
