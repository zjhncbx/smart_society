import 'package:flutter/material.dart';

import '../services/dingtalk_api.dart';

/// 选择要同步的钉钉组织（部门）。返回选中的部门 ID 列表；
/// 取消时返回 null，未选择任何组织时返回空列表。
Future<List<int>?> showDingTalkDeptPicker(
  BuildContext context, {
  required List<DingTalkDepartment> departments,
  required List<int> initialSelection,
}) {
  return showDialog<List<int>>(
    context: context,
    builder: (_) => DingTalkDeptPicker(
      departments: departments,
      initialSelection: initialSelection,
    ),
  );
}

class DingTalkDeptPicker extends StatefulWidget {
  const DingTalkDeptPicker({
    super.key,
    required this.departments,
    required this.initialSelection,
  });

  final List<DingTalkDepartment> departments;
  final List<int> initialSelection;

  @override
  State<DingTalkDeptPicker> createState() => _DingTalkDeptPickerState();
}

class _DingTalkDeptPickerState extends State<DingTalkDeptPicker> {
  static const _rootId = 1;

  late final Map<int, List<DingTalkDepartment>> _childrenOf;
  late final Set<int> _selected;
  final Set<int> _expanded = {};

  @override
  void initState() {
    super.initState();
    _childrenOf = <int, List<DingTalkDepartment>>{};
    for (final d in widget.departments) {
      _childrenOf.putIfAbsent(d.parentId, () => []).add(d);
      _expanded.add(d.deptId);
    }
    for (final list in _childrenOf.values) {
      list.sort((a, b) => a.deptId.compareTo(b.deptId));
    }
    final knownIds = <int>{_rootId};
    for (final list in _childrenOf.values) {
      knownIds.addAll(list.map((d) => d.deptId));
    }
    _selected = widget.initialSelection
        .where(knownIds.contains)
        .toSet();
  }

  List<int> _subtreeIds(int deptId) {
    final result = <int>[deptId];
    final queue = <int>[deptId];
    while (queue.isNotEmpty) {
      final parent = queue.removeAt(0);
      for (final child in _childrenOf[parent] ?? const <DingTalkDepartment>[]) {
        result.add(child.deptId);
        queue.add(child.deptId);
      }
    }
    return result;
  }

  void _toggle(int deptId, bool select) {
    setState(() {
      final ids = _subtreeIds(deptId);
      if (select) {
        _selected.addAll(ids);
      } else {
        _selected.removeAll(ids);
      }
    });
  }

  void _selectAll() {
    setState(() {
      _selected
        ..clear()
        ..addAll(_subtreeIds(_rootId));
    });
  }

  void _clearAll() {
    setState(_selected.clear);
  }

  bool get _hasSelection =>
      _subtreeIds(_rootId).any((id) => _selected.contains(id));

  Widget _buildNode(int deptId, String name, int depth) {
    final children = _childrenOf[deptId] ?? const <DingTalkDepartment>[];
    final expanded = _expanded.contains(deptId);
    final selected = _selected.contains(deptId);
    final hasSelectedDescendant =
        !selected && _subtreeIds(deptId).any(_selected.contains);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: 8.0 * depth),
          child: Row(
            children: [
              InkWell(
                onTap: children.isEmpty
                    ? null
                    : () => setState(() {
                          if (expanded) {
                            _expanded.remove(deptId);
                          } else {
                            _expanded.add(deptId);
                          }
                        }),
                borderRadius: BorderRadius.circular(4),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(
                    children.isEmpty
                        ? Icons.circle_outlined
                        : expanded
                            ? Icons.expand_more
                            : Icons.chevron_right,
                    size: 20,
                    color: Theme.of(context).colorScheme.outline,
                  ),
                ),
              ),
              Checkbox(
                value: hasSelectedDescendant ? null : selected,
                tristate: true,
                onChanged: (_) => _toggle(deptId, !selected),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => _toggle(deptId, !selected),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: deptId == _rootId
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (expanded)
          ...children.map((c) => _buildNode(c.deptId, c.name, depth + 1)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('选择要同步的组织'),
      content: SizedBox(
        width: 360,
        height: 420,
        child: Column(
          children: [
            Row(
              children: [
                TextButton(
                  onPressed: _selectAll,
                  child: const Text('全选'),
                ),
                TextButton(
                  onPressed: _clearAll,
                  child: const Text('清空'),
                ),
                const Spacer(),
                if (!_hasSelection)
                  const Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: Text(
                      '请至少选择一个组织',
                      style: TextStyle(fontSize: 12, color: Colors.redAccent),
                    ),
                  ),
              ],
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                child: _buildNode(_rootId, '全部组织', 0),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(null),
          child: const Text('取消'),
        ),
        FilledButton(
          onPressed: _hasSelection
              ? () => Navigator.of(context).pop(_selected.toList())
              : null,
          child: const Text('开始同步'),
        ),
      ],
    );
  }
}
