import { useQueryClient } from '@tanstack/react-query';
import { DownOutlined, SwapOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';

import { useSession } from '@/auth/session';

/**
 * 组织切换器：Dropdown 列出当前用户所属组织；
 * 切换后 switchOrg 更新会话组织上下文，并 queryClient.clear()
 * 让所有 useQuery 按新 orgId 全量重新拉取（服务端按组织隔离数据）。
 */
export function OrgSwitcher(): React.JSX.Element {
  const orgs = useSession((s) => s.orgs);
  const currentOrgId = useSession((s) => s.currentOrgId);
  const currentOrgName = useSession((s) => s.currentOrgName);
  const switchOrg = useSession((s) => s.switchOrg);
  const queryClient = useQueryClient();

  const items = orgs.map((o) => ({ key: o.orgId, label: o.name }));

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: currentOrgId ? [currentOrgId] : [],
        onClick: ({ key }) => {
          if (key === currentOrgId) return;
          switchOrg(key);
          void queryClient.clear();
        },
      }}
    >
      <span data-testid="org-switcher" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <SwapOutlined />
        {currentOrgName ?? '未选择组织'}
        <DownOutlined style={{ fontSize: 10 }} />
      </span>
    </Dropdown>
  );
}
