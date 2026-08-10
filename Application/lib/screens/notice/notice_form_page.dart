import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/org_config_provider.dart';
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
    final labels = context.labelsRead;
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
    showToast(context, labels.publishSuccess);
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final labels = context.labels;
    return Scaffold(
      appBar: AppBar(title: Text(labels.publishNoticeTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(labelText: '${labels.labelNoticeTitle} *'),
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? labels.labelNoticeTitleRequired : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: InputDecoration(
                labelText: '${labels.labelNoticeContent} *',
                alignLabelWithHint: true,
              ),
              maxLines: 8,
              textInputAction: TextInputAction.newline,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? labels.labelNoticeContentRequired : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _publisherController,
              decoration: InputDecoration(labelText: '${labels.labelPublisher} *'),
              textInputAction: TextInputAction.done,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? labels.labelPublisherRequired : null,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(labels.labelImportantNotice),
              subtitle: Text(labels.labelImportantNoticeHint),
              value: _isImportant,
              onChanged: (v) => setState(() => _isImportant = v),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _publish,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(labels.publishButton),
            ),
          ],
        ),
      ),
    );
  }
}
