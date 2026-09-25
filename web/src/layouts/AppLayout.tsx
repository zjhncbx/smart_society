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
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Dropdown } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { useSession } from '@/auth/session';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { useUi } from '@/stores/ui';
import { colors, layout, spacing } from '@/theme/tokens';

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

/** 侧边栏品牌区：折叠时只保留色块 Logo，展开时显示完整名称 */
function BrandMark({ collapsed }: { collapsed: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: collapsed ? `16px 0` : `16px ${spacing.lg}px`,
        justifyContent: collapsed ? 'center' : 'flex-start',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${colors.primaryHover}, ${colors.primaryActive})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        社
      </div>
      {!collapsed && (
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
          社易管 · 管理端
        </span>
      )}
    </div>
  );
}

export function AppLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useUi((s) => s.siderCollapsed);
  const toggleSider = useUi((s) => s.toggleSider);
  const displayName = useSession((s) => s.displayName);
  const clearSession = useSession((s) => s.clear);
  const queryClient = useQueryClient();

  /** 登出：清空会话与查询缓存后回登录页，避免浏览器后退残留管理数据 */
  const logout = (): void => {
    clearSession();
    void queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleSider}
        trigger={null}
        width={layout.siderWidth}
        collapsedWidth={layout.siderCollapsedWidth}
        breakpoint="lg"
        style={{
          borderRight: `1px solid ${colors.borderSecondary}`,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <BrandMark collapsed={collapsed} />
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['governance-group', 'finance-group']}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none', padding: `0 ${spacing.xs}px ${spacing.lg}px` }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.lg,
            borderBottom: `1px solid ${colors.borderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <span
            role="button"
            tabIndex={0}
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            data-testid="sider-toggle"
            onClick={toggleSider}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleSider();
            }}
            style={{ fontSize: 16, cursor: 'pointer', color: colors.textSecondary }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.lg,
              minWidth: 0,
            }}
          >
            <SearchOutlined
              style={{ cursor: 'pointer', fontSize: 15, color: colors.textSecondary }}
              onClick={() => navigate('/search')}
            />
            <OrgSwitcher />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    onClick: logout,
                  },
                ],
              }}
            >
              <span
                data-testid="user-menu"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: spacing.sm }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: colors.primaryBg,
                    color: colors.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserOutlined />
                </span>
                <Typography.Text>{displayName ?? '未登录'}</Typography.Text>
              </span>
            </Dropdown>
          </div>
        </Layout.Header>
        <Layout.Content style={{ padding: layout.contentPadding, flex: 1 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
