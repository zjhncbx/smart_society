import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from '@/components/ErrorState';

describe('ErrorState', () => {
  it('渲染默认文案与重试按钮，点击触发 onRetry 回调', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByText('加载失败')).toBeInTheDocument();
    expect(screen.getByText('数据加载失败，请检查网络后重试')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('支持自定义 description，不传 onRetry 时不渲染重试按钮', () => {
    render(<ErrorState description="报表数据加载失败" />);

    expect(screen.getByText('加载失败')).toBeInTheDocument();
    expect(screen.getByText('报表数据加载失败')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state-retry')).not.toBeInTheDocument();
  });
});
