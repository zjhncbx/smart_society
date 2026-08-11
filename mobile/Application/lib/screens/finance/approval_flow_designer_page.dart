import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/finance_config.dart';
import '../../config/org_config_provider.dart';
import '../../config/org_labels.dart';
import '../../models/approval_flow.dart';
import '../../providers/finance_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/role_config_provider.dart';
import '../../widgets/app_empty_state.dart';
import '../../widgets/common.dart';

/// 审批流程设计器：flowId 为空时展示流程列表，否则进入编辑。
class ApprovalFlowDesignerPage extends StatefulWidget {
  const ApprovalFlowDesignerPage({super.key, this.flowId});

  final String? flowId;

  @override
  State<ApprovalFlowDesignerPage> createState() =>
      _ApprovalFlowDesignerPageState();
}

class _ApprovalFlowDesignerPageState extends State<ApprovalFlowDesignerPage> {
  bool get _isEdit => widget.flowId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().loadFlows();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isEdit) return _FlowEditPage(flowId: widget.flowId!);
    return _FlowListPage();
  }
}

class _FlowListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final labels = FinanceLabels.forType(context.orgType);
    final provider = context.watch<FinanceProvider>();
    final isAdmin =
        context.watch<OrganizationProvider>().currentOrgRole == 'admin';

    if (!isAdmin) {
      return Scaffold(
        appBar: AppBar(title: Text(labels.approvalFlows)),
        body: const Center(child: Text('仅组织管理员可以设置审批流程')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(labels.approvalFlows)),
      body: provider.flows.isEmpty
          ? const AppEmptyState(
              icon: Icons.account_tree_outlined,
              title: '暂无审批流程',
            )
          : ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                for (final flow in provider.flows)
                  Card(
                    child: ListTile(
                      title: Text(flow.name),
                      subtitle: Text(
                        '${flow.nodes.length} 个节点'
                        '${flow.enabled ? '' : ' · 已停用'}'
                        '${flow.isDefault ? ' · 默认流程' : ''}',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push(
                        '/finance/flows/edit?flowId=${flow.id}',
                      ),
                    ),
                  ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/finance/flows/edit?flowId=new'),
        icon: const Icon(Icons.add),
        label: Text(labels.newFlow),
      ),
    );
  }
}

class _FlowEditPage extends StatefulWidget {
  const _FlowEditPage({required this.flowId});

  final String flowId;

  @override
  State<_FlowEditPage> createState() => _FlowEditPageState();
}

class _FlowEditPageState extends State<_FlowEditPage> {
  final _nameController = TextEditingController();
  final List<TextEditingController> _nodeNameControllers = [];
  bool _isDefault = false;
  bool _enabled = true;
  List<FlowNode> _nodes = [];
  bool _loaded = false;
  bool _saving = false;

