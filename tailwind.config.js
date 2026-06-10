/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#060b14',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#94a3b8',
          200: '#cbd5e1',
          100: '#e2e8f0',
          50:  '#f8fafc',
        },
        brand: {
          accent: '#f59e0b',
          hover:  '#d97706',
        },
      },
    },
  },
  plugins: [],
}
