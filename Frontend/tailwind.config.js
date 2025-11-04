/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // scan toàn bộ file React
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      colors: {
       primary: '#007bff',   // xanh chủ đạo eStore
       light: '#e8f0fe',     // nền xanh rất nhạt cho section
       accent: '#ffb400',    // điểm nhấn (sale/badge)
       muted: '#6c757d',     // chữ phụ
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          gray: "#f5f5f5",
        },
        navy: {
      50: '#e9eff5',
      100: '#d6e0ec',
      200: '#a9bfd9',
      300: '#7c9ec5',
      400: '#4f7db2',
      500: '#235c9f',
      600: '#1b487e',
      700: '#13355e',
      800: '#0c213d',
      900: '#040c1d',
    },
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.08)", // shadow nhẹ cho card
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        slideInRight: "slideInRight 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
