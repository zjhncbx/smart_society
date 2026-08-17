/* eslint-disable react-refresh/only-export-components */
import { lazy, ReactNode, Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';

import { useSession } from '@/auth/session';
import { LoginPage } from '@/features/auth/LoginPage';
import { PlaceholderPage } from '@/features/common/PlaceholderPage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

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

function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  const userId = useSession((s) => s.userId);
  return userId ? children : <Navigate to="/login" replace />;
}

function SuspensePage({ children }: { children: ReactNode }): ReactNode {
  return <Suspense fallback={null}>{children}</Suspense>;
}

const placeholderRoutes = [
  ['settings', '系统设置'],
] as const;

export const router = createBrowserRouter([
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
      ...placeholderRoutes.map(([path, title]) => ({
        path,
        element: <PlaceholderPage title={title} />,
      })),
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
    ],
  },
]);
