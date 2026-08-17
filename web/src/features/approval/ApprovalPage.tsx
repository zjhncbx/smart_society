import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import {
  actApproval,
  actResolution,
  getApprovals,
  getResolutions,
  saveResolution,
} from '@/api/endpoints/approval';
import { ApprovalInstance, Resolution } from '@/models/contract';

const resolutionStatus: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待执行' },
  executing: { color: 'blue', label: '执行中' },
  done: { color: 'green', label: '已完成' },
  overdue: { color: 'red', label: '逾期' },
};

export function ApprovalPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const approvals = useQuery({ queryKey: ['approvals'], queryFn: getApprovals });
  const resolutions = useQuery({ queryKey: ['resolutions'], queryFn: getResolutions });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject' | 'done'; comment?: string }) =>
      actApproval(input.id, input.action, input.comment ?? ''),
    onSuccess: () => {
      message.success('已处理');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
  const saveRes = useMutation({
    mutationFn: saveResolution,
    onSuccess: () => {
      message.success('决议已创建');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
    },
  });
  const actRes = useMutation({
    mutationFn: (input: { id: string; action: 'start' | 'done' | 'reopen' }) =>
      actResolution(input.id, input.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
    },
  });

  const approvalColumns: ColumnsType<ApprovalInstance> = [
    { title: '标题', dataIndex: 'title', render: (v, r) => `${v}（${r.flowName}）` },
    { title: '当前节点', dataIndex: 'nodeName', width: 150 },
    { title: '发起人', dataIndex: 'createdByName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={v === 'running' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '操作',
      width: 200,
      render: (_, row) =>
        row.canAct ? (
          <Space>
            <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'approve' })}>
              通过
            </Button>
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'reject' })}>
              驳回
            </Button>
            {row.currentNode === 'done' && (
              <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'done' })}>
                办理完成
              </Button>
            )}
          </Space>
        ) : (
          '—'
        ),
    },
  ];

  const resolutionColumns: ColumnsType<Resolution> = [
    { title: '决议', dataIndex: 'title', render: (v, r) => `${v}（${r.id}）` },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '责任人', dataIndex: 'responsibleName', width: 100 },
    { title: '期限', dataIndex: 'deadline', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const s = resolutionStatus[v] ?? { color: 'default', label: v };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_, row) => (
        <Space>
          {row.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => actRes.mutate({ id: row.id, action: 'start' })}>
              开始执行
            </Button>
          )}
          {row.status === 'executing' && (
            <Button size="small" onClick={() => actRes.mutate({ id: row.id, action: 'done' })}>
              完成
            </Button>
          )}
          {row.status === 'done' && (
            <Button size="small" onClick={() => actRes.mutate({ id: row.id, action: 'reopen' })}>
              重开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>审批与决议</Typography.Title>
      <Card>
        <Tabs
          items={[
            {
              key: 'approval',
              label: `审批（${approvals.data?.approvals.length ?? 0}）`,
              children: (
                <Table<ApprovalInstance>
                  rowKey="id"
                  size="small"
                  loading={approvals.isLoading}
                  dataSource={approvals.data?.approvals ?? []}
                  columns={approvalColumns}
                  pagination={false}
                />
              ),
            },
            {
              key: 'resolution',
              label: `决议（${resolutions.data?.resolutions.length ?? 0}）`,
              children: (
                <>
                  <Button type="primary" style={{ marginBottom: 12 }} onClick={() => setOpen(true)}>
                    创建决议
                  </Button>
                  <Table<Resolution>
                    rowKey="id"
                    size="small"
                    loading={resolutions.isLoading}
                    dataSource={resolutions.data?.resolutions ?? []}
                    columns={resolutionColumns}
                    pagination={false}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="创建决议"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveRes.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => saveRes.mutate(v)}
        >
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="责任人" name="responsibleName">
            <Input />
          </Form.Item>
          <Form.Item label="期限" name="deadline">
            <Input placeholder="2026-12-31" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
