import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
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
  getOrganization,
  saveOrganization,
  setRelationship,
} from '@/api/endpoints/organization';
import { OrganizationRelationship } from '@/models/contract';

export function OrganizationPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const org = useQuery({ queryKey: ['organization'], queryFn: getOrganization });
  const [form] = Form.useForm();
  const [relForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [relOpen, setRelOpen] = useState(false);

  const save = useMutation({
    mutationFn: saveOrganization,
    onSuccess: () => {
      message.success('组织资料已保存');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
  const setRel = useMutation({
    mutationFn: setRelationship,
    onSuccess: () => {
      message.success('组织关系已更新');
      setRelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const columns: ColumnsType<OrganizationRelationship> = [
    { title: '关联组织', dataIndex: 'relatedName', render: (v, r) => `${v}（${r.relatedOrgId}）` },
    { title: '关系', dataIndex: 'relType', width: 90, render: (v) => <Tag>{v === 'child' ? '子组织' : '合作'}</Tag> },
    { title: '共享成员', dataIndex: 'shareMembers', width: 90, render: (v) => (v ? '✓' : '—') },
    { title: '共享活动', dataIndex: 'shareActivities', width: 90, render: (v) => (v ? '✓' : '—') },
    { title: '共享公告', dataIndex: 'shareNotices', width: 90, render: (v) => (v ? '✓' : '—') },
  ];

  const profile = org.data?.profile;
  return (
    <div>
      <Typography.Title level={4}>组织治理</Typography.Title>
      <Card
        title="组织档案"
        loading={org.isLoading}
        extra={<Button onClick={() => setEditOpen(true)}>编辑</Button>}
      >
        {profile && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="名称">{profile.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{profile.orgType}</Descriptions.Item>
            <Descriptions.Item label="统一社会信用代码">{profile.creditCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="状态">{profile.status}</Descriptions.Item>
            <Descriptions.Item label="简介" span={2}>
              {profile.description || '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        style={{ marginTop: 16 }}
        title="组织关系"
        extra={<Button onClick={() => setRelOpen(true)}>新增关系</Button>}
      >
        <Table<OrganizationRelationship>
          rowKey="relId"
          size="small"
          loading={org.isLoading}
          dataSource={org.data?.relationships ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Modal
        title="编辑组织资料"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <EditOrgForm initial={profile} onFinish={(v) => save.mutate(v)} />
      </Modal>
      <Modal
        title="新增组织关系"
        open={relOpen}
        onCancel={() => setRelOpen(false)}
        onOk={() => relForm.submit()}
        confirmLoading={setRel.isPending}
        destroyOnClose
      >
        <RelForm onFinish={(v) => setRel.mutate(v)} />
      </Modal>
    </div>
  );
}

function EditOrgForm({
  initial,
  onFinish,
}: {
  initial?: { name: string; description: string };
  onFinish: (v: { name: string; description: string }) => void;
}): React.JSX.Element {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ name: initial?.name, description: initial?.description }}
      onFinish={onFinish}
    >
      <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="简介" name="description">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

function RelForm({
  onFinish,
}: {
  onFinish: (v: {
    relatedOrgId: string;
    relType: 'child' | 'partner';
    shareMembers?: boolean;
    shareActivities?: boolean;
    shareNotices?: boolean;
  }) => void;
}): React.JSX.Element {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={{ relType: 'child' }} onFinish={onFinish}>
      <Form.Item label="关联组织ID" name="relatedOrgId" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="关系类型" name="relType">
        <Select
          options={[
            { value: 'child', label: '子组织' },
            { value: 'partner', label: '合作组织' },
          ]}
        />
      </Form.Item>
      <Space size={16}>
        <Form.Item label="共享成员" name="shareMembers" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="共享活动" name="shareActivities" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="共享公告" name="shareNotices" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Space>
    </Form>
  );
}
