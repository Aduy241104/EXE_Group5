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
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          gray: "#f5f5f5",
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
