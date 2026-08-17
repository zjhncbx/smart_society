import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Row, Statistic, Typography } from 'antd';
import type { EChartsOption } from 'echarts';

import { getReportData } from '@/api/endpoints/reports';
import { EChart } from '@/components/EChart';
import { exportCsv } from '@/utils/exportCsv';

export function ReportsPage(): React.JSX.Element {
  const reports = useQuery({ queryKey: ['reports'], queryFn: getReportData });
  const data = reports.data;

  const financeOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'] },
    xAxis: { type: 'category', data: data?.financeTrend.map((t) => t.month) ?? [] },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'line', smooth: true, data: data?.financeTrend.map((t) => t.income) ?? [] },
      { name: '支出', type: 'line', smooth: true, data: data?.financeTrend.map((t) => t.expense) ?? [] },
    ],
  };
  const riskOption: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        label: { formatter: '{b}: {c}' },
        data: data?.riskDistribution ?? [],
      },
    ],
  };
  const dqOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data?.dqDimensions.map((d) => d.name) ?? [] },
    yAxis: { type: 'value', max: 100 },
    series: [{ type: 'bar', data: data?.dqDimensions.map((d) => d.value) ?? [], itemStyle: { color: '#3370ff' } }],
  };
  const projectOption: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '62%',
        label: { formatter: '{b}: {c}' },
        data: data?.projectStatus ?? [],
      },
    ],
  };

  const exportReport = () => {
    if (!data) return;
    exportCsv(
      `治理报表-${new Date().toISOString().slice(0, 10)}.csv`,
      ['月份', '收入', '支出'],
      data.financeTrend.map((t) => [t.month, t.income, t.expense]),
    );
  };

  return (
    <div>
      <Typography.Title level={4}>报表与分析</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="成员/会员" value={data?.totals.members ?? '—'} loading={reports.isLoading} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="项目" value={data?.totals.projects ?? '—'} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待处理工作项" value={data?.totals.pendingWorkItems ?? '—'} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="数据健康度" value={data?.totals.dqScore ?? '—'} suffix="分" />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="自动化成功率" value={data?.totals.successRate ?? '—'} suffix="%" />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button onClick={exportReport}>导出报表 CSV</Button>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="收支趋势" style={{ marginBottom: 16 }}>
            <EChart option={financeOption} height={280} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="风险分布" style={{ marginBottom: 16 }}>
            <EChart option={riskOption} height={280} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="数据质量维度" style={{ marginBottom: 16 }}>
            <EChart option={dqOption} height={280} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="项目状态分布" style={{ marginBottom: 16 }}>
            <EChart option={projectOption} height={280} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
