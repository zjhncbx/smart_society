import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import dayjs from 'dayjs';

import {
  getFinanceRecords,
  getFinanceStats,
  submitFinanceRecord,
} from '@/api/endpoints/finance';
import { FinanceRecord } from '@/models/contract';

const statusColor: Record<string, string> = {
  approved: 'green',
  approving: 'gold',
  rejected: 'red',
};

export function FinancePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const records = useQuery({ queryKey: ['finance-records'], queryFn: () => getFinanceRecords({ pageSize: 100 }) });
  const stats = useQuery({ queryKey: ['finance-stats'], queryFn: getFinanceStats });
  const submit = useMutation({
    mutationFn: submitFinanceRecord,
    onSuccess: () => {
      message.success('单据已提交并进入审批');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });

  const columns: ColumnsType<FinanceRecord> = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'income' ? 'green' : v === 'expense' ? 'red' : 'blue'}>
          {v === 'income' ? '收入' : v === 'expense' ? '支出' : '凭证'}
        </Tag>
      ),
    },
    { title: '摘要', dataIndex: 'summary', render: (v, r) => `${v}（${r.categoryLabel}）` },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: number, r) => `${r.type === 'income' ? '+' : '-'}¥${v.toLocaleString()}` },
    { title: '往来方', dataIndex: 'counterparty', width: 130, render: (v) => v || '—' },
    { title: '日期', dataIndex: 'date', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>,
    },
    { title: '经办人', dataIndex: 'createdByName', width: 90 },
  ];

  return (
    <div>
      <Typography.Title level={4}>财务管理</Typography.Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="收入" value={stats.data?.income ?? '—'} prefix="¥" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="支出" value={stats.data?.expense ?? '—'} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="结余" value={stats.data?.balance ?? '—'} prefix="¥" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Button type="primary" onClick={() => setOpen(true)}>
              提交单据
            </Button>
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="单据列表">
        <Table<FinanceRecord>
          rowKey="id"
          size="small"
          loading={records.isLoading}
          dataSource={records.data?.records ?? []}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      <Modal
        title="提交财务单据"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submit.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'expense', date: dayjs() }}
          onFinish={(v) =>
            submit.mutate({
              type: v.type,
              amount: Number(v.amount ?? 0),
              categoryLabel: v.categoryLabel ?? '',
              summary: v.summary ?? '',
              counterparty: v.counterparty,
              projectId: v.projectId,
              date: (v.date as dayjs.Dayjs).format('YYYY-MM-DD'),
            })
          }
        >
          <Form.Item label="类型" name="type">
            <Select
              options={[
                { value: 'income', label: '收入' },
                { value: 'expense', label: '支出' },
                { value: 'voucher', label: '记账凭证' },
              ]}
            />
          </Form.Item>
          <Form.Item label="金额" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="科目" name="categoryLabel">
            <Input />
          </Form.Item>
          <Form.Item label="摘要" name="summary" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="往来方" name="counterparty">
            <Input />
          </Form.Item>
          <Form.Item label="关联项目ID" name="projectId">
            <Input />
          </Form.Item>
          <Form.Item label="日期" name="date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
