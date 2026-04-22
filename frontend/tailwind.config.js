/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── Color System: The Architectural Archive ── */
      colors: {
        // Primary: Deep Navy
        primary: {
          DEFAULT: '#00193c',
          50: '#e6edf5',
          100: '#b0c5db',
          200: '#8aa9c7',
          300: '#5481ad',
          400: '#33689c',
          500: '#004283',
          600: '#003c77',
          700: '#002f5d',
          800: '#002549',
          900: '#00193c',
        },
        // Primary container (lighter navy for hover/fill)
        'primary-container': '#002d62',
        'on-primary': '#ffffff',
        'on-primary-container': '#c2d8ff',

        // Secondary: Emerald Green (growth, trust)
        secondary: {
          DEFAULT: '#006c47',
          50: '#e6f5ee',
          100: '#b0dfcb',
          200: '#8acfae',
          300: '#54b98b',
          400: '#33ab72',
          500: '#009651',
          600: '#00894a',
          700: '#006b3a',
          800: '#00532d',
          900: '#006c47',
        },
        'secondary-container': '#8af5be',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714b',

        // Tertiary / Accent: Gold/Amber (highlights, emphasis)
        tertiary: {
          DEFAULT: '#c29b00',
          50: '#fcf6e0',
          100: '#f6e3b0',
          200: '#f1d68a',
          300: '#ebc35a',
          400: '#e7b839',
          500: '#e1a60c',
          600: '#cd970b',
          700: '#a07608',
          800: '#7c5b06',
          900: '#5f4605',
        },
        'tertiary-container': '#fae285',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#5f4605',

        // Surface hierarchy — physical paper layers
        surface: {
          DEFAULT: '#f8f9ff',
          variant: '#e2e3eb',
        },
        'surface-container': {
          lowest: '#ffffff',
          low: '#eff4ff',
          DEFAULT: '#e8ecf5',
          high: '#e2e6ef',
          highest: '#dcdfe8',
        },
        // Inverse (used on primary background)
        'inverse-surface': '#e2e2e9',
        'inverse-on-surface': '#2e3036',
        'inverse-primary': '#a1c9ff',

        // On-surface text colors
        'on-surface': '#1a1c20',
        'on-surface-variant': '#44474f',

        // Outline & borders (ghost borders, low opacity)
        outline: {
          DEFAULT: '#74777f',
          variant: '#c4c6d1',
        },

        // Error
        error: {
          DEFAULT: '#ba1a1a',
          50: '#fcece9',
          100: '#f5d4ce',
          200: '#eea99e',
          300: '#e67d6d',
          400: '#df523d',
          500: '#d8270c',
          600: '#ad1f0a',
          700: '#821707',
          800: '#570f05',
          900: '#2d0802',
        },
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#410002',

        // Revenue (green family mapped to secondary)
        revenue: {
          50: '#e6f5ee',
          100: '#b0dfcb',
          200: '#8acfae',
          300: '#54b98b',
          400: '#33ab72',
          500: '#009651',
          600: '#00894a',
          700: '#006b3a',
          800: '#00532d',
          900: '#003f22',
          accent: '#006c47',
          glow: '#006c4740',
        },

        // Expense (error family)
        expense: {
          50: '#fcece9',
          100: '#f5d4ce',
          200: '#eea99e',
          300: '#e67d6d',
          400: '#df523d',
          500: '#d8270c',
          600: '#ad1f0a',
          700: '#821707',
          800: '#570f05',
          900: '#2d0802',
          accent: '#ba1a1a',
          glow: '#ba1a1a40',
        },

        // Forecast (tertiary family)
        forecast: {
          50: '#fcf6e0',
          100: '#f6e3b0',
          200: '#f1d68a',
          300: '#ebc35a',
          400: '#e7b839',
          500: '#e1a60c',
          600: '#cd970b',
          700: '#a07608',
          800: '#7c5b06',
          900: '#5f4605',
          accent: '#c29b00',
          glow: '#c29b0040',
        },

        // Dark mode surface overrides (handled via CSS variables, see globals.css)
        dark: {
          50: '#f8f9ff',
          100: '#e2e2e9',
          200: '#c6c6d0',
          300: '#ababba',
          400: '#9090a3',
          500: '#76768d',
          600: '#5c5c77',
          700: '#444461',
          800: '#2d2d4b',
          900: '#171735',
          950: '#0a0f1a',
        },
      },

      /* ── Typography: Editorial Voice ── */
      fontFamily: {
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-md': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-lg': ['1.375rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-md': ['1.125rem', { lineHeight: '1.45', fontWeight: '600' }],
        'title-sm': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.01em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
      },

      /* ── Spacing: 8px grid ── */
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      /* ── Border Radius ── */
      borderRadius: {
        '2xs': '0.125rem',
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      /* ── Shadows: Atmospheric ── */
      boxShadow: {
        'ambient': '0 4px 32px -4px rgba(0, 25, 60, 0.06)',
        'ambient-lg': '0 8px 48px -4px rgba(0, 25, 60, 0.08)',
        'card': '0 2px 16px -2px rgba(0, 25, 60, 0.05)',
        'card-hover': '0 8px 32px -4px rgba(0, 25, 60, 0.08)',
        'glow-green': '0 0 24px rgba(0, 108, 71, 0.25)',
        'glow-red': '0 0 24px rgba(186, 26, 26, 0.25)',
        'glow-gold': '0 0 24px rgba(194, 155, 0, 0.25)',
        'inner-glow': 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
      },

      /* ── Animations ── */
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      /* ── Backdrop Blur ── */
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
      },

      /* ── Z-Index ── */
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
