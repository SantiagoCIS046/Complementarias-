// tailwind.config.js — Configuración de Tailwind CSS
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          green: '#39A900',
          'green-dark': '#2d8500',
          'green-light': '#e8f7e1',
        },
      },
    },
  },
  plugins: [],
}