  FinanceLabels get _labels => FinanceLabels.forType(context.orgTypeRead);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _nameController.dispose();
    for (final c in _nodeNameControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _load() {
    final provider = context.read<FinanceProvider>();
    final orgLabels = OrgLabels.forType(context.orgTypeRead);
    if (widget.flowId != 'new') {
      final existing = provider.flows.where((f) => f.id == widget.flowId).firstOrNull;
      if (existing != null) {
        _nameController.text = existing.name;
        _isDefault = existing.isDefault;
        _enabled = existing.enabled;
        _nodes = existing.nodes.map((n) {
          return FlowNode(
            id: n.id,
            type: n.type,
            name: n.name,
            roleIds: [...n.roleIds],
            userIds: [...n.userIds],
          );
        }).toList();
      }
    }
    if (_nodes.isEmpty) {
      final defaultRole = orgLabels.roles.firstOrNull;
      _nodes = [
        FlowNode(
          id: 'n1',
          type: kNodeApprove,
          name: '审批',
          roleIds: defaultRole == null ? [] : [defaultRole.id],
        ),
      ];
    }
    for (final n in _nodes) {
      _nodeNameControllers.add(TextEditingController(text: n.name));
    }
    _loaded = true;
    setState(() {});
  }

  void _addNode() {
    setState(() {
      _nodes.add(FlowNode(
        id: 'n${_nodes.length + 1}',
        type: kNodeApprove,
        name: '审批',
        roleIds: [],
      ));
      _nodeNameControllers.add(TextEditingController(text: '审批'));
    });
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      showToast(context, '请填写流程名称');
      return;
    }
    if (_nodes.isEmpty) {
      showToast(context, '请至少添加一个节点');
      return;
    }
    if (_nodes.any((n) => n.name.trim().isEmpty)) {
      showToast(context, '请填写所有节点名称');
      return;
    }
    final provider = context.read<FinanceProvider>();
    final orgId = context.read<OrganizationProvider>().currentOrgId ?? '';
    setState(() => _saving = true);
    try {
      final flow = ApprovalFlow(
        id: widget.flowId == 'new'
            ? 'af${DateTime.now().millisecondsSinceEpoch}'
            : widget.flowId,
        orgId: orgId,
        name: name,
        bizType: 'finance',
        nodes: _nodes,
        enabled: _enabled,
        isDefault: _isDefault,
        createdAt: DateTime.now(),
      );
      await provider.saveFlow(flow);
      if (!mounted) return;
      showToast(context, '已保存');
      context.pop();
    } catch (e) {
      if (!mounted) return;
      showToast(context, '$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final labels = _labels;
    final roles = context.labels.roles;
    final roleConfig = context.read<RoleConfigProvider>();
    final orgId = context.read<OrganizationProvider>().currentOrgId ?? '';
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(labels.approvalFlows)),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(labelText: '${labels.flowName} *'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(labels.defaultFlow),
                  value: _isDefault,
                  onChanged: (v) => setState(() => _isDefault = v),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(labels.enableFlow),
                  value: _enabled,
                  onChanged: (v) => setState(() => _enabled = v),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '流程节点',
                      style: theme.textTheme.titleSmall
                          ?.copyWith(color: theme.colorScheme.primary),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: _addNode,
                      icon: const Icon(Icons.add, size: 18),
                      label: Text(labels.addNode),
                    ),
                  ],
                ),
                for (var i = 0; i < _nodes.length; i++)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 12,
                                child: Text('${i + 1}',
                                    style: const TextStyle(fontSize: 12)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  initialValue: _nodes[i].type,
                                  decoration: InputDecoration(
                                    labelText: '节点类型',
                                    isDense: true,
                                  ),
                                  items: [
                                    DropdownMenuItem(
                                      value: kNodeApprove,
                                      child: Text(labels.nodeApprove),
                                    ),
                                    DropdownMenuItem(
                                      value: kNodeHandle,
                                      child: Text(labels.nodeHandle),
                                    ),
                                    DropdownMenuItem(
                                      value: kNodeCc,
                                      child: Text(labels.nodeCc),
                                    ),
                                  ],
                                  onChanged: (v) {
                                    if (v != null) {
                                      setState(() => _nodes[i].type = v);
                                    }
                                  },
                                ),
                              ),
                              IconButton(
                                onPressed: _nodes.length > 1
                                    ? () => setState(() {
                                          _nodes.removeAt(i);
                                          final c = _nodeNameControllers.removeAt(i);
                                          c.dispose();
                                        })
                                    : null,
                                icon: const Icon(Icons.delete_outline),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _nodeNameControllers[i],
                            decoration: InputDecoration(
                              labelText: labels.nodeName,
                              isDense: true,
                            ),
                            onChanged: (v) => _nodes[i].name = v,
                          ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              labels.assigneeRoles,
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                          Wrap(
                            spacing: 6,
                            children: [
                              for (final role in roles)
                                FilterChip(
                                  label: Text(
                                    roleConfig.getLabel(
                                        orgId, role.id, role.label),
                                  ),
                                  selected:
                                      _nodes[i].roleIds.contains(role.id),
                                  visualDensity: VisualDensity.compact,
                                  onSelected: (sel) {
                                    setState(() {
                                      if (sel) {
                                        if (!_nodes[i].roleIds
                                            .contains(role.id)) {
                                          _nodes[i].roleIds.add(role.id);
                                        }
                                      } else {
                                        _nodes[i].roleIds.remove(role.id);
                                      }
                                    });
                                  },
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(_saving ? '保存中…' : '保存'),
                ),
              ],
            ),
    );
  }
}
