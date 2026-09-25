import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import { AutomationRunLog, Rule } from '@/models/contract';
import { getAutomation, runRules } from '@/api/endpoints/automation';
import { getRules, toggleRule } from '@/api/endpoints/rules';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { colors } from '@/theme/tokens';
import { exportCsv } from '@/utils/exportCsv';

const categoryLabel: Record<string, string> = {
  project: '项目',
  approval: '审批',
  finance: '财务',
  governance: '治理',
  'data-quality': '数据质量',
  member: '成员',
  org: '组织',
};

export function AutomationPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<Rule | null>(null);
  const automation = useQuery({ queryKey: ['automation'], queryFn: () => getAutomation({ pageSize: 50 }) });
  const rules = useQuery({ queryKey: ['rules'], queryFn: getRules });
  const run = useMutation({
    mutationFn: runRules,
    onSuccess: () => {
      message.success('规则引擎运行完成');
      queryClient.invalidateQueries({ queryKey: ['automation'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '规则引擎运行失败，请重试');
    },
  });
  const toggle = useMutation({
    mutationFn: (input: { ruleId: string; enabled: boolean }) =>
      toggleRule(input.ruleId, input.enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '规则启停失败，请重试');
    },
  });

  const logColumns: ColumnsType<AutomationRunLog> = [
    { title: '规则', dataIndex: 'ruleName', render: (v: string, r) => `${r.ruleId} ${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={v === 'success' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '动作',
      dataIndex: 'actions',
      render: (v: Record<string, number>) =>
        Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' · ') || '—',
    },
    { title: '耗时(ms)', dataIndex: 'durationMs', width: 110 },
    {
      title: '运行时间',
      dataIndex: 'runAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '关联ID',
      dataIndex: 'correlationId',
      ellipsis: true,
      render: (v?: string) => (v ? <Typography.Text code>{v.slice(0, 18)}…</Typography.Text> : '—'),
    },
  ];

  const ruleColumns: ColumnsType<Rule> = [
    { title: '规则', dataIndex: 'name', render: (v: string, r) => `${r.id} ${v}` },
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      render: (v: string) => <Tag>{categoryLabel[v] ?? v}</Tag>,
    },
    { title: '触发', dataIndex: 'whenText', width: 200, ellipsis: true },
    { title: '条件', dataIndex: 'ifText', ellipsis: true },
    { title: '动作', dataIndex: 'thenText', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (v: boolean, r) => (
        <Switch
          size="small"
          checked={v}
          loading={toggle.isPending && toggle.variables?.ruleId === r.id}
          onChange={(checked) => toggle.mutate({ ruleId: r.id, enabled: checked })}
        />
      ),
    },
    {
      title: '详情',
      width: 80,
      render: (_, r) => (
        <Button size="small" onClick={() => setDetail(r)}>
          查看
        </Button>
      ),
    },
  ];

  /** 运行统计从日志页数据计算（get-automation-logs 不再返回 counts） */
  const logs = automation.data?.logs ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = logs.filter((l) => l.runAt.slice(0, 10) === today).length;
  const failedRuns = logs.filter((l) => l.status === 'failed').length;
  const successRate = logs.length > 0 ? Math.round(((logs.length - failedRuns) / logs.length) * 100) : 0;

  const exportLogs = () => {
    exportCsv(
      `自动化运行记录-${new Date().toISOString().slice(0, 10)}.csv`,
      ['规则', '状态', '耗时(ms)', '运行时间', '关联ID'],
      logs.map((l) => [`${l.ruleId} ${l.ruleName}`, l.status, l.durationMs, l.runAt, l.correlationId ?? '']),
    );
  };

  return (
    <PageContainer title="自动化治理" description="自动化规则运行监控与执行记录">
      <Card>
        <Tabs
          items={[
            {
              key: 'monitor',
              label: '运行监控',
              children: automation.isError ? (
                <ErrorState onRetry={() => void automation.refetch()} />
              ) : (
                <>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={4}>
                      <Card>
                        <Statistic title="今日执行" value={automation.isLoading ? '—' : todayRuns} />
                      </Card>
                    </Col>
                    <Col span={4}>
                      <Card>
                        <Statistic title="成功率" value={successRate} suffix="%" valueStyle={{ color: colors.success }} />
                      </Card>
                    </Col>
                    <Col span={4}>
                      <Card>
                        <Statistic title="失败" value={failedRuns} valueStyle={{ color: colors.error }} />
                      </Card>
                    </Col>
                    <Col span={4}>
                      <Card>
                        <Statistic title="总记录" value={automation.data?.total ?? '—'} />
                      </Card>
                    </Col>
                    <Col span={4}>
                      <Card>
                        <Statistic title="更多页" value={automation.data?.hasMore ? '有' : '无'} />
                      </Card>
                    </Col>
                    <Col span={4}>
                      <Card>
                        <Button loading={run.isPending} onClick={() => run.mutate()}>
                          运行规则
                        </Button>
                      </Card>
                    </Col>
                  </Row>
                  <Space style={{ marginBottom: 12 }}>
                    <Typography.Text strong>运行记录</Typography.Text>
                    <Button size="small" onClick={exportLogs}>
                      导出记录
                    </Button>
                  </Space>
                  <Table<AutomationRunLog>
                    rowKey="id"
                    size="small"
                    loading={automation.isLoading}
                    dataSource={logs}
                    columns={logColumns}
                    pagination={false}
                  />
                </>
              ),
            },
            {
              key: 'rules',
              label: `规则管理（${rules.data?.rules.length ?? 0}）`,
              children: rules.isError ? (
                <ErrorState onRetry={() => void rules.refetch()} />
              ) : (
                <Table<Rule>
                  rowKey="id"
                  size="small"
                  loading={rules.isLoading}
                  dataSource={rules.data?.rules ?? []}
                  columns={ruleColumns}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        title={`规则详情：${detail?.id ?? ''}`}
        open={detail != null}
        onClose={() => setDetail(null)}
        width={480}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="规则ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="分类">{categoryLabel[detail.category] ?? detail.category}</Descriptions.Item>
            <Descriptions.Item label="状态">{detail.enabled ? '已启用' : '已停用'}</Descriptions.Item>
            <Descriptions.Item label="触发（When）">{detail.whenText}</Descriptions.Item>
            <Descriptions.Item label="条件（If）">{detail.ifText}</Descriptions.Item>
            <Descriptions.Item label="动作（Then）">{detail.thenText}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
}
