import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "text-muted": "hsl(var(--text-muted))",
        "text-dim": "hsl(var(--text-dim))",
        "surface-1": "hsl(var(--surface-1))",
        "surface-2": "hsl(var(--surface-2))",
        "surface-3": "hsl(var(--surface-3))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
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
        alert: {
          normal: "hsl(var(--alert-normal))",
          caution: "hsl(var(--alert-caution))",
          critical: "hsl(var(--alert-critical))",
          info: "hsl(var(--alert-info))",
        },
        portal: {
          mgmt: "hsl(var(--portal-mgmt))",
          "mgmt-glow": "hsl(var(--portal-mgmt-glow))",
          field: "hsl(var(--portal-field))",
          "field-glow": "hsl(var(--portal-field-glow))",
          client: "hsl(var(--portal-client))",
          "client-glow": "hsl(var(--portal-client-glow))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          border: "hsl(var(--sidebar-border))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          "muted-foreground": "hsl(var(--sidebar-muted-foreground))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        serif: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Editorial dense scale
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],   // 11px
        xs:    ["0.75rem",   { lineHeight: "1.1rem" }], // 12px
        sm:    ["0.8125rem", { lineHeight: "1.25rem" }],// 13px
        base:  ["0.9375rem", { lineHeight: "1.5rem" }], // 15px (calmer than 16)
        lg:    ["1.0625rem", { lineHeight: "1.65rem" }],// 17px
        xl:    ["1.25rem",   { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem",    { lineHeight: "2rem" }],
        "3xl": ["1.875rem",  { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.5rem",    { lineHeight: "1.1",     letterSpacing: "-0.025em" }],
        "5xl": ["3.5rem",    { lineHeight: "1.05",    letterSpacing: "-0.03em" }],
        "6xl": ["4.5rem",    { lineHeight: "1",       letterSpacing: "-0.035em" }],
        "7xl": ["6rem",      { lineHeight: "1",       letterSpacing: "-0.04em" }],
      },
      backgroundImage: {
        "gradient-command":   "var(--gradient-command)",
        "gradient-tactical":  "var(--gradient-tactical)",
        "gradient-hud":       "var(--gradient-hud)",
        "gradient-amber":     "var(--gradient-amber)",
        "gradient-subtle":    "var(--gradient-subtle)",
        "gradient-radial":    "var(--gradient-radial)",
        "gradient-editorial": "var(--gradient-editorial)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)",
        floating: "var(--shadow-floating)",
        glow: "var(--shadow-glow)",
        "glow-strong": "var(--shadow-glow-strong)",
        "amber-glow": "var(--shadow-amber-glow)",
        hud: "var(--shadow-hud)",
      },
      transitionProperty: {
        smooth: "var(--transition-smooth)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(190 95% 55% / 0.55), 0 0 12px -2px hsl(190 95% 55% / 0.4)" },
          "50%":      { boxShadow: "0 0 0 6px hsl(190 95% 55% / 0), 0 0 20px -2px hsl(190 95% 55% / 0.7)" },
        },
        ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "pulse-glow":     "pulse-glow 2.4s ease-in-out infinite",
        ticker:           "ticker 40s linear infinite",
        shimmer:          "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
