import { Card, Typography } from 'antd';
import { Outlet } from 'react-router';

import { colors, shadows } from '@/theme/tokens';

/** 登录页品牌 Logo：蓝色渐变色块 + 产品名 */
function AuthBrand(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${colors.primaryHover}, ${colors.primaryActive})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 24,
          boxShadow: shadows.card,
        }}
      >
        社
      </div>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          社易管 · 管理端
        </Typography.Title>
        <Typography.Text type="secondary">社会组织数字化治理工作台</Typography.Text>
      </div>
    </div>
  );
}

export function AuthLayout(): React.JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${colors.bgLayout} 0%, ${colors.primaryBg} 140%)`,
        padding: 24,
      }}
    >
      <Card
        style={{ width: 400, boxShadow: shadows.cardHover, borderRadius: 12 }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AuthBrand />
          <Outlet />
        </div>
      </Card>
    </div>
  );
}
