import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { ReactNode, useEffect, useState } from 'react';

import {
  getOrgSettings,
  getRoles,
  getUserSettings,
  saveOrgSettings,
  saveRole,
  saveUserSettings,
} from '@/api/endpoints/settings';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { RoleDef } from '@/models/contract';
import { usePermission } from '@/permissions/guard';

/** 可自定义显示名的内置角色（与云函数 get-roles BUILTIN_NAMES 对齐） */
const ROLE_LABEL_KEYS = [
  'chairman',
  'secretary_general',
  'finance_lead',
  'director',
  'supervisor',
] as const;

const ROLE_LABEL_NAMES: Record<string, string> = {
  chairman: '会长',
  secretary_general: '秘书长',
  finance_lead: '财务负责人',
  director: '理事',
  supervisor: '监事',
};

const THEME_OPTIONS = ['经典蓝', '活力橙', '墨绿', '暖紫'].map((label, index) => ({
  value: index,
  label: `${index} · ${label}`,
}));

const DATA_SCOPE_OPTIONS = [
  { value: 'org', label: '全组织' },
  { value: 'dept', label: '本部门' },
  { value: 'self', label: '仅本人' },
];

function QueryBoundary({
  isLoading,
  isError,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }
  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }
  return <>{children}</>;
}

