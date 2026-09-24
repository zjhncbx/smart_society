import { Button, Result } from 'antd';

export interface ErrorStateProps {
  /** 错误文案（标题下方说明） */
  description?: string;
  /** 重试回调；不传则不渲染重试按钮 */
  onRetry?: () => void;
}

/**
 * 查询失败统一错误态：错误图标 + 文案 + 重试入口。
 * 全部列表/报表页在 TanStack Query isError 时渲染本组件，禁止静默空表格。
 */
export function ErrorState({
  description = '数据加载失败，请检查网络后重试',
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <Result
      status="warning"
      title="加载失败"
      subTitle={description}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry} data-testid="error-state-retry">
            重试
          </Button>
        ) : undefined
      }
    />
  );
}
