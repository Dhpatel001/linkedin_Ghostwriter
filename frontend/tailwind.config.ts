import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // LinkedIn brand
        linkedin: {
          DEFAULT: "#0A66C2",
          hover: "#004182",
          light: "#EBF3FB",
          muted: "#70B5F9",
        },
        // Surface system
        surface: {
          base: "#F8FAFC",
          raised: "#FFFFFF",
          overlay: "#FFFFFF",
          sunken: "#F1F5F9",
        },
        // Semantic
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status colors
        status: {
          pending: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
          approved: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
          posted: { bg: "#EBF3FB", text: "#004182", border: "#70B5F9" },
          discard: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "12px",
        input: "8px",
        btn: "6px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        // Layered shadow system (ambient + key light)
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.10)",
        "card-active": "0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)",
        input: "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 2px rgba(0,0,0,0.04)",
        "input-focus": "0 0 0 3px rgba(10,102,194,0.15), 0 1px 2px rgba(0,0,0,0.05)",
        btn: "0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)",
        "btn-hover": "0 2px 4px rgba(0,0,0,0.14), 0 4px 12px rgba(10,102,194,0.28)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-out": { from: { opacity: "1", transform: "translateY(0)" }, to: { opacity: "0", transform: "translateY(-6px)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "pulse-soft": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        "flame-pulse": { "0%, 100%": { transform: "scale(1) rotate(-2deg)" }, "50%": { transform: "scale(1.15) rotate(2deg)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        "bounce-in": { "0%": { transform: "scale(0.8)", opacity: "0" }, "60%": { transform: "scale(1.05)" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "flame-pulse": "flame-pulse 1.5s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.16,1,0.3,1)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        "in-back": "cubic-bezier(0.36, 0, 0.66, -0.56)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;