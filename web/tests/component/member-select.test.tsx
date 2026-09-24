import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getMembers } from '@/api/endpoints/membership';
import { MemberSelect } from '@/components/MemberSelect';

vi.mock('@/api/endpoints/membership', () => ({
  getMembers: vi.fn(),
}));

const mockedGetMembers = vi.mocked(getMembers);

function renderWithQueryClient(ui: React.ReactElement): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const members = [
  {
    id: 'm1',
    orgId: 'org_mock',
    name: '张三',
    studentNo: '2024001',
    department: '技术部',
    roleId: 'member',
    roleLabel: '成员',
    phone: '13800000001',
    email: 'zhang@example.com',
    joinedAt: '2024-09-01',
    status: 'active',
    syncStatus: 'synced',
  },
  {
    id: 'm2',
    orgId: 'org_mock',
    name: '李四',
    studentNo: '2024002',
    department: '财务部',
    roleId: 'finance_lead',
    roleLabel: '财务负责人',
    phone: '13800000002',
    email: 'li@example.com',
    joinedAt: '2024-09-02',
    status: 'active',
    syncStatus: 'synced',
  },
];

describe('MemberSelect', () => {
  it('加载成员数据源并渲染下拉选项', async () => {
    mockedGetMembers.mockResolvedValue({ members, total: 2, hasMore: false });

    renderWithQueryClient(<MemberSelect />);

    // 数据源查询：pageSize 200 的成员列表
    await waitFor(() => {
      expect(mockedGetMembers).toHaveBeenCalledWith({ pageSize: 200 });
    });

    // 展开下拉后应渲染成员姓名选项（rc-select 的 mousedown 监听在 .ant-select-selector 上）
    const selector = screen.getByTestId('member-select').querySelector('.ant-select-selector');
    fireEvent.mouseDown(selector!);
    expect(await screen.findByText('张三', { selector: '.ant-select-item-option-content' })).toBeInTheDocument();
    expect(screen.getByText('李四', { selector: '.ant-select-item-option-content' })).toBeInTheDocument();
  });

  it('value 受控展示所选成员', async () => {
    mockedGetMembers.mockResolvedValue({ members, total: 2, hasMore: false });

    renderWithQueryClient(<MemberSelect value="m1" />);

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
  });
});
