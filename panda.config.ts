import { defineConfig } from "@pandacss/dev";
import * as palette from "./src/styles/palette";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Generates JSX utilities for React
  jsxFramework: 'react',

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          palette: {
            green: { value: palette.green },
            greenDark: { value: palette.greenDark },
            blue: { value: palette.blue },
            blueDark: { value: palette.blueDark },
            brown: { value: palette.brown },
            brownDark: { value: palette.brownDark },
            textBody: { value: palette.textBody },
            textMuted: { value: palette.textMuted },
            textLight: { value: palette.textLight },
            textPlaceholder: { value: palette.textPlaceholder },
            border: { value: palette.border },
            borderLight: { value: palette.borderLight },
            bgPage: { value: palette.bgPage },
            bgHover: { value: palette.bgHover },
            overlay: { value: palette.overlay },
          },
        },
        shadows: {
          focusGreen: { value: `0 0 0 2px ${palette.greenFocusShadow}` },
          dialog: { value: `0 10px 38px -10px ${palette.shadowDark}, 0 10px 20px -15px ${palette.shadowLight}` },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
