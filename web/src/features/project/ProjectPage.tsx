import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import { getProjects, saveProject, transitionProject } from '@/api/endpoints/project';
import { Project } from '@/models/contract';

const statusColor: Record<number, string> = { 0: 'default', 1: 'blue', 2: 'orange', 3: 'green' };

export function ProjectPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => getProjects({ pageSize: 100 }) });
  const save = useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      message.success('项目已保存');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const transition = useMutation({
    mutationFn: (input: { id: string; action: 'start' | 'pause' | 'resume' | 'complete' }) =>
      transitionProject(input.id, input.action),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const columns: ColumnsType<Project> = [
    { title: '项目', dataIndex: 'name', render: (v, r) => `${v}（${r.id}）` },
    { title: '负责人', dataIndex: 'managerName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number, r) => <Tag color={statusColor[v]}>{r.statusLabel}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 160,
      render: (v: number) => <Progress percent={v} size="small" />,
    },
    { title: '预算', dataIndex: 'budget', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '任务', width: 90, render: (_, r) => `${r.doneTaskCount}/${r.taskCount}` },
    {
      title: '操作',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setOpen(true)}>
            编辑
          </Button>
          {row.status === 0 && (
            <Button size="small" type="primary" onClick={() => transition.mutate({ id: row.id, action: 'start' })}>
              启动
            </Button>
          )}
          {row.status === 1 && (
            <>
              <Button size="small" onClick={() => transition.mutate({ id: row.id, action: 'pause' })}>
                暂停
              </Button>
              <Button size="small" onClick={() => transition.mutate({ id: row.id, action: 'complete' })}>
                完成
              </Button>
            </>
          )}
          {row.status === 2 && (
            <Button size="small" type="primary" onClick={() => transition.mutate({ id: row.id, action: 'resume' })}>
              恢复
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>项目与任务</Typography.Title>
      <Button
        type="primary"
        style={{ marginBottom: 12 }}
        onClick={() => {
          form.resetFields();
          setOpen(true);
        }}
      >
        创建项目
      </Button>
      <Card>
        <Table<Project>
          rowKey="id"
          size="small"
          loading={projects.isLoading}
          dataSource={projects.data?.projects ?? []}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      <Modal
        title="项目"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 0, progress: 0, budget: 0 }}
          onFinish={(v) => save.mutate(v)}
        >
          <Form.Item label="项目名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="负责人ID" name="managerId">
            <Input placeholder="成员ID" />
          </Form.Item>
          <Space size={12}>
            <Form.Item label="预算" name="budget">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="开始日期" name="startDate">
              <Input placeholder="2026-01-01" />
            </Form.Item>
            <Form.Item label="结束日期" name="endDate">
              <Input placeholder="2026-12-31" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
