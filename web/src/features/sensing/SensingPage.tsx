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
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';

export function SensingPage(): React.JSX.Element {
  const posture = useQuery({ queryKey: ['posture'], queryFn: getPosture });
  const events = useQuery({ queryKey: ['events'], queryFn: () => getEvents({ pageSize: 20 }) });
  const risks = useQuery({ queryKey: ['risks'], queryFn: () => getRisks({}) });
  const dq = useQuery({ queryKey: ['data-quality'], queryFn: getDataQuality });
  const automation = useQuery({ queryKey: ['automation'], queryFn: () => getAutomation() });
  const workItems = useQuery({
    queryKey: ['work-items', 'open'],
    queryFn: () => getWorkItems({ status: 'open', pageSize: 1 }),
  });

  /** 运行统计从日志页数据计算（get-automation-logs 不再返回 counts） */
  const automationLogs = automation.data?.logs ?? [];
  const automationFailed = automationLogs.filter((l) => l.status === 'failed').length;
  const automationSuccessRate =
    automationLogs.length > 0
      ? Math.round(((automationLogs.length - automationFailed) / automationLogs.length) * 100)
      : 0;

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
    <PageContainer title="全域感知" description="组织运行态势、风险与数据质量总览">
      <Row gutter={16}>
        <Col span={4}>
          <Card>
            {posture.isError ? (
              <ErrorState description="组织态势加载失败" onRetry={() => void posture.refetch()} />
            ) : (
              <Statistic title="组织运行" value={posture.data?.status ?? '—'} loading={posture.isLoading} />
            )}
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            {workItems.isError ? (
              <ErrorState description="工作项加载失败" onRetry={() => void workItems.refetch()} />
            ) : (
              <Statistic title="待处理工作项" value={workItems.data?.openCount ?? '—'} />
            )}
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            {dq.isError ? (
              <ErrorState description="数据质量加载失败" onRetry={() => void dq.refetch()} />
            ) : (
              <Statistic title="数据健康度" value={dq.data?.snapshot.score ?? '—'} suffix="分" />
            )}
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            {automation.isError ? (
              <ErrorState description="自动化数据加载失败" onRetry={() => void automation.refetch()} />
            ) : (
              <Statistic
                title="自动化成功率"
                value={automation.isLoading ? '—' : automationSuccessRate}
                suffix="%"
              />
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="风险分布" style={{ marginBottom: 16 }}>
            {risks.isError ? (
              <ErrorState description="风险数据加载失败" onRetry={() => void risks.refetch()} />
            ) : (
              <EChart option={riskOption} height={240} />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="数据质量维度" style={{ marginBottom: 16 }}>
            {dq.isError ? (
              <ErrorState description="数据质量加载失败" onRetry={() => void dq.refetch()} />
            ) : Object.entries(dq.data?.snapshot.dimensions ?? {}).length > 0 ? (
              Object.entries(dq.data?.snapshot.dimensions ?? {}).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <Typography.Text>{key}</Typography.Text>
                  <Progress percent={value} size="small" />
                </div>
              ))
            ) : (
              <Typography.Paragraph type="secondary">暂无数据</Typography.Paragraph>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="待关注" style={{ marginBottom: 16 }}>
            {posture.isError ? (
              <ErrorState description="组织态势加载失败" onRetry={() => void posture.refetch()} />
            ) : posture.data?.topConcerns.length ? (
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
        {events.isError ? (
          <ErrorState description="事件流加载失败" onRetry={() => void events.refetch()} />
        ) : (
          <Table<BusinessEvent>
            rowKey="id"
            size="small"
            loading={events.isLoading}
            dataSource={events.data?.events ?? []}
            columns={eventColumns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </PageContainer>
  );
}
