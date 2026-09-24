import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { actLicense, getLicenses, saveLicense } from '@/api/endpoints/governance';
import { License } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';

interface LicenseFormValues {
  id?: string;
  name: string;
  licenseNo?: string;
  issuer?: string;
  issuedAt?: Dayjs;
  expireAt?: Dayjs;
}

/** 到期列展示：剩余天数 + 阈值高亮（30 天内预警、已过期标红） */
function ExpireCell({ value }: { value: string | null }): React.JSX.Element {
  if (!value) return <Typography.Text type="secondary">长期</Typography.Text>;
  const expire = dayjs(value);
  const days = expire.diff(dayjs(), 'day');
  const label = `${expire.format('YYYY-MM-DD')}（${days < 0 ? `已过期 ${-days} 天` : `剩 ${days} 天`}）`;
  if (days < 0) return <Typography.Text type="danger">{label}</Typography.Text>;
  if (days <= 30) return <Typography.Text type="warning">{label}</Typography.Text>;
  return <Typography.Text>{label}</Typography.Text>;
}

export function LicensePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const licenses = useQuery({ queryKey: ['licenses'], queryFn: () => getLicenses({ pageSize: 100 }) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['licenses'] });

  const save = useMutation({
    mutationFn: saveLicense,
    onSuccess: () => {
      message.success('证照已保存');
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: 'renew' | 'expire' | 'reopen'; expireAt?: string }) =>
      actLicense(input.id, input.action, input.expireAt),
    onSuccess: (result) => {
      message.success(`证照状态已更新（${result.status}）`);
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

  const openEdit = (row: License): void => {
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      licenseNo: row.licenseNo,
      issuer: row.issuer,
      issuedAt: row.issuedAt ? dayjs(row.issuedAt) : undefined,
      expireAt: row.expireAt ? dayjs(row.expireAt) : undefined,
    });
    setOpen(true);
  };

  const onFinish = (values: LicenseFormValues): void => {
    save.mutate({
      id: values.id,
      name: values.name,
      licenseNo: values.licenseNo ?? '',
      issuer: values.issuer ?? '',
      issuedAt: values.issuedAt ? values.issuedAt.format('YYYY-MM-DD') : null,
      expireAt: values.expireAt ? values.expireAt.format('YYYY-MM-DD') : null,
    });
  };

  /** 续期一年：携带新到期日（act-license renew 契约支持 expireAt） */
  const renewOneYear = (row: License): void => {
    const base = row.expireAt && dayjs(row.expireAt).isAfter(dayjs()) ? dayjs(row.expireAt) : dayjs();
    act.mutate({ id: row.id, action: 'renew', expireAt: base.add(1, 'year').format('YYYY-MM-DD') });
  };

  const columns: ColumnsType<License> = [
    { title: '证照', dataIndex: 'name', render: (v, r) => `${v}（${r.code}）` },
    { title: '证号', dataIndex: 'licenseNo', width: 140 },
    { title: '发证机关', dataIndex: 'issuer', width: 130 },
    {
      title: '签发日期',
      dataIndex: 'issuedAt',
      width: 110,
      render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
    },
    { title: '到期', dataIndex: 'expireAt', width: 190, render: (v) => <ExpireCell value={v} /> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '有效' : '已过期'}</Tag>,
    },
    { title: '持证人', dataIndex: 'ownerName', width: 100 },
    {
      title: '操作',
      width: 240,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="small" type="primary" onClick={() => renewOneYear(row)}>
            续期一年
          </Button>
          {row.status === 'active' ? (
            <Button size="small" danger onClick={() => act.mutate({ id: row.id, action: 'expire' })}>
              标记过期
            </Button>
          ) : (
            <Button size="small" onClick={() => act.mutate({ id: row.id, action: 'reopen' })}>
              重新启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>证照管理</Typography.Title>
      <Button type="primary" style={{ marginBottom: 12 }} onClick={openCreate}>
        登记证照
      </Button>
      <Card>
        {licenses.isError ? (
          <ErrorState description="证照数据加载失败" onRetry={() => void licenses.refetch()} />
        ) : (
          <Table<License>
            rowKey="id"
            size="small"
            loading={licenses.isLoading}
            dataSource={licenses.data?.licenses ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Modal
        title="证照"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form<LicenseFormValues> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="证照名称" name="name" rules={[{ required: true, message: '请输入证照名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="证照编号" name="licenseNo">
            <Input />
          </Form.Item>
          <Form.Item label="发证机关" name="issuer">
            <Input />
          </Form.Item>
          <Space size={12}>
            <Form.Item label="签发日期" name="issuedAt">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="到期日期" name="expireAt">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
