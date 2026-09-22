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
        background: '#f4f3f1',
        foreground: '#0d0c11',
        brand: {
          DEFAULT: '#5b34e8',
          hover: '#4a26d4',
          foreground: '#ffffff',
        },
        ink: {
          DEFAULT: '#2d2a3a',
          dark: '#0d0c11',
          muted: 'rgba(45, 42, 58, 0.65)',
        },
        muted: {
          DEFAULT: 'rgba(45, 42, 58, 0.65)',
          foreground: 'rgba(45, 42, 58, 0.65)',
        },
        surface: {
          card: '#ffffff',
          muted: '#eae9e5',
        },
        border: 'rgba(45, 42, 58, 0.14)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
        serif: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 0 0 0.5px rgba(45,42,58,0.14), 0 1px 2px rgba(45,42,58,0.04), 0 4px 10px rgba(45,42,58,0.05), 0 10px 24px rgba(45,42,58,0.06)',
        panel: '0 0 0 0.5px rgba(45,42,58,0.1), 0 2px 6px rgba(45,42,58,0.05), 0 18px 44px rgba(45,42,58,0.09)',
        'brand-glow': '0 8px 20px rgba(91, 52, 232, 0.3)',
      },
    },
  },
  plugins: [],
};
