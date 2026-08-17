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

function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  const userId = useSession((s) => s.userId);
  return userId ? children : <Navigate to="/login" replace />;
}

function SuspensePage({ children }: { children: ReactNode }): ReactNode {
  return <Suspense fallback={null}>{children}</Suspense>;
}

const placeholderRoutes = [
  ['organization', '组织治理'],
  ['membership', '成员与档案'],
  ['project', '项目与任务'],
  ['approval', '审批与决议'],
  ['finance', '财务管理'],
  ['risk', '风险与预警'],
  ['data-quality', '数据治理'],
  ['automation', '自动化治理'],
  ['sensing', '全域感知'],
  ['reports', '报表与分析'],
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
    ],
  },
]);
