/** @type {import('tailwindcss').Config} */
// Every color resolves to a CSS variable (RGB channels) defined in src/index.css,
// so light/dark themes swap at the token level and Tailwind opacity modifiers still work.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        line: token("line"),
        fg: token("fg"),
        muted: token("muted"),
        subtle: token("subtle"),
        brand: token("brand"),
        "brand-strong": token("brand-strong"),
        "brand-soft": token("brand-soft"),
        ok: token("ok"),
        warn: token("warn"),
        bad: token("bad"),
        info: token("info"),
        cyan: token("cyan"),
        purple: token("purple"),
        orange: token("orange"),
        nav: token("nav"),
        "nav-2": token("nav-2"),
        "nav-fg": token("nav-fg"),
        "nav-muted": token("nav-muted"),
      },
      borderRadius: { btn: "6px", input: "8px", card: "12px" },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        badge: ["11px", { lineHeight: "16px", fontWeight: "600" }],
        label: ["12px", { lineHeight: "16px", fontWeight: "600" }],
        body: ["13px", { lineHeight: "20px" }],
        "card-title": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        title: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        kpi: ["24px", { lineHeight: "32px", fontWeight: "700" }],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        dash: { to: { strokeDashoffset: "-24" } },
        slideIn: { from: { transform: "translateX(16px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        fadeUp: { from: { transform: "translateY(4px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: {
        "pulse-ring": "pulseRing 1.8s cubic-bezier(0,0,.2,1) infinite",
        dash: "dash 1.2s linear infinite",
        "slide-in": "slideIn 200ms ease-out",
        "fade-up": "fadeUp 180ms ease-out",
      },
    },
  },
  plugins: [],
};
