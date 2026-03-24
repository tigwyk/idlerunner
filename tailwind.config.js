/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          yellow: '#bafa01',
          lime: '#00ff7d',
          gold: '#fff40c',
        },
        surface: {
          DEFAULT: '#060800',
          dark: '#000000',
          raised: '#0d0d12',
          elevated: '#13131a',
          muted: '#383f23',
        },
        text: {
          primary: '#f4f4f5',
          secondary: '#cacad6',
          muted: '#71717a',
        },
        danger: {
          DEFAULT: '#ef4444',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          DEFAULT: '#00ff7d',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          DEFAULT: '#bafa01',
          400: '#facc15',
          500: '#eab308',
        },
      },
      fontFamily: {
        display: ['"Gothic Expanded One"', 'Bank Gothic Pro', 'Impact', 'sans-serif'],
        mono: ['"Roboto Mono"', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
        body: ['Nippo', 'Nipo', 'system-ui', 'sans-serif'],
        caption: ['Barlow', 'system-ui', 'sans-serif'],
        label: ['monoblock', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.50rem', { lineHeight: '1.25' }],
        'xs': ['0.69rem', { lineHeight: '1.27' }],
        'sm': ['0.75rem', { lineHeight: '1.17' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.13rem', { lineHeight: '1.22' }],
        'xl': ['1.50rem', { lineHeight: '1.25' }],
      },
      letterSpacing: {
        'tighter-custom': '-0.8px',
        'tight-custom': '-0.35px',
        'wide-custom': '0.4px',
        'wider-custom': '0.6px',
        'widest-custom': '1.2px',
      },
      spacing: {
        '15': '3.75rem',
        '28': '7rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(2rem)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
      },
      boxShadow: {
        'inset-dark': '0 0 0 30px rgb(25, 25, 27) inset',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
