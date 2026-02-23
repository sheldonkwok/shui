// Central color palette for the Shui application.
// All hardcoded colors should be defined here and imported from this module.
export const colors = {
  // Page background
  pageBackground: "#fffdf6",

  // Primary green: plant names, buttons, focus borders
  primaryGreen: "#2d5f3f",
  primaryGreenDark: "#1e3f2b",
  primaryGreenFocusShadow: "rgba(45,95,63,0.2)",

  // Water blue: watering action button
  waterBlue: "#6d94c5",
  waterBlueDark: "#357abd",
  waterBlueRgb: "109, 148, 197", // for use in rgba()

  // Toggle active: fertilize toggle (tan/beige)
  toggleActive: "#d8b88b",
  toggleHover: "#f5e9d8",

  // Neutrals
  textSecondary: "#999",
  textMuted: "#6c757d",
  textIcon: "#666",
  borderInput: "#ddd",
  borderList: "#e9ecef",
  backgroundHover: "#f0f0f0",
};

// Complete Tailwind class name strings. Defined as literals here so Tailwind's
// scanner can detect them and generate the corresponding CSS.
export const cls = {
  // Primary green
  textPrimaryGreen: "text-[#2d5f3f]",
  bgPrimaryGreen: "bg-[#2d5f3f]",
  hoverBgPrimaryGreenDark: "hover:bg-[#1e3f2b]",
  borderBPrimaryGreen: "border-b-[#2d5f3f]",
  focusBorderPrimaryGreen: "focus:border-[#2d5f3f]",
  focusShadowPrimaryGreen: "focus:shadow-[0_0_0_2px_rgba(45,95,63,0.2)]",

  // Water blue
  bgWaterBlue: "bg-[#6d94c5]",
  hoverBgWaterBlueDark: "hover:bg-[#357abd]",

  // Toggle (tan/beige)
  dataOnBgToggleActive: "data-[state=on]:bg-[#d8b88b]",
  hoverBgToggleHover: "hover:bg-[#f5e9d8]",
  borderToggleActive: "border-[#d8b88b]",

  // Neutrals
  textSecondary: "text-[#999]",
  textMuted: "text-[#6c757d]",
  textIcon: "text-[#666]",
  borderInput: "border-[#ddd]",
  hoverBgHover: "hover:bg-[#f0f0f0]",
};
