import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import type { FormInstance } from 'antd/es/form';

import { deleteMember, getMembers, saveMember } from '@/api/endpoints/membership';
import { Member } from '@/models/contract';

const roleOptions = [
  { value: 'chairman', label: '会长' },
  { value: 'secretary_general', label: '秘书长' },
  { value: 'finance_lead', label: '财务负责人' },
  { value: 'director', label: '理事' },
  { value: 'member', label: '会员' },
];

export function MembershipPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<Partial<Member>>();
  const [keyword, setKeyword] = useState('');
  const [roleId, setRoleId] = useState<string | undefined>();
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);

  const members = useQuery({
    queryKey: ['members', keyword, roleId],
    queryFn: () => getMembers({ keyword, roleId, pageSize: 100 }),
  });
  const save = useMutation({
    mutationFn: saveMember,
    onSuccess: () => {
      message.success('已保存');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
  const remove = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      message.success('已删除');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const columns: ColumnsType<Member> = [
    { title: '姓名', dataIndex: 'name', render: (v, r) => `${v}（${r.studentNo}）` },
    { title: '部门', dataIndex: 'department', width: 100 },
    { title: '职务', dataIndex: 'roleLabel', width: 110, render: (v) => <Tag>{v}</Tag> },
    { title: '手机', dataIndex: 'phone', width: 130, render: (v) => v || '—' },
    { title: '邮箱', dataIndex: 'email', render: (v) => v || '—' },
    { title: '入会时间', dataIndex: 'joinedAt', width: 110 },
    { title: '来源', dataIndex: 'syncStatus', width: 90, render: (v) => <Tag color={v === 'manual' ? 'blue' : 'default'}>{v}</Tag> },
    {
      title: '操作',
      width: 140,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditing(row);
              setOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => remove.mutate(row.id)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>成员与档案</Typography.Title>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search
          placeholder="搜索姓名/编号/部门"
          allowClear
          style={{ width: 240 }}
          onSearch={setKeyword}
        />
        <Select
          placeholder="按职务筛选"
          allowClear
          style={{ width: 160 }}
          options={roleOptions}
          onChange={(v) => setRoleId(v)}
        />
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          添加成员
        </Button>
      </Space>
      <Card>
        <Table<Member>
          rowKey="id"
          size="small"
          loading={members.isLoading}
          dataSource={members.data?.members ?? []}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      <Modal
        title={editing ? '编辑成员' : '添加成员'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <MemberForm
          key={editing?.id ?? 'new'}
          form={form}
          initial={editing}
          onFinish={(v) => save.mutate({ ...v, id: editing?.id })}
        />
      </Modal>
    </div>
  );
}

function MemberForm({
  form,
  initial,
  onFinish,
}: {
  form: FormInstance<Partial<Member>>;
  initial?: Member | null;
  onFinish: (v: Partial<Member>) => void;
}): React.JSX.Element {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial ?? { roleId: 'member', roleLabel: '会员', joinedAt: new Date().toISOString().slice(0, 10) }}
      onFinish={onFinish}
    >
      <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="会员编号" name="studentNo">
        <Input />
      </Form.Item>
      <Form.Item label="部门" name="department">
        <Input />
      </Form.Item>
      <Form.Item label="职务" name="roleId">
        <Select options={roleOptions} />
      </Form.Item>
      <Form.Item label="手机" name="phone">
        <Input />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input />
      </Form.Item>
      <Form.Item label="入会时间" name="joinedAt">
        <Input />
      </Form.Item>
    </Form>
  );
}
