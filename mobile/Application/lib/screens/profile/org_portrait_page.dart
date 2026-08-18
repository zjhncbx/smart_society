import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/data_quality.dart';
import '../../models/project.dart';
import '../../providers/data_quality_provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/governance_provider.dart';
import '../../providers/member_provider.dart';
import '../../providers/notice_provider.dart';
import '../../providers/organization_provider.dart';
import '../../providers/project_provider.dart';
import '../../utils/finance_format.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_theme.dart';

/// 组织数字画像（P1）：组织管理健康度 + 规模/会员/项目/财务/流程/数据/风险/合规钻取。
class OrgPortraitPage extends StatefulWidget {
  const OrgPortraitPage({super.key});

  @override
  State<OrgPortraitPage> createState() => _OrgPortraitPageState();
}

class _OrgPortraitPageState extends State<OrgPortraitPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final finance = context.read<FinanceProvider>();
      finance.loadStats();
      context.read<GovernanceProvider>().load();
      context.read<DataQualityProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appTheme = context.appTheme;
    final org = context.watch<OrganizationProvider>().currentOrg;
    final members = context.watch<MemberProvider>();
    final projects = context.watch<ProjectProvider>().projects;
    final notices = context.watch<NoticeProvider>().notices.length;
    final finance = context.watch<FinanceProvider>();
    final gov = context.watch<GovernanceProvider>();
    final dq = context.watch<DataQualityProvider>();

    // ---- 计算各维度得分 ----
    final dataScore = dq.snapshot.score;
    final flowScore = _clamp(
      100 - gov.openTaskCount * 5 - gov.escalatedTaskCount * 10,
    );
    final riskScore = _clamp(
      100 - gov.riskCount * 15 - gov.warningCount * 5,
    );
    final activeProjects = projects.where((p) => p.status == kProjectActive).toList();
    final budgetWarnings = activeProjects
        .where((p) {
          final expense = finance.stats.projects
              .where((s) => s.projectId == p.id)
              .fold<double>(0, (sum, s) => sum + s.expense);
          return p.budget > 0 && expense / p.budget >= 0.9;
        })
        .length;
    final financeScore = _clamp(100 - budgetWarnings * 10);
    final overdueTaskCount = projects
        .expand((p) => p.tasks)
        .where((t) =>
            t.status != kTaskDone &&
            t.dueDate != null &&
            t.dueDate!.isBefore(DateTime.now()))
        .length;
    final avgProgress = activeProjects.isEmpty
        ? 0
        : (activeProjects.fold<int>(0, (sum, p) => sum + p.progress) /
                activeProjects.length)
            .round();
    final projectScore = _clamp(100 - overdueTaskCount * 5 + avgProgress ~/ 10);

    final overall = (dataScore * 0.25 +
            flowScore * 0.2 +
            riskScore * 0.2 +
            financeScore * 0.15 +
            projectScore * 0.2)
        .round();
    final color = overall >= 90
        ? const Color(0xFF00B96B)
        : overall >= 75
            ? const Color(0xFF3370FF)
            : overall >= 60
                ? const Color(0xFFFF8800)
                : const Color(0xFFF54A45);

    // ---- 会员结构 ----
    final roleCounts = <String, int>{};
    for (final m in members.members) {
      roleCounts[m.roleLabel] = (roleCounts[m.roleLabel] ?? 0) + 1;
    }
    final summary = _summary(overall, gov, dq, activeProjects.length);

    return Scaffold(
      appBar: AppBar(title: const Text('组织数字画像')),
      body: RefreshIndicator(
        onRefresh: () async {
          context.read<FinanceProvider>().loadStats();
          await Future.wait([
            context.read<GovernanceProvider>().load(),
            context.read<DataQualityProvider>().load(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            AppCard(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      org?.name ?? '组织',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '组织管理健康度',
                      style: TextStyle(
                        fontSize: 13,
                        color: appTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '$overall',
                          style: TextStyle(
                            fontSize: 44,
                            height: 1,
                            fontWeight: FontWeight.w800,
                            color: color,
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 4, bottom: 4),
                          child: Text('分', style: TextStyle(fontSize: 14)),
                        ),
                        const Spacer(),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: SizedBox(
                            width: 120,
                            child: LinearProgressIndicator(
                              value: overall / 100,
                              minHeight: 8,
                              color: color,
                              backgroundColor:
                                  theme.colorScheme.surfaceContainerHighest,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      summary,
                      style: TextStyle(
                        fontSize: 13,
                        color: appTheme.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '维度得分',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            AppCard(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    _DimensionRow(
                      label: '数据质量',
                      score: dataScore,
                      onTap: () => context.push('/quality'),
                    ),
                    _DimensionRow(
                      label: '流程效率',
                      score: flowScore,
                      onTap: () => context.push('/governance/tasks'),
                    ),
                    _DimensionRow(
                      label: '风险状态',
                      score: riskScore,
                      onTap: () => context.push('/governance/risks'),
                    ),
                    _DimensionRow(
                      label: '财务健康',
                      score: financeScore,
                      onTap: () => context.push('/finance/list'),
                    ),
                    _DimensionRow(
                      label: '项目执行',
                      score: projectScore,
                      onTap: () => context.push('/projects/list'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '组织规模',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _ScaleTile(
                  label: '成员/会员',
                  value: '${members.totalCount}',
                  icon: Icons.people_outline,
                  color: const Color(0xFF3370FF),
                  onTap: () => context.push('/members/list'),
                ),
                const SizedBox(width: 10),
                _ScaleTile(
                  label: '项目',
                  value: '${projects.length}',
                  icon: Icons.task_alt_outlined,
                  color: const Color(0xFF00B96B),
                  onTap: () => context.push('/projects/list'),
                ),
                const SizedBox(width: 10),
                _ScaleTile(
                  label: '公告',
                  value: '$notices',
                  icon: Icons.campaign_outlined,
                  color: const Color(0xFFFF8800),
                  onTap: () => context.push('/notices/list'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _Section(
              title: '会员结构',
              items: [
                for (final entry in roleCounts.entries)
                  _ItemRow(
                    label: entry.key,
                    value: '${entry.value} 人',
                    onTap: () => context.push('/members/list'),
                  ),
              ],
            ),
            _Section(
              title: '项目执行',
              items: [
                _ItemRow(
                  label: '进行中项目',
                  value: '${activeProjects.length}',
                  onTap: () => context.push('/projects/list'),
                ),
                _ItemRow(
                  label: '平均进度',
                  value: '$avgProgress%',
                  onTap: () => context.push('/projects/list'),
                ),
                _ItemRow(
                  label: '逾期任务',
                  value: '$overdueTaskCount 项',
                  onTap: () => context.push('/projects/list'),
                ),
              ],
            ),
            _Section(
              title: '财务与流程',
              items: [
                _ItemRow(
                  label: '收入',
                  value: '¥${formatAmount(finance.stats.income)}',
                  onTap: () => context.push('/finance/list'),
                ),
                _ItemRow(
                  label: '支出',
                  value: '¥${formatAmount(finance.stats.expense)}',
                  onTap: () => context.push('/finance/list'),
                ),
                _ItemRow(
                  label: '结余',
                  value: '¥${formatAmount(finance.stats.balance)}',
                  onTap: () => context.push('/finance/list'),
                ),
                _ItemRow(
                  label: '审批待办',
                  value: '${finance.taskCount} 项',
                  onTap: () => context.push('/finance/tasks'),
                ),
                _ItemRow(
                  label: '自动任务',
                  value: '${gov.openTaskCount} 项',
                  onTap: () => context.push('/governance/tasks'),
                ),
                _ItemRow(
                  label: '流程阻塞（已升级）',
                  value: '${gov.escalatedTaskCount} 项',
                  onTap: () => context.push('/governance/tasks'),
                ),
              ],
            ),
            _Section(
              title: '风险与数据',
              items: [
                _ItemRow(
                  label: '风险',
                  value: '${gov.riskCount} 项',
                  onTap: () => context.push('/governance/risks'),
                ),
                _ItemRow(
                  label: '预警',
                  value: '${gov.warningCount} 项',
                  onTap: () => context.push('/governance/risks'),
                ),
                _ItemRow(
                  label: '数据问题（待处理）',
                  value: '${dq.openTotal} 项',
                  onTap: () => context.push('/quality'),
                ),
                _ItemRow(
                  label: '数据健康度',
                  value: '${dq.snapshot.score} 分',
                  onTap: () => context.push('/quality'),
                ),
                for (final entry in dq.snapshot.dimensions.entries)
                  _ItemRow(
                    label: qualityCategoryLabel(entry.key),
                    value: '${entry.value} 分',
                    onTap: () => context.push('/quality'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                '每一分都可钻取到真实业务数据；本画像基于当前已接入数据计算，AI 能力待数据与规则稳定后接入。',
                style: TextStyle(fontSize: 12, color: appTheme.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _clamp(int v) => v.clamp(0, 100);

  String _summary(
    int overall,
    GovernanceProvider gov,
    DataQualityProvider dq,
    int activeCount,
  ) {
    if (overall >= 90) {
      return '组织运行总体稳健：风险可控、数据质量良好，请保持当前治理节奏。';
    }
    if (overall >= 75) {
      return '组织运行基本正常，仍有 ${gov.riskCount + gov.warningCount} 项风险/预警与 ${dq.openTotal} 项数据问题待处理，建议优先闭环。';
    }
    if (overall >= 60) {
      return '组织存在明显治理缺口：${gov.riskCount} 项风险需管理层介入，${dq.openTotal} 项数据问题待修复。';
    }
    return '组织健康度偏低，建议从风险、数据质量和流程阻塞入手，逐项闭环后再扩展业务。';
  }
}

class _DimensionRow extends StatelessWidget {
  const _DimensionRow({
    required this.label,
    required this.score,
    required this.onTap,
  });

  final String label;
  final int score;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = score >= 90
        ? const Color(0xFF00B96B)
        : score >= 75
            ? const Color(0xFF3370FF)
            : score >= 60
                ? const Color(0xFFFF8800)
                : const Color(0xFFF54A45);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          children: [
            SizedBox(
              width: 72,
              child: Text(label, style: const TextStyle(fontSize: 13)),
            ),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: score / 100,
                  minHeight: 6,
                  color: color,
                  backgroundColor:
                      Theme.of(context).colorScheme.surfaceContainerHighest,
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 34,
              child: Text(
                '$score',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, size: 16),
          ],
        ),
      ),
    );
  }
}

class _ScaleTile extends StatelessWidget {
  const _ScaleTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: AppCard(
        margin: EdgeInsets.zero,
        padding: const EdgeInsets.all(12),
        onTap: onTap,
        child: Column(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(label, style: const TextStyle(fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.items});

  final String title;
  final List<Widget> items;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          AppCard(
            margin: EdgeInsets.zero,
            child: Column(children: items),
          ),
        ],
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final appTheme = context.appTheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Text(label, style: const TextStyle(fontSize: 13)),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: appTheme.textSecondary,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 16),
          ],
        ),
      ),
    );
  }
}
