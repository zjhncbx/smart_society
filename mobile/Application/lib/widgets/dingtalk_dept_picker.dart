import 'package:flutter/material.dart';

import '../services/dingtalk_api.dart';

/// 部门选择结果：selected 为勾选的部门（按子树），excluded 为显式排除的下级部门（子树）
class DingTalkDeptSelection {
  const DingTalkDeptSelection({
    required this.selected,
    required this.excluded,
  });

  final List<int> selected;
  final List<int> excluded;
}

/// 选择要同步的钉钉组织（部门）。取消时返回 null。
Future<DingTalkDeptSelection?> showDingTalkDeptPicker(
  BuildContext context, {
  required List<DingTalkDepartment> departments,
  required List<int> initialSelection,
  List<int> initialExcluded = const [],
}) {
  return showDialog<DingTalkDeptSelection>(
    context: context,
    builder: (_) => DingTalkDeptPicker(
      departments: departments,
      initialSelection: initialSelection,
      initialExcluded: initialExcluded,
    ),
  );
}

class DingTalkDeptPicker extends StatefulWidget {
  const DingTalkDeptPicker({
    super.key,
    required this.departments,
    required this.initialSelection,
    this.initialExcluded = const [],
  });

  final List<DingTalkDepartment> departments;
  final List<int> initialSelection;
  final List<int> initialExcluded;

  @override
  State<DingTalkDeptPicker> createState() => _DingTalkDeptPickerState();
}

class _DingTalkDeptPickerState extends State<DingTalkDeptPicker> {
  static const _rootId = 1;

  late final Map<int, List<DingTalkDepartment>> _childrenOf;
  late final Set<int> _knownIds;
  late final Set<int> _selected;
  late final Set<int> _excluded;
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
    _knownIds = <int>{_rootId};
    for (final list in _childrenOf.values) {
      _knownIds.addAll(list.map((d) => d.deptId));
    }
    _selected = widget.initialSelection.where(_knownIds.contains).toSet();
    _excluded = widget.initialExcluded.where(_knownIds.contains).toSet();
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

  bool _isChecked(int deptId) =>
      _selected.contains(deptId) && !_excluded.contains(deptId);

  bool _hasSelectedDescendant(int deptId) =>
      _subtreeIds(deptId).any(_isChecked);

  void _toggle(int deptId, bool select) {
    final ids = _subtreeIds(deptId);
    setState(() {
      if (select) {
        _selected.addAll(ids);
        _excluded.removeAll(ids);
      } else {
        _selected.removeAll(ids);
        _excluded.addAll(ids);
      }
    });
  }

  void _selectAll() {
    setState(() {
      _selected
        ..clear()
        ..addAll(_subtreeIds(_rootId));
      _excluded.clear();
    });
  }

  void _clearAll() {
    setState(() {
      _selected.clear();
      _excluded.clear();
    });
  }

  bool get _hasSelection => _subtreeIds(_rootId).any(_isChecked);

  Widget _buildNode(int deptId, String name, int depth) {
    final children = _childrenOf[deptId] ?? const <DingTalkDepartment>[];
    final expanded = _expanded.contains(deptId);
    final checked = _isChecked(deptId);
    final indeterminate = !checked && _hasSelectedDescendant(deptId);

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
                value: indeterminate ? null : checked,
                tristate: true,
                onChanged: (_) => _toggle(deptId, !checked),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => _toggle(deptId, !checked),
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
              ? () => Navigator.of(context).pop(DingTalkDeptSelection(
                    selected: _selected.toList(),
                    excluded: _excluded.toList(),
                  ))
              : null,
          child: const Text('开始同步'),
        ),
      ],
    );
  }
}
