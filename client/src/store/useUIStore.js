import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI Store — manages global client-side UI state.
 *
 * Controls:
 *  - Sidebar collapse/expand
 *  - Theme toggle (dark/light)
 *  - Global modal/drawer overlays
 */
export const useUIStore = create(
  persist(
    (set, get) => ({
      // ── Sidebar State ──
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // ── Theme State ──
      theme: 'dark',
      toggleTheme: () =>
        set((s) => {
          const newTheme = s.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      // ── Global Modal/Drawer ──
      activeModal: null,       // { type: 'confirm' | 'form' | 'sheet', props: {} }
      openModal: (type, props = {}) => set({ activeModal: { type, props } }),
      closeModal: () => set({ activeModal: null }),

      // ── Global Search ──
      globalSearchOpen: false,
      toggleGlobalSearch: () => set((s) => ({ globalSearchOpen: !s.globalSearchOpen })),
    }),
    {
      name: 'gym-ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
