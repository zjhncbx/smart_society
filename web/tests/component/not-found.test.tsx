import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';

import { NotFoundPage } from '@/app/router';

/** 探针：暴露当前路径与导航类型（PUSH/REPLACE） */
function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  const navType = useNavigationType();
  return <div data-testid="probe">{`${location.pathname}|${navType}`}</div>;
}

describe('404 页浏览器返回行为', () => {
  it('返回工作台使用 replace 导航，不把 404 残留在历史栈', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <Routes>
          <Route path="/" element={<LocationProbe />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '返回工作台' }));

    // 落到工作台且导航类型为 REPLACE（浏览器后退不会再回到 404）
    expect(screen.getByTestId('probe').textContent).toBe('/|REPLACE');
  });
});
