/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#0B0F14',
          900: '#10161D',
          850: '#141C25',
          800: '#1A232E',
          700: '#243040',
          600: '#31415699',
          500: '#4A5D75',
        },
        signal: {
          DEFAULT: '#3DDC97',
          dim: '#2AA675',
        },
        alert: {
          high: '#FF6B5E',
          medium: '#FFB454',
          low: '#5EC2FF',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
