import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UiState {
  siderCollapsed: boolean;
  toggleSider: () => void;
  setSiderCollapsed: (collapsed: boolean) => void;
}

/** 窄屏（<992px，lg 断点以下）默认收起侧边栏 */
const isNarrowScreen = (): boolean =>
  typeof window !== 'undefined' ? window.innerWidth < 992 : false;

/**
 * 全局 UI 状态。侧边栏折叠态经 zustand persist 持久化到 localStorage，
 * 跨页面与刷新保持；首次访问（无存储值）时按窗口宽度决定默认值。
 */
export const useUi = create<UiState>()(
  persist(
    (set) => ({
      siderCollapsed: isNarrowScreen(),
      toggleSider: () => set((s) => ({ siderCollapsed: !s.siderCollapsed })),
      setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
    }),
    {
      name: 'smart-society-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ siderCollapsed: s.siderCollapsed }),
    },
  ),
);
