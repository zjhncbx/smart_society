import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { getMembers } from '@/api/endpoints/membership';

export interface MemberSelectProps {
  /** 成员 id */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 是否允许清空（表单可选负责人时开启） */
  allowClear?: boolean;
}

/**
 * 成员选择器：数据源复用 membership 列表查询，展示姓名、值为成员 id。
 * 替代手填内部 ID 的 Input（项目负责人/责任人等场景）。
 */
export function MemberSelect({
  value,
  onChange,
  placeholder = '请选择成员',
  disabled = false,
  allowClear = false,
}: MemberSelectProps): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['members', 'select-options'],
    queryFn: () => getMembers({ pageSize: 200 }),
  });
  const options = (data?.members ?? []).map((m) => ({ value: m.id, label: m.name }));
  return (
    <Select
      showSearch
      optionFilterProp="label"
      value={value}
      onChange={onChange}
      options={options}
      loading={isLoading}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      data-testid="member-select"
    />
  );
}
