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
  const automation = useQuery({ queryKey: ['automation'], queryFn: getAutomation });
  const rules = useQuery({ queryKey: ['rules'], queryFn: getRules });
  const run = useMutation({
    mutationFn: runRules,
    onSuccess: () => {
      message.success('规则引擎运行完成');
      queryClient.invalidateQueries({ queryKey: ['automation'] });
    },
  });
  const toggle = useMutation({
    mutationFn: (input: { id: string; enabled: boolean }) => toggleRule(input.id, input.enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
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

  const ruleColumns: ColumnsType<Rule> = [
    { title: '规则', dataIndex: 'ruleName', render: (v: string, r) => `${r.ruleId} ${v}` },
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      render: (v: string) => <Tag>{categoryLabel[v] ?? v}</Tag>,
    },
    { title: '触发', dataIndex: 'trigger', width: 130 },
    { title: '条件', dataIndex: 'condition', ellipsis: true },
    { title: '动作', dataIndex: 'action', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (v: boolean, r) => (
        <Switch
          size="small"
          checked={v}
          onChange={(checked) => toggle.mutate({ id: r.id, enabled: checked })}
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

  const counts = automation.data?.counts;
  const exportLogs = () => {
    const logs = automation.data?.logs ?? [];
    exportCsv(
      `自动化运行记录-${new Date().toISOString().slice(0, 10)}.csv`,
      ['规则', '状态', '耗时(ms)', '运行时间', '关联ID'],
      logs.map((l) => [`${l.ruleId} ${l.ruleName}`, l.status, l.durationMs, l.runAt, l.correlationId ?? '']),
    );
  };

  return (
    <div>
      <Typography.Title level={4}>自动化治理</Typography.Title>
      <Card>
        <Tabs
          items={[
            {
              key: 'monitor',
              label: '运行监控',
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
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
                    dataSource={automation.data?.logs ?? []}
                    columns={logColumns}
                    pagination={false}
                  />
                </>
              ),
            },
            {
              key: 'rules',
              label: `规则管理（${rules.data?.rules.length ?? 0}）`,
              children: (
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
        title={`规则详情：${detail?.ruleId ?? ''}`}
        open={detail != null}
        onClose={() => setDetail(null)}
        width={420}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="规则ID">{detail.ruleId}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.ruleName}</Descriptions.Item>
            <Descriptions.Item label="分类">{categoryLabel[detail.category] ?? detail.category}</Descriptions.Item>
            <Descriptions.Item label="状态">{detail.enabled ? '已启用' : '已停用'}</Descriptions.Item>
            <Descriptions.Item label="触发">{detail.trigger}</Descriptions.Item>
            <Descriptions.Item label="条件">{detail.condition}</Descriptions.Item>
            <Descriptions.Item label="动作">{detail.action}</Descriptions.Item>
            {detail.description && <Descriptions.Item label="说明">{detail.description}</Descriptions.Item>}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
