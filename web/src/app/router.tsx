/* eslint-disable react-refresh/only-export-components */
import { Button, Result, Spin } from 'antd';
import { lazy, ReactNode, Suspense } from 'react';
import { Navigate, createBrowserRouter, useNavigate } from 'react-router';

import { useSession } from '@/auth/session';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotConfiguredPage } from '@/features/common/NotConfiguredPage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

/**
 * 后端是否已配置：开发态恒可用（dev-api Mock）；生产构建要求
 * VITE_API_MODE=agc 且已配置 VITE_API_BASE_URL，否则渲染未配置引导页。
 */
const backendConfigured: boolean =
  !import.meta.env.PROD ||
  (import.meta.env.VITE_API_MODE === 'agc' && Boolean(import.meta.env.VITE_API_BASE_URL));

const WorkbenchPage = lazy(() =>
  import('@/features/workbench/WorkbenchPage').then((m) => ({ default: m.WorkbenchPage })),
);
const RiskPage = lazy(() =>
  import('@/features/risk/RiskPage').then((m) => ({ default: m.RiskPage })),
);
const DataQualityPage = lazy(() =>
  import('@/features/data-quality/DataQualityPage').then((m) => ({ default: m.DataQualityPage })),
);
const AutomationPage = lazy(() =>
  import('@/features/automation/AutomationPage').then((m) => ({ default: m.AutomationPage })),
);
const AuditLogPage = lazy(() =>
  import('@/features/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);
const SearchPage = lazy(() =>
  import('@/features/search/SearchPage').then((m) => ({ default: m.SearchPage })),
);
const OrganizationPage = lazy(() =>
  import('@/features/organization/OrganizationPage').then((m) => ({ default: m.OrganizationPage })),
);
const MembershipPage = lazy(() =>
  import('@/features/membership/MembershipPage').then((m) => ({ default: m.MembershipPage })),
);
const ProjectPage = lazy(() =>
  import('@/features/project/ProjectPage').then((m) => ({ default: m.ProjectPage })),
);
const ApprovalPage = lazy(() =>
  import('@/features/approval/ApprovalPage').then((m) => ({ default: m.ApprovalPage })),
);
const FinancePage = lazy(() =>
  import('@/features/finance/FinancePage').then((m) => ({ default: m.FinancePage })),
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const SensingPage = lazy(() =>
  import('@/features/sensing/SensingPage').then((m) => ({ default: m.SensingPage })),
);
const DocumentsPage = lazy(() =>
  import('@/features/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const LicensePage = lazy(() =>
  import('@/features/governance/LicensePage').then((m) => ({ default: m.LicensePage })),
);
const CompliancePage = lazy(() =>
  import('@/features/governance/CompliancePage').then((m) => ({ default: m.CompliancePage })),
);
const TermPage = lazy(() =>
  import('@/features/governance/TermPage').then((m) => ({ default: m.TermPage })),
);
const FlowConfigPage = lazy(() =>
  import('@/features/finance/FlowConfigPage').then((m) => ({ default: m.FlowConfigPage })),
);
const LedgerPage = lazy(() =>
  import('@/features/finance/LedgerPage').then((m) => ({ default: m.LedgerPage })),
);
const ClosingPage = lazy(() =>
  import('@/features/finance/ClosingPage').then((m) => ({ default: m.ClosingPage })),
);
const NoticePage = lazy(() =>
  import('@/features/notice/NoticePage').then((m) => ({ default: m.NoticePage })),
);

function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  const userId = useSession((s) => s.userId);
  return userId ? children : <Navigate to="/login" replace />;
}

function SuspensePage({ children }: { children: ReactNode }): ReactNode {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/** 404 兜底页：未知路由统一反馈并提供返回工作台入口 */
function NotFoundPage(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="页面不存在或已被移除"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回工作台
        </Button>
      }
    />
  );
}

const appRoutes = [
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <SuspensePage>
            <WorkbenchPage />
          </SuspensePage>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspensePage>
            <SettingsPage />
          </SuspensePage>
        ),
      },
      {
        path: 'organization',
        element: (
          <SuspensePage>
            <OrganizationPage />
          </SuspensePage>
        ),
      },
      {
        path: 'membership',
        element: (
          <SuspensePage>
            <MembershipPage />
          </SuspensePage>
        ),
      },
      {
        path: 'project',
        element: (
          <SuspensePage>
            <ProjectPage />
          </SuspensePage>
        ),
      },
      {
        path: 'approval',
        element: (
          <SuspensePage>
            <ApprovalPage />
          </SuspensePage>
        ),
      },
      {
        path: 'finance',
        element: (
          <SuspensePage>
            <FinancePage />
          </SuspensePage>
        ),
      },
      {
        path: 'finance/flows',
        element: (
          <SuspensePage>
            <FlowConfigPage />
          </SuspensePage>
        ),
      },
      {
        path: 'finance/ledger',
        element: (
          <SuspensePage>
            <LedgerPage />
          </SuspensePage>
        ),
      },
      {
        path: 'finance/closing',
        element: (
          <SuspensePage>
            <ClosingPage />
          </SuspensePage>
        ),
      },
      {
        path: 'reports',
        element: (
          <SuspensePage>
            <ReportsPage />
          </SuspensePage>
        ),
      },
      {
        path: 'sensing',
        element: (
          <SuspensePage>
            <SensingPage />
          </SuspensePage>
        ),
      },
      {
        path: 'risk',
        element: (
          <SuspensePage>
            <RiskPage />
          </SuspensePage>
        ),
      },
      {
        path: 'data-quality',
        element: (
          <SuspensePage>
            <DataQualityPage />
          </SuspensePage>
        ),
      },
      {
        path: 'automation',
        element: (
          <SuspensePage>
            <AutomationPage />
          </SuspensePage>
        ),
      },
      {
        path: 'audit',
        element: (
          <SuspensePage>
            <AuditLogPage />
          </SuspensePage>
        ),
      },
      {
        path: 'search',
        element: (
          <SuspensePage>
            <SearchPage />
          </SuspensePage>
        ),
      },
      {
        path: 'documents',
        element: (
          <SuspensePage>
            <DocumentsPage />
          </SuspensePage>
        ),
      },
      {
        path: 'governance/licenses',
        element: (
          <SuspensePage>
            <LicensePage />
          </SuspensePage>
        ),
      },
      {
        path: 'governance/compliance',
        element: (
          <SuspensePage>
            <CompliancePage />
          </SuspensePage>
        ),
      },
      {
        path: 'governance/terms',
        element: (
          <SuspensePage>
            <TermPage />
          </SuspensePage>
        ),
      },
      {
        path: 'notices',
        element: (
          <SuspensePage>
            <NoticePage />
          </SuspensePage>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(
  backendConfigured ? appRoutes : [{ path: '*', element: <NotConfiguredPage /> }],
);
