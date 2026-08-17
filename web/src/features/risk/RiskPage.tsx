import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { actRisk, getRisks } from '@/api/endpoints/risks';
import { RiskAlert } from '@/models/contract';

export function RiskPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const risks = useQuery({ queryKey: ['risks'], queryFn: () => getRisks({}) });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'resolve' | 'ack' | 'reopen' }) =>
      actRisk(input.id, input.action),
    onSuccess: () => {
      message.success('已更新');
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    },
  });

  const columns: ColumnsType<RiskAlert> = [
    {
      title: '级别',
      dataIndex: 'kind',
      width: 90,
      render: (v: string) => <Tag color={v === 'risk' ? 'red' : 'orange'}>{v === 'risk' ? '风险' : '预警'}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{v}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.sourceRuleId} · {row.sourceRuleName}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '责任人', dataIndex: 'ownerName', width: 110, render: (v: string) => v || '未指定' },
    { title: '关联', dataIndex: 'sourceEntityName', width: 140 },
    {
      title: '期限',
      dataIndex: 'deadline',
      width: 120,
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      title: '操作',
      width: 220,
      render: (_, row) => (
        <Space>
          {row.status === 'open' ? (
            <>
              <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'ack' })}>
                确认监控
              </Button>
              <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'resolve' })}>
                标记解决
              </Button>
            </>
          ) : (
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'reopen' })}>
              重新打开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>风险与预警</Typography.Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="风险" value={risks.data?.riskCount ?? '—'} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="预警" value={risks.data?.warningCount ?? '—'} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="列表">
        <Table<RiskAlert>
          rowKey="id"
          size="small"
          loading={risks.isLoading}
          dataSource={risks.data?.risks ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
