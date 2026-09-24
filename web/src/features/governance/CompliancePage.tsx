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

import { actComplianceItem, getComplianceItems, saveComplianceItem } from '@/api/endpoints/governance';
import { getMembers } from '@/api/endpoints/membership';
import { ComplianceItem } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';
import { MemberSelect } from '@/components/MemberSelect';

interface ComplianceFormValues {
  id?: string;
  name: string;
  itemType?: string;
  deadline?: Dayjs;
  responsibleMemberId?: string;
}

const itemTypeOptions = [
  { value: 'report', label: '报告报送' },
  { value: 'inspection', label: '年检/检查' },
  { value: 'tax', label: '税务' },
  { value: 'audit', label: '审计' },
  { value: 'other', label: '其他' },
];

const statusLabel: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'default' },
  executing: { text: '进行中', color: 'blue' },
  done: { text: '已完成', color: 'green' },
};

/** 截止列展示：日期 + 逾期高亮（未完成且已过截止日） */
function DeadlineCell({ row }: { row: ComplianceItem }): React.JSX.Element {
  if (!row.deadline) return <Typography.Text type="secondary">无截止</Typography.Text>;
  const deadline = dayjs(row.deadline);
  const overdueDays = deadline.diff(dayjs(), 'day');
  const label = deadline.format('YYYY-MM-DD');
  if (row.status !== 'done' && overdueDays < 0) {
    return <Typography.Text type="danger">{label}（已逾期 {-overdueDays} 天）</Typography.Text>;
  }
  if (row.status !== 'done' && overdueDays <= 14) {
    return <Typography.Text type="warning">{label}（剩 {overdueDays} 天）</Typography.Text>;
  }
  return <Typography.Text>{label}</Typography.Text>;
}

export function CompliancePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const items = useQuery({ queryKey: ['compliance-items'], queryFn: () => getComplianceItems({ pageSize: 100 }) });
  /** 与 MemberSelect 共享 queryKey，用于责任人 id → 姓名回填 */
  const memberOptions = useQuery({
    queryKey: ['members', 'select-options'],
    queryFn: () => getMembers({ pageSize: 200 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['compliance-items'] });

  const save = useMutation({
    mutationFn: saveComplianceItem,
    onSuccess: () => {
      message.success('合规事项已保存');
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'start' | 'done' | 'reopen' }) =>
      actComplianceItem(input.id, input.action),
    onSuccess: (result) => {
      message.success(`事项状态已更新（${result.status}）`);
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

  const openEdit = (row: ComplianceItem): void => {
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      itemType: row.itemType,
      deadline: row.deadline ? dayjs(row.deadline) : undefined,
      responsibleMemberId: row.responsibleMemberId || undefined,
    });
    setOpen(true);
  };

  const onFinish = (values: ComplianceFormValues): void => {
    const member = memberOptions.data?.members.find((m) => m.id === values.responsibleMemberId);
    save.mutate({
      id: values.id,
      name: values.name,
      itemType: values.itemType ?? 'other',
      deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
      responsibleMemberId: values.responsibleMemberId ?? '',
      responsibleName: member?.name ?? '',
    });
  };

  const columns: ColumnsType<ComplianceItem> = [
    { title: '事项', dataIndex: 'name', render: (v, r) => `${v}（${r.code}）` },
    {
      title: '类型',
      dataIndex: 'itemType',
      width: 110,
      render: (v: string) => (
        <Tag>{itemTypeOptions.find((o) => o.value === v)?.label ?? v}</Tag>
      ),
    },
    { title: '截止', dataIndex: 'deadline', width: 190, render: (_, row) => <DeadlineCell row={row} /> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const meta = statusLabel[v] ?? { text: v, color: 'default' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    { title: '责任人', dataIndex: 'responsibleName', width: 110 },
    {
      title: '操作',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          {row.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'start' })}>
              开始
            </Button>
          )}
          {row.status === 'executing' && (
            <Button size="small" type="primary" onClick={() => act.mutate({ id: row.id, action: 'done' })}>
              完成
            </Button>
          )}
          {row.status === 'done' && (
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'reopen' })}>
              重开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>合规事项</Typography.Title>
      <Button type="primary" style={{ marginBottom: 12 }} onClick={openCreate}>
        登记合规事项
      </Button>
      <Card>
        {items.isError ? (
          <ErrorState description="合规事项加载失败" onRetry={() => void items.refetch()} />
        ) : (
          <Table<ComplianceItem>
            rowKey="id"
            size="small"
            loading={items.isLoading}
            dataSource={items.data?.items ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Modal
        title="合规事项"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form<ComplianceFormValues> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="事项名称" name="name" rules={[{ required: true, message: '请输入事项名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="itemType" initialValue="other">
            <Select options={itemTypeOptions} />
          </Form.Item>
          <Form.Item label="截止日期" name="deadline">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="责任人" name="responsibleMemberId">
            <MemberSelect allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
