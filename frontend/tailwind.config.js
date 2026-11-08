/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          navy: "#0A192F",
          navyLight: "#172A45",
          teal: "#0D9488",
          tealLight: "#14B8A6",
          tealSoft: "#CCFBF1",
          slate: "#334155",
          grayBg: "#F8FAFC",
          cardBg: "#FFFFFF",
          border: "#E2E8F0",
          stable: "#10B981",
          warning: "#F59E0B",
          critical: "#EF4444"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}

