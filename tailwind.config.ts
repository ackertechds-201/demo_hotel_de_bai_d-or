import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./content/**/*.{html,js}"],
  theme: {
    extend: {
      "borderRadius": {
        "DEFAULT": "1rem",
        "full": "9999px",
        "lg": "2rem",
        "xl": "2.5rem"
      },
      "colors": {
        "background": "#fef9ef",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "espresso-dark": "#261A13",
        "inverse-on-surface": "#f5f0e6",
        "inverse-primary": "#fdba4d",
        "inverse-surface": "#261A13",
        "on-background": "#261A13",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "on-primary-container": "#583a00",
        "on-primary-fixed": "#281800",
        "on-primary-fixed-variant": "#614000",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#735e53",
        "on-secondary-fixed": "#27180f",
        "on-secondary-fixed-variant": "#564338",
        "on-surface": "#261A13",
        "on-surface-variant": "#504536",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#5f3609",
        "on-tertiary-fixed": "#2d1600",
        "on-tertiary-fixed-variant": "#673d10",
        "outline": "#837563",
        "outline-variant": "#d5c4b0",
        "pale-vanilla": "#FFFBF2",
        "primary": "#805600",
        "primary-container": "#dfa035",
        "primary-fixed": "#ffddb0",
        "primary-fixed-dim": "#fdba4d",
        "secondary": "#6f5a4f",
        "secondary-container": "#f6dacb",
        "secondary-fixed": "#f9ddce",
        "secondary-fixed-dim": "#dcc1b3",
        "soft-sand": "#F5EAD6",
        "sun-gold": "#E5A93C",
        "surface": "#fef9ef",
        "surface-bright": "#fef9ef",
        "surface-container": "#f2ede3",
        "surface-container-high": "#ece8de",
        "surface-container-highest": "#e7e2d8",
        "surface-container-low": "#f8f3e9",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dedad0",
        "surface-tint": "#805600",
        "surface-variant": "#e7e2d8",
        "tertiary": "#835425",
        "tertiary-container": "#dba06a",
        "tertiary-fixed": "#ffdcc0",
        "tertiary-fixed-dim": "#f8ba82",
        "warm-border": "#E8DCBE"
      },
      "fontFamily": {
        "body-lg": [
          "DM Sans",
          "sans-serif"
        ],
        "body-md": [
          "DM Sans",
          "sans-serif"
        ],
        "body-sm": [
          "DM Sans",
          "sans-serif"
        ],
        "display": [
          "Newsreader",
          "serif"
        ],
        "display-lg": [
          "Newsreader",
          "serif"
        ],
        "display-lg-mobile": [
          "Newsreader",
          "serif"
        ],
        "headline-lg": [
          "Newsreader",
          "serif"
        ],
        "headline-sm": [
          "Newsreader",
          "serif"
        ],
        "headline-xl": [
          "Newsreader",
          "serif"
        ],
        "headline-xl-mobile": [
          "Newsreader",
          "serif"
        ],
        "label-md": [
          "DM Sans"
        ],
        "label-sm": [
          "DM Sans"
        ],
        "sans": [
          "DM Sans",
          "sans-serif"
        ],
        "serif": [
          "Newsreader",
          "serif"
        ]
      },
      "fontSize": {
        "body-lg": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "400"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "body-sm": [
          "14px",
          {
            "lineHeight": "20px",
            "fontWeight": "400"
          }
        ],
        "display-lg": [
          "56px",
          {
            "lineHeight": "64px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "display-lg-mobile": [
          "38px",
          {
            "lineHeight": "46px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "fontWeight": "500"
          }
        ],
        "headline-sm": [
          "22px",
          {
            "lineHeight": "30px",
            "fontWeight": "600"
          }
        ],
        "headline-xl": [
          "44px",
          {
            "lineHeight": "52px",
            "letterSpacing": "-0.015em",
            "fontWeight": "500"
          }
        ],
        "headline-xl-mobile": [
          "30px",
          {
            "lineHeight": "38px",
            "fontWeight": "500"
          }
        ],
        "label-md": [
          "13px",
          {
            "lineHeight": "18px",
            "letterSpacing": "0.08em",
            "fontWeight": "700"
          }
        ],
        "label-sm": [
          "11px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.1em",
            "fontWeight": "700"
          }
        ]
      },
      "spacing": {
        "gutter": "1.5rem",
        "gutter-lg": "2.5rem",
        "gutter-sm": "1rem",
        "margin": "2rem",
        "margin-desktop": "5rem",
        "margin-mobile": "1.25rem",
        "space-2xl": "4rem",
        "space-3xl": "6rem",
        "space-lg": "1.5rem",
        "space-md": "1rem",
        "space-sm": "0.5rem",
        "space-xl": "2.5rem",
        "space-xs": "0.25rem"
      }
    },
  },
  plugins: [forms, containerQueries],
};

export default config;
