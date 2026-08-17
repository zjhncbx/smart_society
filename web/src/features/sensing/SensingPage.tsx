import { useQuery } from '@tanstack/react-query';
import { Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';

import { getEvents } from '@/api/endpoints/audit';
import { getDataQuality } from '@/api/endpoints/dataQuality';
import { getAutomation } from '@/api/endpoints/automation';
import { getPosture } from '@/api/endpoints/sensing';
import { getWorkItems } from '@/api/endpoints/workItems';
import { getRisks } from '@/api/endpoints/risks';
import { BusinessEvent } from '@/models/contract';
import { EChart } from '@/components/EChart';

export function SensingPage(): React.JSX.Element {
  const posture = useQuery({ queryKey: ['posture'], queryFn: getPosture });
  const events = useQuery({ queryKey: ['events'], queryFn: () => getEvents({ pageSize: 20 }) });
  const risks = useQuery({ queryKey: ['risks'], queryFn: () => getRisks({}) });
  const dq = useQuery({ queryKey: ['data-quality'], queryFn: getDataQuality });
  const automation = useQuery({ queryKey: ['automation'], queryFn: getAutomation });
  const workItems = useQuery({
    queryKey: ['work-items', 'open'],
    queryFn: () => getWorkItems({ status: 'open', pageSize: 1 }),
  });

  const riskOption: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '65%',
        label: { formatter: '{b}: {c}' },
        data: [
          { name: '风险', value: risks.data?.riskCount ?? 0 },
          { name: '预警', value: risks.data?.warningCount ?? 0 },
        ],
      },
    ],
  };

  const eventColumns: ColumnsType<BusinessEvent> = [
    { title: '事件', dataIndex: 'eventType', width: 110, render: (v: string) => <Tag>{v}</Tag> },
    { title: '对象', dataIndex: 'entityType', width: 110, render: (v: string, r) => `${v}：${r.entityName}` },
    { title: '操作人', dataIndex: 'actorName', width: 100 },
    {
      title: '级别',
      dataIndex: 'level',
      width: 80,
      render: (v: string) => <Tag color={v === 'risk' ? 'red' : v === 'warning' ? 'orange' : 'blue'}>{v}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'occurredAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>全域感知</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="组织运行" value={posture.data?.status ?? '—'} loading={posture.isLoading} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待处理工作项" value={workItems.data?.openCount ?? '—'} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="数据健康度" value={dq.data?.snapshot.score ?? '—'} suffix="分" />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="自动化成功率" value={automation.data?.counts.successRate ?? '—'} suffix="%" />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="风险分布" style={{ marginBottom: 16 }}>
            <EChart option={riskOption} height={240} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="数据质量维度" style={{ marginBottom: 16 }}>
            {Object.entries(dq.data?.snapshot.dimensions ?? {}).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <Typography.Text>{key}</Typography.Text>
                <Progress percent={value} size="small" />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="待关注" style={{ marginBottom: 16 }}>
            {posture.data?.topConcerns.length ? (
              posture.data.topConcerns.map((c, i) => (
                <Typography.Paragraph key={i} type="secondary" style={{ marginBottom: 8 }}>
                  {c.text}
                </Typography.Paragraph>
              ))
            ) : (
              <Typography.Paragraph type="secondary">暂无待关注事项</Typography.Paragraph>
            )}
          </Card>
        </Col>
      </Row>
      <Card title="近期事件流">
        <Table<BusinessEvent>
          rowKey="id"
          size="small"
          loading={events.isLoading}
          dataSource={events.data?.events ?? []}
          columns={eventColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
