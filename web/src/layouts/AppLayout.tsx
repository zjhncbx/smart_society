import { Layout, Menu, Typography } from 'antd';
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FolderOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { useSession } from '@/auth/session';
import { useUi } from '@/stores/ui';

const navItems = [
  { key: '/', label: '工作台', icon: <DashboardOutlined /> },
  { key: '/organization', label: '组织治理', icon: <ApartmentOutlined /> },
  { key: '/membership', label: '成员与档案', icon: <TeamOutlined /> },
  { key: '/project', label: '项目与任务', icon: <FolderOutlined /> },
  { key: '/approval', label: '审批与决议', icon: <FileDoneOutlined /> },
  { key: '/finance', label: '财务管理', icon: <WalletOutlined /> },
  { key: '/risk', label: '风险与预警', icon: <BellOutlined /> },
  { key: '/data-quality', label: '数据治理', icon: <DatabaseOutlined /> },
  { key: '/automation', label: '自动化治理', icon: <ThunderboltOutlined /> },
  { key: '/sensing', label: '全域感知', icon: <SafetyCertificateOutlined /> },
  { key: '/audit', label: '审计与事件', icon: <UnorderedListOutlined /> },
  { key: '/reports', label: '报表与分析', icon: <BarChartOutlined /> },
  { key: '/settings', label: '系统设置', icon: <SettingOutlined /> },
];

export function AppLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useUi((s) => s.siderCollapsed);
  const toggleSider = useUi((s) => s.toggleSider);
  const displayName = useSession((s) => s.displayName);
  const currentOrgId = useSession((s) => s.currentOrgId);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider collapsible collapsed={collapsed} onCollapse={toggleSider}>
        <div style={{ padding: 16, color: '#fff', fontWeight: 700 }}>
          {collapsed ? '社' : '社易管 · 管理端'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            background: 'var(--color-bg-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Typography.Text>
            组织：{currentOrgId ?? '未选择'} · 用户：{displayName ?? '未登录'}
          </Typography.Text>
          <SearchOutlined style={{ cursor: 'pointer' }} onClick={() => navigate('/search')} />
          <AuditOutlined />
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
