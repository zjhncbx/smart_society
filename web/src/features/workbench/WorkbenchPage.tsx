import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';

import { actWorkItem, getWorkItems, refreshWorkItems } from '@/api/endpoints/workItems';
import { getPosture } from '@/api/endpoints/sensing';
import { WorkItem } from '@/models/contract';
import { usePermission } from '@/permissions/guard';
import { newCorrelationId } from '@/utils/id';

const typeColor: Record<string, string> = {
  approval: 'blue',
  auto_task: 'purple',
  project_task: 'green',
  risk: 'red',
  data_quality: 'orange',
  license: 'gold',
  term: 'cyan',
};

export function WorkbenchPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { roleName, dataScope, isAdmin } = usePermission();
  const posture = useQuery({ queryKey: ['posture'], queryFn: getPosture });
  const workItems = useQuery({
    queryKey: ['work-items', 'open'],
    queryFn: () => getWorkItems({ status: 'open', pageSize: 20 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['work-items'] });
    queryClient.invalidateQueries({ queryKey: ['posture'] });
  };

  const refresh = useMutation({
    mutationFn: refreshWorkItems,
    onSuccess: () => {
      message.success('工作项已同步');
      invalidate();
    },
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'done' | 'cancel' | 'reopen' }) =>
      actWorkItem({
        workItemId: input.id,
        action: input.action,
        correlationId: newCorrelationId(),
      }),
    onSuccess: () => invalidate(),
  });

  const columns: ColumnsType<WorkItem> = [
    {
      title: '类型',
      dataIndex: 'workItemType',
      width: 110,
      render: (v: string) => <Tag color={typeColor[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{v}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.sourceRuleId} · {row.ownerName || '未指派'}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '优先级', dataIndex: 'priority', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'SLA',
      dataIndex: 'slaDeadline',
      width: 150,
      render: (v: string, row) =>
        v ? (
          <Typography.Text type={row.escalationLevel > 0 ? 'danger' : 'secondary'}>
            {new Date(v).toLocaleDateString()}
            {row.escalationLevel > 0 ? ` · L${row.escalationLevel}` : ''}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    {
      title: '操作',
      width: 180,
      render: (_, row) => {
        const actionable = ['auto_task', 'risk', 'data_quality'].includes(row.workItemType);
        return actionable ? (
          <Space>
            <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'done' })}>
              完成
            </Button>
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'cancel' })}>
              取消
            </Button>
          </Space>
        ) : (
          <Tag>{row.workItemType === 'approval' ? '前往审批' : '项目内处理'}</Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>工作台</Typography.Title>
      <Space style={{ marginBottom: 12 }} wrap>
        <Typography.Text type="secondary">
          角色：{roleName ?? '未登录'} · 数据范围：{dataScope} · {isAdmin ? '管理员' : '普通成员'}
        </Typography.Text>
        <Link to="/search">
          <Button size="small">全域检索</Button>
        </Link>
        <Link to="/risk">
          <Button size="small">风险与预警</Button>
        </Link>
        <Link to="/data-quality">
          <Button size="small">数据治理</Button>
        </Link>
        <Link to="/automation">
          <Button size="small">自动化治理</Button>
        </Link>
        <Link to="/audit">
          <Button size="small">审计与事件</Button>
        </Link>
      </Space>

      {posture.data && posture.data.status !== '正常' && (
        <Alert
          type={posture.data.status === '需介入' ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 12 }}
          message={`组织运行：${posture.data.status}`}
          description={
            posture.data.topConcerns.length > 0
              ? posture.data.topConcerns.map((c) => c.text).join('；')
              : '暂无待关注事项'
          }
        />
      )}

      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="待处理" value={posture.data?.pendingCount ?? '—'} loading={posture.isLoading} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="风险" value={posture.data?.riskCount ?? '—'} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="预警" value={posture.data?.warningCount ?? '—'} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="数据问题" value={posture.data?.dqOpenCount ?? '—'} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="流程阻塞" value={posture.data?.escalatedCount ?? '—'} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        title="我的 WorkItem"
        extra={
          <Button size="small" loading={refresh.isPending} onClick={() => refresh.mutate()}>
            同步
          </Button>
        }
      >
        <Table<WorkItem>
          rowKey="id"
          size="small"
          loading={workItems.isLoading}
          dataSource={workItems.data?.items ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
