import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';

import { deleteNotice, getNotices, upsertNotice } from '@/api/endpoints/notice';
import { NoticeItem } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';

interface NoticeFormValues {
  id?: string;
  title: string;
  content: string;
  publisher: string;
  isImportant: boolean;
}

export function NoticePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<NoticeItem | null>(null);
  // 列表接口已按 publishTime 倒序返回（新公告在前）
  const notices = useQuery({ queryKey: ['notices'], queryFn: getNotices });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notices'] });

  const save = useMutation({
    mutationFn: upsertNotice,
    onSuccess: () => {
      message.success('公告已发布');
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '发布失败，请重试');
    },
  });
  const remove = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      message.success('公告已删除');
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '删除失败，请重试');
    },
  });

  const openCreate = (): void => {
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: NoticeItem): void => {
    form.setFieldsValue({
      id: row.id,
      title: row.title,
      content: row.content,
      publisher: row.publisher,
      isImportant: row.isImportant,
    });
    setOpen(true);
  };

  const onFinish = (values: NoticeFormValues): void => {
    save.mutate({
      id: values.id,
      title: values.title,
      content: values.content,
      publisher: values.publisher,
      publishTime: new Date().toISOString(),
      isImportant: values.isImportant,
    });
  };

  const confirmDelete = (row: NoticeItem): void => {
    Modal.confirm({
      title: '确认删除公告？',
      content: `「${row.title}」删除后不可恢复。`,
      okType: 'danger',
      onOk: () => remove.mutate(row.id),
    });
  };

  const columns: ColumnsType<NoticeItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, row) => (
        <Space>
          {row.isImportant && <Tag color="red">重要</Tag>}
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setDetail(row)}>
            {v}
          </Button>
        </Space>
      ),
    },
    { title: '发布方', dataIndex: 'publisher', width: 110 },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 150,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="small" danger onClick={() => confirmDelete(row)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="通知公告"
      description="面向组织成员的公告发布与浏览"
      extra={
        <Button type="primary" onClick={openCreate}>
          发布公告
        </Button>
      }
    >
      <Card>
        {notices.isError ? (
          <ErrorState description="公告加载失败" onRetry={() => void notices.refetch()} />
        ) : (
          <Table<NoticeItem>
            rowKey="id"
            size="small"
            loading={notices.isLoading}
            dataSource={notices.data ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Modal
        title={form.getFieldValue('id') ? '编辑公告' : '发布公告'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form<NoticeFormValues> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入公告标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="正文" name="content" rules={[{ required: true, message: '请输入公告正文' }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item label="发布方" name="publisher" initialValue="秘书处">
            <Input />
          </Form.Item>
          <Form.Item label="标记为重要公告" name="isImportant" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          <Space>
            {detail?.isImportant && <Tag color="red">重要</Tag>}
            {detail?.title}
          </Space>
        }
        open={detail != null}
        onCancel={() => setDetail(null)}
        footer={null}
      >
        {detail && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              {detail.publisher} · {dayjs(detail.publishTime).format('YYYY-MM-DD HH:mm')}
            </Typography.Text>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {detail.content}
            </Typography.Paragraph>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
}
