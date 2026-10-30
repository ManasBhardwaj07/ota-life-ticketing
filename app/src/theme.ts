/**
 * Theme Design Tokens for Ota Life Ticketing App
 * 60-30-10 Rule:
 * 60% Background: paper (#FAF7F2)
 * 30% Content: ink (#23201C) & inkSoft (#6F6A61)
 * 10% Accent: vermillion (#E4572E)
 * Semantics: matcha (#2F9E6E), amber (#C98A12)
 * Surface & Lines: card (#FFFFFF), line (#E8E2D8)
 *
 * ZERO hardcoded hex values outside this file.
 */

export const colors = {
  // 60% Background
  paper: "#FAF7F2",

  // 30% Content
  ink: "#23201C",
  inkSoft: "#6F6A61",

  // 10% Accent (money / attention decisions)
  vermillion: "#E4572E",

  // Semantic
  matcha: "#2F9E6E", // ADMIT ONE / Success
  amber: "#C98A12",  // CHECKED IN badge / Gate stamp

  // Surface & Dividers
  card: "#FFFFFF",
  line: "#E8E2D8",

  // Pure black & white for QR code strictly (G1 Guardrail)
  qrBlack: "#000000",
  qrWhite: "#FFFFFF",

  // Subtle tints derived from tokens (warm, no gray/navy)
  matchaTint: "rgba(47, 158, 110, 0.10)",
  matchaBorder: "rgba(47, 158, 110, 0.25)",
  amberTint: "rgba(201, 138, 18, 0.10)",
  amberBorder: "rgba(201, 138, 18, 0.25)",
  vermillionTint: "rgba(228, 87, 46, 0.08)",
  vermillionBorder: "rgba(228, 87, 46, 0.20)",
  errorTint: "rgba(228, 87, 46, 0.12)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  size: {
    micro: 10,
    caption: 11,
    sub: 12,
    body: 14,
    bodyLarge: 15,
    title: 18,
    heading: 22,
    display: 26,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
    black: "900" as const,
  },
  tracking: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    widest: 1.0,
    caps: 1.2,
  },
} as const;

export const motion = {
  duration: {
    press: 100,
    crossFade: 150,
    stagger: 180,
    banner: 200,
    badgeFlip: 250,
    maxBudget: 300,
  },
  delay: {
    staggerPerItem: 60,
  },
  scale: {
    press: 0.97,
  },
  opacity: {
    press: 0.85,
    dimmed: 0.55,
  },
  timing: {
    bannerDismiss: 3500,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  motion,
} as const;

export type Theme = typeof theme;
export default theme;
