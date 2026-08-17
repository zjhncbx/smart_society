import { Card, Typography } from 'antd';

export function PlaceholderPage({ title }: { title: string }): React.JSX.Element {
  return (
    <div>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Card>
        <Typography.Paragraph type="secondary">
          W0 已就绪：路由 / 布局 / 权限守卫 / API Client 骨架。该模块在后续阶段开发。
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
