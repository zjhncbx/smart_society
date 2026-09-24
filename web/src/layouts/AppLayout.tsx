import { Layout, Menu, Typography } from 'antd';
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FolderOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { useSession } from '@/auth/session';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { useUi } from '@/stores/ui';

const navItems = [
  { key: '/', label: '工作台', icon: <DashboardOutlined /> },
  { key: '/organization', label: '组织治理', icon: <ApartmentOutlined /> },
  { key: '/membership', label: '成员与档案', icon: <TeamOutlined /> },
  {
    key: 'governance-group',
    label: '治理对象',
    icon: <FileProtectOutlined />,
    children: [
      { key: '/governance/licenses', label: '证照管理' },
      { key: '/governance/compliance', label: '合规事项' },
      { key: '/governance/terms', label: '任期管理' },
    ],
  },
  { key: '/project', label: '项目与任务', icon: <FolderOutlined /> },
  { key: '/approval', label: '审批与决议', icon: <FileDoneOutlined /> },
  {
    key: 'finance-group',
    label: '财务管理',
    icon: <WalletOutlined />,
    children: [
      { key: '/finance', label: '基础收支' },
      { key: '/finance/flows', label: '审批流' },
      { key: '/finance/ledger', label: '总账与期初' },
      { key: '/finance/closing', label: '期末结账' },
    ],
  },
  { key: '/risk', label: '风险与预警', icon: <BellOutlined /> },
  { key: '/data-quality', label: '数据治理', icon: <DatabaseOutlined /> },
  { key: '/automation', label: '自动化治理', icon: <ThunderboltOutlined /> },
  { key: '/sensing', label: '全域感知', icon: <SafetyCertificateOutlined /> },
  { key: '/audit', label: '审计与事件', icon: <AuditOutlined /> },
  { key: '/reports', label: '报表与分析', icon: <BarChartOutlined /> },
  { key: '/documents', label: '文件中心', icon: <FileTextOutlined /> },
  { key: '/notices', label: '通知公告', icon: <SoundOutlined /> },
  { key: '/settings', label: '系统设置', icon: <SettingOutlined /> },
];

export function AppLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useUi((s) => s.siderCollapsed);
  const toggleSider = useUi((s) => s.toggleSider);
  const displayName = useSession((s) => s.displayName);

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
          <OrgSwitcher />
          <Typography.Text type="secondary">{displayName ?? '未登录'}</Typography.Text>
          <SearchOutlined style={{ cursor: 'pointer' }} onClick={() => navigate('/search')} />
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
