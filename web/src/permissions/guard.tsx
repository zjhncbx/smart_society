/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from 'react';

import { useSession } from '@/auth/session';

/**
 * 展示级权限守卫：只影响 UI，不是安全边界。
 * 服务端 Permission / DataScope 始终重新校验。
 */
export function usePermission(): {
  isAdmin: boolean;
  roleId: string | null;
  roleName: string | null;
  dataScope: string;
  has: (code: string) => boolean;
} {
  const isAdmin = useSession((s) => s.isAdmin);
  const roleId = useSession((s) => s.roleId);
  const roleName = useSession((s) => s.roleName);
  const dataScope = useSession((s) => s.dataScope);
  const permissions = useSession((s) => s.permissions);
  return {
    isAdmin,
    roleId,
    roleName,
    dataScope,
    has: (code: string) => isAdmin || permissions.includes(code),
  };
}

export function PermissionGate({
  code,
  children,
  fallback = null,
}: {
  code: string;
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  const { has } = usePermission();
  return has(code) ? children : fallback;
}
