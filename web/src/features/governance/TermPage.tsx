import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { actTerm, getTerms, saveTerm } from '@/api/endpoints/governance';
import { Term } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';

interface TermFormValues {
  id?: string;
  title: string;
  governanceBody?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

const bodyOptions = [
  { value: '理事会', label: '理事会' },
  { value: '监事会', label: '监事会' },
  { value: '会员大会', label: '会员大会' },
  { value: '秘书处', label: '秘书处' },
];

const statusLabel: Record<string, { text: string; color: string }> = {
  preparing: { text: '筹备中', color: 'blue' },
  active: { text: '任期内', color: 'green' },
  archived: { text: '已归档', color: 'default' },
};

export function TermPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const terms = useQuery({ queryKey: ['terms'], queryFn: () => getTerms({ pageSize: 100 }) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['terms'] });

  const save = useMutation({
    mutationFn: saveTerm,
    onSuccess: () => {
      message.success('任期已保存');
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'prepare' | 'activate' | 'archive' }) =>
      actTerm(input.id, input.action),
    onSuccess: (result) => {
      message.success(`任期状态已更新（${result.status}）`);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '操作失败，请重试');
    },
  });

  const openCreate = (): void => {
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Term): void => {
    form.setFieldsValue({
      id: row.id,
      title: row.title,
      governanceBody: row.governanceBody,
      startDate: row.startDate ? dayjs(row.startDate) : undefined,
      endDate: row.endDate ? dayjs(row.endDate) : undefined,
    });
    setOpen(true);
  };

  const onFinish = (values: TermFormValues): void => {
    save.mutate({
      id: values.id,
      title: values.title,
      governanceBody: values.governanceBody ?? '',
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
    });
  };

  const columns: ColumnsType<Term> = [
    { title: '届次', dataIndex: 'title', render: (v, r) => `${v}（${r.code}）` },
    { title: '治理机构', dataIndex: 'governanceBody', width: 120 },
    {
      title: '起止',
      width: 220,
      render: (_, row) =>
        row.startDate || row.endDate ? (
          <Typography.Text>
            {row.startDate ? dayjs(row.startDate).format('YYYY-MM-DD') : '—'} ~{' '}
            {row.endDate ? dayjs(row.endDate).format('YYYY-MM-DD') : '—'}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const meta = statusLabel[v] ?? { text: v, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '操作',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          {row.status === 'preparing' && (
            <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'activate' })}>
              启动任期
            </Button>
          )}
          {row.status === 'active' && (
            <Button size="small" danger onClick={() => act.mutate({ id: row.id, action: 'archive' })}>
              归档
            </Button>
          )}
          {row.status === 'archived' && (
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'prepare' })}>
              重新筹备
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>任期管理</Typography.Title>
      <Button type="primary" style={{ marginBottom: 12 }} onClick={openCreate}>
        登记任期
      </Button>
      <Card>
        {terms.isError ? (
          <ErrorState description="任期数据加载失败" onRetry={() => void terms.refetch()} />
        ) : (
          <Table<Term>
            rowKey="id"
            size="small"
            loading={terms.isLoading}
            dataSource={terms.data?.terms ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Modal
        title="任期"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form<TermFormValues> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="届次名称" name="title" rules={[{ required: true, message: '请输入届次名称' }]}>
            <Input placeholder="如：第三届理事会（2024-2028）" />
          </Form.Item>
          <Form.Item label="治理机构" name="governanceBody" initialValue="理事会">
            <Select options={bodyOptions} />
          </Form.Item>
          <Space size={12}>
            <Form.Item label="开始日期" name="startDate">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="结束日期" name="endDate">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
