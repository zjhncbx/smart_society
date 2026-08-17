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
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  FormInstance,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';

import {
  DOMAIN_LABELS,
  DocumentItem,
  commitFileUpload,
  deleteDocument,
  getDocumentFile,
  initFileUpload,
  listDocuments,
  saveBase64File,
} from '@/api/endpoints/documents';

const DOMAIN_OPTIONS = Object.entries(DOMAIN_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm] = Form.useForm();

  const docs = useQuery({
    queryKey: ['documents', { domain, status, keyword, onlyMine, page, pageSize }],
    queryFn: () =>
      listDocuments({
        domain: domain || undefined,
        status: status || undefined,
        keyword: keyword || undefined,
        onlyMine: onlyMine || undefined,
        page,
        pageSize,
      }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const download = useMutation({
    mutationFn: getDocumentFile,
    onSuccess: (file) => {
      saveBase64File(file);
      message.success(`已开始下载：${file.fileName || file.name}`);
      invalidate();
    },
    onError: (err: Error) => {
      message.error(`下载失败：${err.message}`);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      message.success('文件已删除（软删，审计保留）');
      invalidate();
    },
    onError: (err: Error) => {
      message.error(`删除失败：${err.message}`);
    },
  });

  const columns: ColumnsType<DocumentItem> = [
    {
      title: '文件',
      dataIndex: 'name',
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{v}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.fileName} · {r.code}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'domain',
      width: 110,
      render: (v: keyof typeof DOMAIN_LABELS) => <Tag>{DOMAIN_LABELS[v] ?? v}</Tag>,
    },
    { title: '大小', dataIndex: 'size', width: 90, render: formatSize },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: DocumentItem['status']) => (
        <Tag color={v === 'active' ? 'green' : v === 'uploading' ? 'blue' : v === 'deleted' ? 'default' : 'red'}>
          {v === 'active' ? '已就绪' : v === 'uploading' ? '上传中' : v === 'deleted' ? '已删除' : '失败'}
        </Tag>
      ),
    },
    { title: '上传人', dataIndex: 'ownerName', width: 110 },
    { title: '下载', dataIndex: 'downloadCount', width: 70 },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            disabled={r.status !== 'active'}
            loading={download.isPending && download.variables === r.id}
            onClick={() => download.mutate(r.id)}
          >
            下载
          </Button>
          <Popconfirm
            title="确认删除该文件？"
            description="文件将被软删，审计日志保留操作记录。"
            onConfirm={() => remove.mutate(r.id)}
          >
            <Button size="small" danger disabled={r.status === 'deleted'}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const items = docs.data?.items ?? [];
  return (
    <div>
      <Typography.Title level={4}>文件中心</Typography.Title>
      <Card
        title="组织文件（Cloud Storage）"
        extra={
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
            上传文件
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="全部分类"
            style={{ width: 140 }}
            options={DOMAIN_OPTIONS}
            value={domain || undefined}
            onChange={(v) => {
              setDomain(v ?? '');
              setPage(0);
            }}
          />
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 120 }}
            options={[
              { value: 'active', label: '已就绪' },
              { value: 'uploading', label: '上传中' },
              { value: 'failed', label: '失败' },
            ]}
            value={status || undefined}
            onChange={(v) => {
              setStatus(v ?? '');
              setPage(0);
            }}
          />
          <Input.Search
            allowClear
            placeholder="按名称搜索"
            style={{ width: 200 }}
            onSearch={(v) => {
              setKeyword(v.trim());
              setPage(0);
            }}
          />
          <Space>
            <Typography.Text>只看我的</Typography.Text>
            <Switch
              checked={onlyMine}
              onChange={(v) => {
                setOnlyMine(v);
                setPage(0);
              }}
            />
          </Space>
          <Typography.Text type="secondary">
            数据范围：{docs.data?.dataScope ?? '…'} · 共 {docs.data?.total ?? 0} 个
          </Typography.Text>
        </Space>
        <Table<DocumentItem>
          rowKey="id"
          size="small"
          loading={docs.isLoading}
          dataSource={items}
          columns={columns}
          pagination={{
            current: page + 1,
            pageSize,
            total: docs.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p - 1);
              setPageSize(ps);
            },
          }}
        />
      </Card>
      <UploadModal
        open={uploadOpen}
        form={uploadForm}
        onClose={() => setUploadOpen(false)}
        onDone={() => {
          setUploadOpen(false);
          uploadForm.resetFields();
          invalidate();
        }}
      />
    </div>
  );
}

function UploadModal({
  open,
  form,
  onClose,
  onDone,
}: {
  open: boolean;
  form: FormInstance;
  onClose: () => void;
  onDone: () => void;
}): React.JSX.Element {
  const [file, setFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (values: { name: string; domain: string }) => {
    if (!file) {
      message.warning('请先选择文件');
      return;
    }
    setBusy(true);
    try {
      const init = await initFileUpload({
        name: values.name.trim() || file.name,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.base64.length,
        domain: values.domain as 'attachment',
      });
      await commitFileUpload({
        documentId: init.documentId,
        mode: 'proxy',
        contentBase64: file.base64,
        correlationId: init.correlationId,
      });
      message.success(`上传成功：${file.name}`);
      setFile(null);
      onDone();
    } catch (err) {
      message.error(`上传失败：${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="上传文件（Web 走代理上传，≤5MB）"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={busy}
      okText="上传"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => void submit(v as { name: string; domain: string })}
        initialValues={{ domain: 'attachment' }}
      >
        <Form.Item name="name" label="文件名称" rules={[{ required: true, message: '请输入文件名称' }]}>
          <Input placeholder="默认使用原文件名" />
        </Form.Item>
        <Form.Item name="domain" label="分类" rules={[{ required: true }]}>
          <Select options={DOMAIN_OPTIONS} />
        </Form.Item>
        <Upload
          maxCount={1}
          beforeUpload={(f) => {
            if (f.size > 5 * 1024 * 1024) {
              message.error('文件超过 5MB，代理上传不支持');
              return Upload.LIST_IGNORE;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = String(reader.result ?? '').split(',')[1] ?? '';
              setFile({ name: f.name, type: f.type, base64 });
            };
            reader.readAsDataURL(f);
            return false;
          }}
          onRemove={() => {
            setFile(null);
            return true;
          }}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        {file && (
          <Typography.Text type="secondary">
            已选择：{file.name}（{formatSize(file.base64.length)}）
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