/** 分区一：组织设置（主题 / 角色显示名 / 钉钉接入，仅 admin） */
function OrgSettingsTab(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['org-settings'],
    queryFn: getOrgSettings,
  });
  const saveMutation = useMutation({
    mutationFn: saveOrgSettings,
    onSuccess: () => {
      message.success('组织设置已保存');
      void queryClient.invalidateQueries({ queryKey: ['org-settings'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });

  useEffect(() => {
    if (!data) return;
    const labels: Record<string, string> = {};
    for (const key of ROLE_LABEL_KEYS) {
      labels[`label_${key}`] = data.roleLabels[key] ?? ROLE_LABEL_NAMES[key] ?? key;
    }
    form.setFieldsValue({
      themeIndex: data.themeIndex,
      dingtalkClientId: data.dingtalk.clientId ?? '',
      dingtalkClientSecret: data.dingtalk.clientSecret ?? '',
      ...labels,
    });
  }, [data, form]);

  const onFinish = (values: Record<string, unknown>): void => {
    const roleLabels: Record<string, string> = {};
    for (const key of ROLE_LABEL_KEYS) {
      roleLabels[key] = String(values[`label_${key}`] ?? ROLE_LABEL_NAMES[key] ?? key);
    }
    saveMutation.mutate({
      themeIndex: Number(values.themeIndex ?? 0),
      roleLabels,
      dingtalkClientId: String(values.dingtalkClientId ?? ''),
      dingtalkClientSecret: String(values.dingtalkClientSecret ?? ''),
    });
  };

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
      {data && (
        <Form layout="vertical" style={{ maxWidth: 520 }} form={form} onFinish={onFinish}>
          <Form.Item label="界面主题" name="themeIndex" rules={[{ required: true }]}>
            <Select options={THEME_OPTIONS} />
          </Form.Item>
          {ROLE_LABEL_KEYS.map((key) => (
            <Form.Item
              key={key}
              label={`${ROLE_LABEL_NAMES[key]}显示名`}
              name={`label_${key}`}
              rules={[{ required: true, message: '请输入角色显示名' }]}
            >
              <Input placeholder={ROLE_LABEL_NAMES[key]} />
            </Form.Item>
          ))}
          <Form.Item label="钉钉 Client ID" name="dingtalkClientId">
            <Input placeholder="钉钉应用 Client ID（可选）" allowClear />
          </Form.Item>
          <Form.Item label="钉钉 Client Secret" name="dingtalkClientSecret">
            <Input.Password placeholder="钉钉应用 Client Secret（可选）" />
          </Form.Item>
          <Form.Item label={`接入状态：${data.dingtalk.configured ? '已配置' : '未配置'}`}>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              保存组织设置
            </Button>
          </Form.Item>
        </Form>
      )}
    </QueryBoundary>
  );
}

/** 分区二：角色权限（列表 + 编辑 Drawer，仅 admin） */
function RolesTab(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<RoleDef | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
  const saveMutation = useMutation({
    mutationFn: saveRole,
    onSuccess: () => {
      message.success('角色已保存');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        permissions: editing.permissions,
        dataScope: editing.dataScope,
      });
    }
  }, [editing, form]);

  const openEdit = (role: RoleDef): void => setEditing(role);

  const columns = [
    { title: '角色标识', dataIndex: 'code', key: 'code', width: 160 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: '类型',
      dataIndex: 'builtin',
      key: 'builtin',
      width: 90,
      render: (builtin: boolean) =>
        builtin ? <Tag color="blue">内置</Tag> : <Tag color="green">自定义</Tag>,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) =>
        permissions.length > 3
          ? `${permissions.length} 项权限`
          : permissions.map((p) => (
              <Tag key={p}>{p === '*' ? '全部权限' : p}</Tag>
            )),
    },
    { title: '数据范围', dataIndex: 'dataScope', key: 'dataScope', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, role: RoleDef) => (
        <Button type="link" size="small" onClick={() => openEdit(role)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
      {data && (
        <>
          <Table<RoleDef>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={data.roles}
            pagination={false}
          />
          <Drawer
            title={`编辑角色：${editing?.name ?? ''}`}
            width={420}
            open={editing !== null}
            onClose={() => setEditing(null)}
            destroyOnHidden
          >
            <Form form={form} layout="vertical" onFinish={(values) => {
              if (!editing) return;
              saveMutation.mutate({
                roleId: editing.code,
                name: values.name as string,
                permissions: values.permissions as string[],
                dataScope: values.dataScope as string,
              });
            }}>
              <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="权限码" name="permissions" extra="输入或选择权限码，如 finance:read">
                <Select mode="tags" placeholder="权限码" allowClear />
              </Form.Item>
              <Form.Item label="数据范围" name="dataScope" rules={[{ required: true }]}>
                <Select options={DATA_SCOPE_OPTIONS} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                保存角色
              </Button>
            </Form>
          </Drawer>
        </>
      )}
    </QueryBoundary>
  );
}

/** 分区三：用户偏好（昵称 / 深色模式） */
function UserSettingsTab(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-settings'],
    queryFn: getUserSettings,
  });
  const saveMutation = useMutation({
    mutationFn: saveUserSettings,
    onSuccess: () => {
      message.success('偏好已保存');
      void queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({ nickname: data.nickname ?? '', darkMode: data.darkMode ?? false });
    }
  }, [data, form]);

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
      {data && (
        <Form layout="vertical" style={{ maxWidth: 420 }} form={form} onFinish={(values) => {
          saveMutation.mutate({
            nickname: String(values.nickname ?? ''),
            darkMode: values.darkMode === true,
          });
        }}>
          <Form.Item label="昵称" name="nickname">
            <Input placeholder="展示昵称（可选）" allowClear />
          </Form.Item>
          <Form.Item label="深色模式" name="darkMode" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            保存偏好
          </Button>
        </Form>
      )}
    </QueryBoundary>
  );
}

/**
 * 设置中心：Tabs 三分区（组织设置 / 角色权限 / 用户偏好）。
 * 组织与角色分区仅 admin 可见；保存均携带幂等键（见 endpoints/settings.ts）。
 */
export function SettingsPage(): React.JSX.Element {
  const { isAdmin } = usePermission();
  const items = [
    ...(isAdmin
      ? [
          { key: 'org', label: '组织设置', children: <OrgSettingsTab /> },
          { key: 'roles', label: '角色权限', children: <RolesTab /> },
        ]
      : []),
    { key: 'user', label: '用户偏好', children: <UserSettingsTab /> },
  ];
  return (
    <PageContainer title="系统设置" description="组织设置、角色权限与用户偏好">
      <Tabs defaultActiveKey={isAdmin ? 'org' : 'user'} items={items} />
    </PageContainer>
  );
}
