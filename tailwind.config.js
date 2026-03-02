/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0d0d0f',
          800: '#16161a',
          700: '#1c1c22',
          600: '#242429',
          500: '#2e2e36',
        },
        accent: {
          DEFAULT: '#7c6aff',
          hover: '#9585ff',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    }
  },
  plugins: []
}
