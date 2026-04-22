/**
 * Store global para gerenciamento de tema (light/dark)
 * Persiste preferencia no localStorage e sincroniza com <html> class.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const initialState: ThemeState = {
  theme: 'dark',
};

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark');
          }
          return { theme: next };
        }),
    }),
    {
      name: 'bandeirantes-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/**
 * Cores adaptaveis ao tema para uso em SVG inline (Recharts).
 * Necessario porque SVG stroke/fill nao herdam CSS custom properties.
 */
export function useChartThemeColors() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return {
    textMuted: isDark ? '#8e9099' : '#44474f',
    borderDefault: isDark ? '#3d4049' : '#c4c6d1',
    tooltipBg: isDark ? 'rgba(18, 24, 40, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? '#3d4049' : '#e2e3eb',
    legendText: isDark ? '#8e9099' : '#44474f',
    pieLabel: isDark ? '#8e9099' : '#44474f',
    gridColor: isDark ? 'rgba(61, 64, 73, 0.3)' : 'rgba(196, 198, 209, 0.4)',
  };
}
