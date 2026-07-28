/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111827',
          foreground: '#ffffff',
          container: '#141b2b',
        },
        secondary: {
          DEFAULT: '#D4AF37', // Luxury Gold
          foreground: '#ffffff',
          container: '#FED65B',
          'on-container': '#745c00',
        },
        surface: {
          DEFAULT: '#FCF8FA',
          dim: '#DCD9DB',
          bright: '#FCF8FA',
          lowest: '#FFFFFF',
          low: '#F6F3F4',
          container: '#F0EDEE',
          high: '#EAE7E9',
          highest: '#E5E2E3',
          variant: '#E5E2E3',
        },
        'on-surface': '#111827',
        'on-surface-variant': '#45464c',
        outline: '#76777d',
        'outline-variant': '#E5E7EB',
        brand: {
          gold: '#D4AF37',
          dark: '#111827',
          bg: '#FCF8FA',
          card: '#FFFFFF',
          border: '#E5E7EB',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#ffffff',
          container: '#DCFCE7',
          'on-container': '#14532D',
        },
        warning: {
          DEFAULT: '#D97706',
          foreground: '#ffffff',
          container: '#FEF3C7',
          'on-container': '#78350F',
        },
        error: {
          DEFAULT: '#BA1A1A',
          foreground: '#ffffff',
          container: '#FFDAD6',
          'on-container': '#93000A',
        }
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
        'lg': '8px',
        'md': '6px',
        'sm': '4px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.02)',
        'luxury-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}