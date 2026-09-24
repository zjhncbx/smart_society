import { Result, Typography } from 'antd';

/**
 * 未配置守卫页：生产构建且未配置 VITE_API_BASE_URL 时渲染，
 * 替代白屏 / 静默回退 Mock，引导部署方配置 AGC 网关地址后重新构建。
 */
export function NotConfiguredPage(): React.JSX.Element {
  return (
    <Result
      status="warning"
      title="未配置后端地址"
      subTitle="当前为生产构建，但未配置后端网关地址，应用无法连接云函数服务。"
      data-testid="not-configured-page"
      extra={
        <Typography.Paragraph type="secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
          请在构建或部署时设置环境变量{' '}
          <Typography.Text code>VITE_API_BASE_URL</Typography.Text>
          （指向 AGC 云函数网关地址，例如 https://example.com/api），并确保{' '}
          <Typography.Text code>VITE_API_MODE=agc</Typography.Text>
          ，然后重新构建发布。
        </Typography.Paragraph>
      }
    />
  );
}
