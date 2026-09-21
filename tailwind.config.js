/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema oscuro estilo YouTube
        yt: {
          bg: '#0f0f0f',
          surface: '#181818',
          elevated: '#212121',
          border: '#303030',
          red: '#ff0000',
          'red-hover': '#cc0000',
          text: '#f1f1f1',
          dim: '#aaaaaa',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
      },
      keyframes: {
        'pulse-rec': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        'pulse-rec': 'pulse-rec 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
