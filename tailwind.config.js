/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          300: "#5eead4",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        portal: {
          bg: "#ffffff",
          sidebar: "#0b0b0b",
          accent: "#14b8a6",
          border: "#14b8a6",
          ink: "#0f172a",
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
