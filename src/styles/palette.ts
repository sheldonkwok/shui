// Primary green – used for headings, buttons, focus accents
export const green = "#2d5f3f";
export const greenDark = "#1e3f2b";
export const greenFocusShadow = "rgba(45, 95, 63, 0.2)";

// Water blue – used for water-related actions and indicators
export const blue = "#6d94c5";
export const blueDark = "#357abd";
export const blueRgb = "109, 148, 197";

// Fertilize brown
export const brown = "#d8b88b";
export const brownDark = "#965a3e";

// Neutral grays
export const textBody = "#333";
export const textMuted = "#666";
export const textLight = "#999";
export const textPlaceholder = "#6c757d";

// Borders
export const border = "#ddd";
export const borderLight = "#e9ecef";

// Backgrounds
export const bgPage = "#fffdf6";
export const bgWhite = "white";
export const bgHover = "#f0f0f0";

// Overlays & shadows
export const overlay = "rgba(0, 0, 0, 0.5)";
export const shadowDark = "rgba(22, 23, 24, 0.35)";
export const shadowLight = "rgba(22, 23, 24, 0.2)";

// Panda CSS token definitions – used by panda.config.ts
export const colorTokens = {
  green: { value: green },
  greenDark: { value: greenDark },
  blue: { value: blue },
  blueDark: { value: blueDark },
  brown: { value: brown },
  brownDark: { value: brownDark },
  textBody: { value: textBody },
  textMuted: { value: textMuted },
  textLight: { value: textLight },
  textPlaceholder: { value: textPlaceholder },
  border: { value: border },
  borderLight: { value: borderLight },
  bgPage: { value: bgPage },
  bgHover: { value: bgHover },
  overlay: { value: overlay },
};

export const shadowTokens = {
  focusGreen: { value: `0 0 0 2px ${greenFocusShadow}` },
  dialog: { value: `0 10px 38px -10px ${shadowDark}, 0 10px 20px -15px ${shadowLight}` },
};
