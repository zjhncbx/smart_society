import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Input, List, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { SearchResult, globalSearch } from '@/api/endpoints/search';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';

const typeLabel: Record<string, string> = {
  work_item: '工作项',
  risk: '风险',
  event: '事件',
  member: '成员',
  project: '项目',
  task: '任务',
  notice: '公告',
};

export function SearchPage(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => globalSearch(debounced),
    enabled: debounced.trim().length > 0,
  });

  const open = (item: SearchResult) => {
    if (item.type === 'risk') navigate('/risk');
    else if (item.type === 'event') navigate('/audit');
    else navigate('/');
  };

  return (
    <PageContainer title="全域检索" description="跨工作项 / 风险 / 事件 / 成员 / 项目的全局关键词检索">
      <Input.Search
        placeholder="搜索工作项 / 风险 / 事件 / 成员 / 项目…"
        allowClear
        size="large"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Card>
        {debounced.trim().length === 0 ? (
          <Empty description="输入关键词开始检索" />
        ) : results.isError ? (
          <ErrorState onRetry={() => void results.refetch()} />
        ) : results.isLoading ? (
          <Empty description="检索中…" />
        ) : (results.data?.length ?? 0) === 0 ? (
          <Empty description="未找到相关内容" />
        ) : (
          <List
            dataSource={results.data ?? []}
            renderItem={(item) => (
              <List.Item onClick={() => open(item)} style={{ cursor: 'pointer' }}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag>{typeLabel[item.type] ?? item.type}</Tag>
                      <Typography.Text strong>{item.title}</Typography.Text>
                    </Space>
                  }
                  description={item.subtitle}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </PageContainer>
  );
}
