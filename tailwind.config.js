/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D12",
        card: "#151922",
        accent: "#2F80FF",
        text: "#FFFFFF",
        muted: "rgba(255,255,255,0.65)"
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.35)"
      },
      backdropBlur: {
        xs: "2px"
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
