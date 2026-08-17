import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { actIssue, getDataQuality, runDataQuality } from '@/api/endpoints/dataQuality';
import { DataQualityIssue } from '@/models/contract';

export function DataQualityPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const dq = useQuery({ queryKey: ['data-quality'], queryFn: getDataQuality });
  const run = useMutation({
    mutationFn: runDataQuality,
    onSuccess: (r) => {
      message.success(`数据质量检查完成，健康度 ${r.score} 分`);
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    },
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'resolve' | 'ignore' | 'reopen' }) =>
      actIssue(input.id, input.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    },
  });

  const columns: ColumnsType<DataQualityIssue> = [
    { title: '规则', dataIndex: 'ruleName', width: 160, render: (v: string, r) => `${r.ruleId} ${v}` },
    { title: '对象', dataIndex: 'entityName', width: 160 },
    { title: '问题', dataIndex: 'description' },
    {
      title: '严重度',
      dataIndex: 'severity',
      width: 90,
      render: (v: string) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'default'}>{v}</Tag>,
    },
    {
      title: '操作',
      width: 200,
      render: (_, row) => (
        <Space>
          {row.status === 'open' ? (
            <>
              <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'resolve' })}>
                解决
              </Button>
              <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'ignore' })}>
                忽略
              </Button>
            </>
          ) : (
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'reopen' })}>
              重开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const snapshot = dq.data?.snapshot;
  return (
    <div>
      <Typography.Title level={4}>数据治理</Typography.Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据治理健康度"
              value={snapshot?.score ?? '—'}
              suffix="分"
              loading={dq.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待处理问题" value={dq.data?.openTotal ?? '—'} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Button loading={run.isPending} onClick={() => run.mutate()}>
              运行数据质量检查
            </Button>
          </Card>
        </Col>
      </Row>
      {snapshot && (
        <Card style={{ marginTop: 16 }} title="维度健康度">
          <Row gutter={24}>
            {Object.entries(snapshot.dimensions).map(([key, value]) => (
              <Col span={6} key={key}>
                <Typography.Text>{key}</Typography.Text>
                <Progress percent={value} />
              </Col>
            ))}
          </Row>
        </Card>
      )}
      <Card style={{ marginTop: 16 }} title="问题清单">
        <Table<DataQualityIssue>
          rowKey="id"
          size="small"
          loading={dq.isLoading}
          dataSource={dq.data?.issues ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
