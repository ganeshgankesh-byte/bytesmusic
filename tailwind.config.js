/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#080b08",
          800: "#0d120d",
          700: "#131a13",
          600: "#1a241a",
          500: "#223022",
          400: "#2d3d2d",
        },
        mint: {
          50: "#e6fff5",
          100: "#b3ffe0",
          200: "#80ffcc",
          300: "#4dffb8",
          400: "#1affa3",
          500: "#00e599",
          600: "#00cc88",
          700: "#00b377",
          800: "#009966",
          900: "#007f55",
        },
        ink: {
          50: "#f0f5f0",
          100: "#e8f0e8",
          200: "#c8d4c8",
          300: "#8a9a8a",
          400: "#5a6a5a",
          500: "#3a4a3a",
        },
        danger: { 500: "#ef4444", 600: "#dc2626" },
        warning: { 500: "#f59e0b", 600: "#d97706" },
        success: { 500: "#00e599", 600: "#00cc88" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 1.2s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
