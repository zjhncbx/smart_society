import { apiRequest } from '../client';

export interface SearchResult {
  type: 'member' | 'project' | 'task' | 'notice' | 'work_item' | 'risk' | 'event';
  title: string;
  subtitle: string;
  id: string;
}

/** 全域检索：统一入口，服务端跨域返回并支持钻取 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const data = await apiRequest<unknown>('/search', {
    method: 'POST',
    body: { query },
  });
  if (!Array.isArray(data)) return [];
  return data as SearchResult[];
}
