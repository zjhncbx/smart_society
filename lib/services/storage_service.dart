import 'dart:io';

import 'package:flutter/services.dart';
import 'package:hive/hive.dart';

import '../models/member.dart';
import '../models/notice.dart';
import '../models/society_activity.dart';

/// 本地存储服务：Hive 持久化成员/活动/通知数据。
///
/// 存储目录优先通过原生 MethodChannel 获取（鸿蒙真机沙箱路径），
/// 原生不可用时回退到临时目录（桌面预览场景）。
class StorageService {
  StorageService._();

  static final StorageService instance = StorageService._();

  static const MethodChannel _pathChannel =
      MethodChannel('com.smartsociety/storage');

  static const String membersBoxName = 'members';
  static const String activitiesBoxName = 'activities';
  static const String noticesBoxName = 'notices';

  late final Box<dynamic> membersBox;
  late final Box<dynamic> activitiesBox;
  late final Box<dynamic> noticesBox;

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    final path = await _resolveStoragePath();
    Hive.init(path);
    membersBox = await Hive.openBox(membersBoxName);
    activitiesBox = await Hive.openBox(activitiesBoxName);
    noticesBox = await Hive.openBox(noticesBoxName);
    await _seedIfEmpty();
    _initialized = true;
  }

  Future<String> _resolveStoragePath() async {
    try {
      final path =
          await _pathChannel.invokeMethod<String>('getStoragePath');
      if (path != null && path.isNotEmpty) return path;
    } on PlatformException catch (_) {
      // 原生通道不可用，回退临时目录
    } on MissingPluginException catch (_) {
      // 测试环境无原生实现，回退临时目录
    }
    final dir = await Directory.systemTemp.createTemp('smart_society');
    return dir.path;
  }

  DateTime _addDays(DateTime from, int days) =>
      from.add(Duration(days: days));

  Future<void> _seedIfEmpty() async {
    if (membersBox.isNotEmpty || activitiesBox.isNotEmpty) return;

    final now = DateTime.now();
    DateTime addDays(int days) => _addDays(now, days);

    final members = <Member>[
      Member(
        id: 'm001',
        name: '张伟',
        studentNo: '20230001',
        department: '主席团',
        roleId: 'president',
        roleLabel: '社长',
        phone: '13800000001',
        email: 'zhangwei@example.com',
        joinedAt: addDays(-600),
      ),
      Member(
        id: 'm002',
        name: '李娜',
        studentNo: '20230002',
        department: '宣传部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000002',
        joinedAt: addDays(-560),
      ),
      Member(
        id: 'm003',
        name: '王强',
        studentNo: '20230003',
        department: '组织部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000003',
        joinedAt: addDays(-540),
      ),
      Member(
        id: 'm004',
        name: '赵敏',
        studentNo: '20230004',
        department: '技术部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000004',
        joinedAt: addDays(-520),
      ),
      Member(
        id: 'm005',
        name: '陈杰',
        studentNo: '20230005',
        department: '技术部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000005',
        joinedAt: addDays(-300),
      ),
      Member(
        id: 'm006',
        name: '刘洋',
        studentNo: '20230006',
        department: '外联部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000006',
        joinedAt: addDays(-280),
      ),
      Member(
        id: 'm007',
        name: '杨雪',
        studentNo: '20230007',
        department: '宣传部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000007',
        joinedAt: addDays(-260),
      ),
      Member(
        id: 'm008',
        name: '孙浩',
        studentNo: '20240001',
        department: '组织部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000008',
        joinedAt: addDays(-90),
      ),
      Member(
        id: 'm009',
        name: '周婷',
        studentNo: '20240002',
        department: '技术部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000009',
        joinedAt: addDays(-80),
      ),
      Member(
        id: 'm010',
        name: '吴磊',
        studentNo: '20240003',
        department: '外联部',
        roleId: 'director',
        roleLabel: '部长',
        phone: '13800000010',
        joinedAt: addDays(-60),
      ),
    ];
    for (final m in members) {
      membersBox.put(m.id, m.toJson());
    }

    final activities = <SocietyActivity>[
      SocietyActivity(
        id: 'a001',
        title: '编程技能分享会',
        description: '邀请技术部骨干分享 Flutter 开发经验与项目实战技巧，'
            '涵盖状态管理、网络层封装与鸿蒙混合通信等内容。',
        location: '大学生活动中心 302',
        startTime: addDays(2).add(const Duration(hours: 14)),
        endTime: addDays(2).add(const Duration(hours: 17)),
        capacity: 50,
        organizer: '技术部',
        participants: [
          ActivityParticipant(memberId: 'm005', joinedAt: addDays(-2)),
          ActivityParticipant(memberId: 'm009', joinedAt: addDays(-1)),
        ],
        createdAt: addDays(-10),
      ),
      SocietyActivity(
        id: 'a002',
        title: '秋季社团招新宣讲会',
        description: '面向全校新生的社团介绍会，届时将介绍各部门职责、'
            '往期活动成果以及本学期活动计划，欢迎踊跃报名。',
        location: '学术报告厅',
        startTime: addDays(1).add(const Duration(hours: 19)),
        endTime: addDays(1).add(const Duration(hours: 21)),
        capacity: 200,
        organizer: '主席团',
        participants: const [],
        createdAt: addDays(-7),
      ),
      SocietyActivity(
        id: 'a003',
        title: '社区环保志愿活动',
        description: '前往幸福社区开展垃圾分类宣传与街道清扫志愿活动，'
            '提供志愿服务时长证明。',
        location: '幸福社区服务中心',
        startTime: addDays(-1).add(const Duration(hours: 9)),
        endTime: addDays(-1).add(const Duration(hours: 12)),
        capacity: 30,
        organizer: '外联部',
        participants: [
          ActivityParticipant(memberId: 'm006', joinedAt: addDays(-5)),
          ActivityParticipant(memberId: 'm010', joinedAt: addDays(-5)),
          ActivityParticipant(memberId: 'm002', joinedAt: addDays(-4)),
        ],
        createdAt: addDays(-14),
      ),
      SocietyActivity(
        id: 'a004',
        title: '社团文化节闭幕式',
        description: '各社团联合举办的文化节闭幕晚会，我社负责节目编排'
            '与现场组织，需要志愿者协助。',
        location: '大学生活动中心 一楼大厅',
        startTime: addDays(-8).add(const Duration(hours: 18)),
        endTime: addDays(-8).add(const Duration(hours: 21)),
        capacity: 100,
        organizer: '组织部',
        participants: [
          ActivityParticipant(memberId: 'm003', joinedAt: addDays(-12)),
          ActivityParticipant(memberId: 'm008', joinedAt: addDays(-11)),
          ActivityParticipant(memberId: 'm001', joinedAt: addDays(-10)),
          ActivityParticipant(memberId: 'm004', joinedAt: addDays(-9)),
        ],
        createdAt: addDays(-20),
      ),
    ];
    for (final a in activities) {
      activitiesBox.put(a.id, a.toJson());
    }

    final notices = <Notice>[
      Notice(
        id: 'n001',
        title: '关于开展秋季招新工作的通知',
        content: '为充实社团力量，本学期招新工作将于本周六正式启动。'
            '请各部门提前准备宣传物料，组织部负责场地申请，'
            '宣传部负责线上推文与海报设计。\n\n'
            '招新时间：本周六 9:00-17:00\n'
            '招新地点：大学生活动中心门前广场',
        publisher: '主席团',
        publishTime: addDays(-3),
        isImportant: true,
      ),
      Notice(
        id: 'n002',
        title: '编程技能分享会报名开放',
        content: '技术部将于本周四下午举办编程技能分享会，'
            '欢迎对 Flutter 开发感兴趣的成员在活动模块报名。'
            '名额有限，先到先得。',
        publisher: '技术部',
        publishTime: addDays(-2),
      ),
      Notice(
        id: 'n003',
        title: '社团章程修订说明',
        content: '经全体成员大会表决通过，社团章程第三章第五条关于'
            '成员考核制度的内容已修订，具体细则见章程附件。',
        publisher: '主席团',
        publishTime: addDays(-6),
        isImportant: true,
      ),
      Notice(
        id: 'n004',
        title: '本月例会安排',
        content: '本月例会定于周五晚 19:00 在 302 会议室召开，'
            '请各部门负责人准时参加并提交本月工作总结。',
        publisher: '组织部',
        publishTime: addDays(-1),
      ),
    ];
    for (final n in notices) {
      noticesBox.put(n.id, n.toJson());
    }
  }
}
