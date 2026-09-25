import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

import { spacing } from '@/theme/tokens';

export interface PageContainerProps {
  /** 页面标题（页头主文案） */
  title: ReactNode;
  /** 页面描述（标题下方辅助说明，可选） */
  description?: ReactNode;
  /** 页头操作区（主操作按钮等，右对齐，可选） */
  extra?: ReactNode;
  /** 页面内容（卡片/表格等） */
  children: ReactNode;
}

/**
 * 统一页面骨架：页头（标题/描述/操作区）+ 内容区。
 * 内容区按统一间距纵向堆叠，页面内业务卡片自行使用 Card 呈现；
 * 全部 features 页面以本组件为唯一页面外壳，保证卡片化与留白节奏一致。
 */
export function PageContainer({
  title,
  description,
  extra,
  children,
}: PageContainerProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, minHeight: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.lg,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description !== undefined && (
            <Typography.Text type="secondary">{description}</Typography.Text>
          )}
        </div>
        {extra !== undefined && <Space wrap>{extra}</Space>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
