import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Row, Statistic, Typography } from 'antd';
import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';

import { getReportData } from '@/api/endpoints/reports';
import { getTrendStats } from '@/api/endpoints/trends';
import { EChart } from '@/components/EChart';
import { exportCsv } from '@/utils/exportCsv';

export function ReportsPage(): React.JSX.Element {
  const reports = useQuery({ queryKey: ['reports'], queryFn: getReportData });
  const trends = useQuery({ queryKey: ['trends'], queryFn: getTrendStats });
  const data = reports.data;
  const trendData = trends.data;

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
  const eventTrendOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: trendData?.eventTrend.map((t) => t.date.slice(5)) ?? [] },
      yAxis: { type: 'value' },
      series: [
        { name: '事件', type: 'line', smooth: true, data: trendData?.eventTrend.map((t) => t.count) ?? [] },
        { name: '风险', type: 'bar', data: trendData?.riskTrend.map((t) => t.count) ?? [] },
      ],
    }),
    [trendData],
  );

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
      {trendData && trendData.anomalies.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="变化感知"
          description={trendData.anomalies.join('；')}
        />
      )}
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
            <Statistic
              title="审批平均耗时"
              value={trendData?.approvalAvgHours ?? '—'}
              suffix="h"
              valueStyle={{ color: '#d46b08' }}
            />
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
          <Card title="近 7 天事件与风险趋势" style={{ marginBottom: 16 }}>
            <EChart option={eventTrendOption} height={280} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="自动化运行趋势" style={{ marginBottom: 16 }}>
            <EChart
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: trendData?.automationTrend.map((t) => t.date.slice(5)) ?? [] },
                yAxis: { type: 'value', max: 100 },
                series: [
                  { name: '成功率%', type: 'line', smooth: true, data: trendData?.automationTrend.map((t) => t.successRate) ?? [] },
                  { name: '运行次数', type: 'bar', data: trendData?.automationTrend.map((t) => t.runs) ?? [] },
                ],
              }}
              height={280}
            />
          </Card>
        </Col>
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
