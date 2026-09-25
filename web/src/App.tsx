import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/app/query';
import { router } from '@/app/router';
import { antdTheme } from '@/theme/antdTheme';

export function App(): React.JSX.Element {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
