import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import {
  getApprovalFlows,
  parseFlowNodes,
  saveApprovalFlow,
  SaveApprovalFlowPayload,
} from '@/api/endpoints/financeExt';
import { ApprovalFlowNode } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';

const nodeTypeOptions = [
  { value: 'approve', label: '审批' },
  { value: 'handle', label: '办理' },
  { value: 'cc', label: '抄送' },
];

const roleOptions = [
  { value: 'org_admin', label: '组织管理员' },
  { value: 'chairman', label: '会长' },
  { value: 'secretary_general', label: '秘书长' },
  { value: 'finance_lead', label: '财务负责人' },
  { value: 'director', label: '理事' },
  { value: 'supervisor', label: '监事' },
];

const typeColor: Record<string, string> = { approve: 'blue', handle: 'green', cc: 'orange' };
const typeText: Record<string, string> = { approve: '审批', handle: '办理', cc: '抄送' };

interface FlowRow {
  id: string;
  name: string;
  bizType: string;
  nodes: string;
  enabled: boolean;
  isDefault: boolean;
}

export function FlowConfigPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SaveApprovalFlowPayload | null>(null);
  const flows = useQuery({ queryKey: ['approval-flows'], queryFn: () => getApprovalFlows({ bizType: 'finance' }) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['approval-flows'] });

  const save = useMutation({
    mutationFn: saveApprovalFlow,
    onSuccess: (result) => {
      message.success(`审批流已保存（${result.flowId}）`);
      setEditing(null);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });

  const openCreate = (): void => {
    setEditing({
      name: '',
      bizType: 'finance',
      enabled: true,
      isDefault: false,
      nodes: [{ id: `n_${Date.now()}`, name: '财务初审', type: 'approve', roleIds: ['finance_lead'] }],
    });
  };

  const openEdit = (row: FlowRow): void => {
    setEditing({
      id: row.id,
      name: row.name,
      bizType: 'finance',
      enabled: row.enabled,
      isDefault: row.isDefault,
      nodes: parseFlowNodes(row.nodes),
    });
  };

  const updateNode = (index: number, patch: Partial<ApprovalFlowNode>): void => {
    if (!editing) return;
    const nodes = editing.nodes.map((n, i) => (i === index ? { ...n, ...patch } : n));
    setEditing({ ...editing, nodes });
  };

  const columns: ColumnsType<FlowRow> = [
    { title: '流程名称', dataIndex: 'name' },
    { title: '业务类型', dataIndex: 'bizType', width: 100, render: (v: string) => <Tag>{v === 'finance' ? '财务' : v}</Tag> },
    {
      title: '节点',
      dataIndex: 'nodes',
      render: (v: string) => {
        const nodes = parseFlowNodes(v);
        return (
          <Space wrap size={4}>
            {nodes.length === 0 ? (
              <Typography.Text type="secondary">无节点</Typography.Text>
            ) : (
              nodes.map((n, i) => (
                <Tag key={`${n.id}-${i}`} color={typeColor[n.type] ?? 'default'}>
                  {i + 1}. {n.name}（{typeText[n.type] ?? n.type}）
                </Tag>
              ))
            )}
          </Space>
        );
      },
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      width: 70,
      render: (v: boolean) => (v ? <Tag color="green">默认</Tag> : <Tag>—</Tag>),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      render: (v: boolean) => (v ? <Tag color="blue">启用</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      width: 120,
      render: (_, row) => (
        <Button size="small" onClick={() => openEdit(row)}>
          编辑节点
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="审批流配置"
      description="财务单据审批流（审批 / 办理 / 抄送节点）"
      extra={
        <Button type="primary" onClick={openCreate}>
          新建审批流
        </Button>
      }
    >
      <Card>
        {flows.isError ? (
          <ErrorState description="审批流加载失败" onRetry={() => void flows.refetch()} />
        ) : (
          <Table<FlowRow>
            rowKey="id"
            size="small"
            loading={flows.isLoading}
            dataSource={flows.data?.flows ?? []}
            columns={columns}
            pagination={false}
          />
        )}
      </Card>
      <Drawer
        title={editing?.id ? '编辑审批流' : '新建审批流'}
        open={editing != null}
        onClose={() => setEditing(null)}
        width={520}
        destroyOnHidden
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button type="primary" loading={save.isPending} onClick={() => editing && save.mutate(editing)}>
              保存
            </Button>
          </Space>
        }
      >
        {editing && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="流程名称" required>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="如：财务报销默认审批流"
                />
              </Form.Item>
              <Space size={24}>
                <Form.Item label="启用" style={{ marginBottom: 0 }}>
                  <Switch
                    checked={editing.enabled}
                    onChange={(v) => setEditing({ ...editing, enabled: v })}
                  />
                </Form.Item>
                <Form.Item label="设为默认流程" style={{ marginBottom: 0 }}>
                  <Switch
                    checked={editing.isDefault}
                    onChange={(v) => setEditing({ ...editing, isDefault: v })}
                  />
                </Form.Item>
              </Space>
            </Form>
            <Typography.Text strong>流程节点（按顺序执行）</Typography.Text>
            {editing.nodes.map((node, index) => (
              <Card key={node.id} size="small" title={`节点 ${index + 1}`} extra={
                <Button
                  size="small"
                  danger
                  onClick={() => setEditing({ ...editing, nodes: editing.nodes.filter((_, i) => i !== index) })}
                >
                  删除
                </Button>
              }>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Input
                    value={node.name}
                    onChange={(e) => updateNode(index, { name: e.target.value })}
                    placeholder="节点名称"
                  />
                  <Select
                    value={node.type}
                    onChange={(v) => updateNode(index, { type: v })}
                    options={nodeTypeOptions}
                    style={{ width: '100%' }}
                  />
                  <Select
                    mode="multiple"
                    value={node.roleIds ?? []}
                    onChange={(v) => updateNode(index, { roleIds: v })}
                    options={roleOptions}
                    placeholder="参与角色"
                    style={{ width: '100%' }}
                  />
                </Space>
              </Card>
            ))}
            {editing.nodes.length === 0 && <Empty description="至少需要一个节点" />}
            <Button
              block
              type="dashed"
              onClick={() =>
                setEditing({
                  ...editing,
                  nodes: [
                    ...editing.nodes,
                    { id: `n_${Date.now()}`, name: '', type: 'approve', roleIds: [] },
                  ],
                })
              }
            >
              添加节点
            </Button>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}
