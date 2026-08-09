import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/notice.dart';
import '../../providers/notice_provider.dart';
import '../../widgets/common.dart';

/// 发布公告表单
class NoticeFormPage extends StatefulWidget {
  const NoticeFormPage({super.key});

  @override
  State<NoticeFormPage> createState() => _NoticeFormPageState();
}

class _NoticeFormPageState extends State<NoticeFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _publisherController = TextEditingController();
  bool _isImportant = false;

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _publisherController.dispose();
    super.dispose();
  }

  Future<void> _publish() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<NoticeProvider>();

    final notice = Notice(
      id: NoticeProvider.nextId(provider.notices),
      title: _titleController.text.trim(),
      content: _contentController.text.trim(),
      publisher: _publisherController.text.trim(),
      publishTime: DateTime.now(),
      isImportant: _isImportant,
    );
    await provider.publish(notice);
    if (!mounted) return;
    showToast(context, '公告发布成功');
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('发布公告')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: '公告标题 *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入公告标题' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: '公告内容 *',
                alignLabelWithHint: true,
              ),
              maxLines: 8,
              textInputAction: TextInputAction.newline,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入公告内容' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _publisherController,
              decoration: const InputDecoration(labelText: '发布人 *'),
              textInputAction: TextInputAction.done,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '请输入发布人' : null,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('标记为重要公告'),
              subtitle: const Text('重要公告将在列表中突出显示'),
              value: _isImportant,
              onChanged: (v) => setState(() => _isImportant = v),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _publish,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('发布公告'),
            ),
          ],
        ),
      ),
    );
  }
}
