/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg0: '#07070f', bg1: '#0d0d1a', bg2: '#111122',
        bg3: '#16162c', bg4: '#1e1e38',
        acc: '#6c63ff', acc2: '#8b84ff', acc3: '#ff6584', acc4: '#43e8d8',
        t1: '#f0f0ff', t2: '#9090b0', t3: '#55556a',
        ok: '#2dd4a3', warn: '#f5a623', err: '#ff4757',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
