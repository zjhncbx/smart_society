import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Row, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { AutomationRunLog } from '@/models/contract';
import { getAutomation, runRules } from '@/api/endpoints/automation';

export function AutomationPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const automation = useQuery({ queryKey: ['automation'], queryFn: getAutomation });
  const run = useMutation({
    mutationFn: runRules,
    onSuccess: () => {
      message.success('规则引擎运行完成');
      queryClient.invalidateQueries({ queryKey: ['automation'] });
    },
  });

  const columns: ColumnsType<AutomationRunLog> = [
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
      render: (v: Record<string, number>) => Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' · '),
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

  const counts = automation.data?.counts;
  return (
    <div>
      <Typography.Title level={4}>自动化治理</Typography.Title>
      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="今日执行" value={counts?.todayRuns ?? '—'} loading={automation.isLoading} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="成功率" value={counts?.successRate ?? '—'} suffix="%" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="失败" value={counts?.failed ?? '—'} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="重试" value={counts?.retries ?? '—'} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="卡住流程" value={counts?.blocked ?? '—'} valueStyle={{ color: '#d46b08' }} />
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
      <Card style={{ marginTop: 16 }} title="运行记录">
        <Table<AutomationRunLog>
          rowKey="id"
          size="small"
          loading={automation.isLoading}
          dataSource={automation.data?.logs ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
