import { Card, Typography } from 'antd';
import { Outlet } from 'react-router';

export function AuthLayout(): React.JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-layout)',
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          社易管 · 管理端
        </Typography.Title>
        <Outlet />
      </Card>
    </div>
  );
}
