/**
 * Store global para gerenciamento de tema (light/dark)
 * Persiste preferência no localStorage e sincroniza com <html> class.
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
 * Cores adaptáveis ao tema para uso em SVG inline (Recharts).
 * Necessário porque SVG stroke/fill não herdam CSS custom properties.
 */
export function useChartThemeColors() {
  const theme = useThemeStore((s) => s.theme);

  const isDark = theme === 'dark';

  return {
    /** Cor de texto suave para ticks de eixos */
    textMuted: isDark ? '#94a3b8' : '#64748b',
    /** Cor de borda para grid de gráficos */
    borderDefault: isDark ? '#334155' : '#e2e8f0',
    /** Background de tooltip */
    tooltipBg: isDark ? 'rgba(23, 32, 51, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    /** Borda de tooltip */
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
    /** Cor de label de legenda Recharts */
    legendText: isDark ? '#94a3b8' : '#64748b',
    /** Cor de texto de label de PieChart */
    pieLabel: isDark ? '#94a3b8' : '#475569',
  };
}
