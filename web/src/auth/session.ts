import { create } from 'zustand';

/** 会话摘要：只保存客户端状态，服务端数据由 TanStack Query 管理 */
interface SessionState {
  accessToken: string | null;
  userId: string | null;
  personId: string | null;
  displayName: string | null;
  currentOrgId: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
  dataScope: string;
  isAdmin: boolean;
  setSession: (session: Partial<SessionState>) => void;
  setPermission: (bundle: {
    roleId: string;
    roleName: string;
    permissions: string[];
    dataScope: string;
    isAdmin: boolean;
  }) => void;
  switchOrg: (orgId: string) => void;
  clear: () => void;
}

const initial: Omit<SessionState, 'setSession' | 'setPermission' | 'switchOrg' | 'clear'> = {
  accessToken: null,
  userId: null,
  personId: null,
  displayName: null,
  currentOrgId: null,
  roleId: null,
  roleName: null,
  permissions: [],
  dataScope: 'org',
  isAdmin: false,
};

export const useSession = create<SessionState>((set) => ({
  ...initial,
  setSession: (session) => set((s) => ({ ...s, ...session })),
  setPermission: (bundle) =>
    set({
      roleId: bundle.roleId,
      roleName: bundle.roleName,
      permissions: bundle.permissions,
      dataScope: bundle.dataScope,
      isAdmin: bundle.isAdmin,
    }),
  switchOrg: (orgId) => set({ currentOrgId: orgId }),
  clear: () => set({ ...initial }),
}));

/** 供 API Client 读取令牌（避免循环依赖） */
export function getAccessToken(): string | null {
  return useSession.getState().accessToken;
}

/** 401 时清除会话并触发登录跳转 */
export function clearSession(): void {
  useSession.getState().clear();
}

/** 当前组织上下文（API Client 自动注入 X-Org-Id） */
export function getCurrentOrgId(): string | null {
  return useSession.getState().currentOrgId;
}
