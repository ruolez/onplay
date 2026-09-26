export interface ThemeConfig {
  // Main background
  bgPrimary: string;
  bgGradient?: string;

  // Navigation
  navBg: string;
  navBorder: string;
  navShadow: string;

  // Dropdown
  dropdownBg: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;

  // Card styles
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  cardBorderHover: string;
  cardShadow: string;
  cardShadowHover: string;
  cardOverlay: string;

  // Button styles
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryHover: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  btnSecondaryHover: string;
  btnOrangeBg: string;
  btnOrangeText: string;
  btnOrangeHover: string;

  // Input styles
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputFocus: string;

  // Status colors
  statusSuccess: string;
  statusWarning: string;
  statusError: string;
  statusInfo: string;

  // Stat card gradients
  statGradient1: string;
  statGradient2: string;
  statGradient3: string;
  statGradient4: string;
  statBorder1: string;
  statBorder2: string;
  statBorder3: string;
  statBorder4: string;

  // Player bar
  playerBarBg: string;
  playerBarBorder: string;
  playerBarButtonHover: string;
  playerProgressBg: string;

  // Media type icons
  iconAudio: string;
  iconVideo: string;
  iconTag: string;
  iconAll: string;

  // Chart series (categorical pair, CVD-validated per theme)
  chartSeries1: string;
  chartSeries2: string;

  // Space-separated RGB for theme-aware surface tints (Tailwind `tint/N`)
  tintRgb: string;
  dropdownShadow: string;
}

// Available theme names
export type ThemeName = "eclipse" | "linen";

export const themes: Record<ThemeName, ThemeConfig> = {
  eclipse: {
    bgPrimary: "#0e0e10",
    bgGradient: "linear-gradient(180deg, #0e0e10 0%, #18181b 100%)",
    navBg: "rgba(14, 14, 16, 0.95)",
    navBorder: "rgba(113, 113, 122, 0.25)",
    navShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
    dropdownBg: "rgba(14, 14, 16, 0.95)",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    textMuted: "#8b8b96",
    accentPrimary: "#94a3b8",
    accentSecondary: "#cbd5e1",
    accentHover: "#60a5fa",
    cardBg: "rgba(39, 39, 42, 0.5)",
    cardBgHover: "rgba(39, 39, 42, 0.7)",
    cardBorder: "rgba(113, 113, 122, 0.2)",
    cardBorderHover: "rgba(161, 161, 170, 0.4)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(161, 161, 170, 0.3)",
    cardOverlay: "rgba(0, 0, 0, 0.4)",
    btnPrimaryBg: "#e8a359",
    btnPrimaryText: "#0e0e10",
    btnPrimaryHover: "#f5b87a",
    btnSecondaryBg: "rgba(113, 113, 122, 0.25)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(113, 113, 122, 0.35)",
    btnOrangeBg: "#475569",
    btnOrangeText: "#e2e8f0",
    btnOrangeHover: "#64748b",
    inputBg: "rgba(39, 39, 42, 0.5)",
    inputBorder: "rgba(113, 113, 122, 0.2)",
    inputText: "#f4f4f5",
    inputFocus: "#60a5fa",
    statusSuccess: "#4ade80",
    statusWarning: "#facc15",
    statusError: "#f87171",
    statusInfo: "#60a5fa",
    statGradient1: "rgba(161, 161, 170, 0.06)",
    statGradient2: "rgba(74, 222, 128, 0.06)",
    statGradient3: "rgba(96, 165, 250, 0.06)",
    statGradient4: "rgba(250, 204, 21, 0.06)",
    statBorder1: "rgba(161, 161, 170, 0.15)",
    statBorder2: "rgba(74, 222, 128, 0.15)",
    statBorder3: "rgba(96, 165, 250, 0.15)",
    statBorder4: "rgba(250, 204, 21, 0.15)",
    playerBarBg: "rgba(14, 14, 16, 0.95)",
    playerBarBorder: "rgba(113, 113, 122, 0.2)",
    playerBarButtonHover: "rgba(113, 113, 122, 0.15)",
    playerProgressBg: "rgba(113, 113, 122, 0.2)",
    iconAudio: "#a78bfa",
    iconVideo: "#60a5fa",
    iconTag: "#fbbf24",
    iconAll: "#94a3b8",
    chartSeries1: "#3b82f6",
    chartSeries2: "#d97706",
    tintRgb: "255 255 255",
    dropdownShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
  },

  // Mirrors Eclipse's roles: slate for the active filter, amber (deepened to
  // copper for AA on white) for primary actions and progress.
  linen: {
    bgPrimary: "#f7f7f5",
    bgGradient: "linear-gradient(180deg, #f7f7f5 0%, #f4f4f1 100%)",
    navBg: "rgba(255, 255, 255, 0.88)",
    navBorder: "rgba(24, 24, 27, 0.08)",
    navShadow: "0 1px 2px rgba(24, 24, 27, 0.04)",
    dropdownBg: "rgba(255, 255, 255, 0.98)",
    textPrimary: "#18181b",
    textSecondary: "#52525b",
    textMuted: "#6b6b73",
    accentPrimary: "#475569",
    accentSecondary: "#334155",
    accentHover: "#2563eb",
    cardBg: "#ffffff",
    cardBgHover: "#f4f4f5",
    cardBorder: "rgba(24, 24, 27, 0.1)",
    cardBorderHover: "rgba(24, 24, 27, 0.18)",
    cardShadow: "0 1px 2px rgba(24, 24, 27, 0.04)",
    cardShadowHover: "0 2px 8px rgba(24, 24, 27, 0.08)",
    cardOverlay: "rgba(0, 0, 0, 0.4)",
    btnPrimaryBg: "#a14e0c",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#853f0a",
    btnSecondaryBg: "rgba(24, 24, 27, 0.06)",
    btnSecondaryText: "#3f3f46",
    btnSecondaryHover: "rgba(24, 24, 27, 0.1)",
    btnOrangeBg: "#475569",
    btnOrangeText: "#ffffff",
    btnOrangeHover: "#334155",
    inputBg: "#ffffff",
    inputBorder: "rgba(24, 24, 27, 0.2)",
    inputText: "#18181b",
    inputFocus: "#2563eb",
    statusSuccess: "#047857",
    statusWarning: "#9a5d06",
    statusError: "#b91c1c",
    statusInfo: "#0369a1",
    statGradient1: "rgba(71, 85, 105, 0.05)",
    statGradient2: "rgba(4, 120, 87, 0.05)",
    statGradient3: "rgba(3, 105, 161, 0.05)",
    statGradient4: "rgba(154, 93, 6, 0.05)",
    statBorder1: "rgba(71, 85, 105, 0.25)",
    statBorder2: "rgba(4, 120, 87, 0.25)",
    statBorder3: "rgba(3, 105, 161, 0.25)",
    statBorder4: "rgba(154, 93, 6, 0.25)",
    playerBarBg: "rgba(255, 255, 255, 0.88)",
    playerBarBorder: "rgba(24, 24, 27, 0.08)",
    playerBarButtonHover: "rgba(24, 24, 27, 0.06)",
    playerProgressBg: "rgba(24, 24, 27, 0.12)",
    iconAudio: "#7c3aed",
    iconVideo: "#2563eb",
    iconTag: "#a14e0c",
    iconAll: "#475569",
    chartSeries1: "#2563eb",
    chartSeries2: "#a14e0c",
    tintRgb: "24 24 27",
    dropdownShadow:
      "0 8px 24px rgba(24, 24, 27, 0.12), 0 1px 2px rgba(24, 24, 27, 0.06)",
  },
};

// Accent tint marking an applied filter (mobile bottom nav + desktop tag filter)
export const activeFilterStyle = {
  background: "color-mix(in srgb, var(--btn-primary-bg) 22%, transparent)",
  boxShadow:
    "inset 0 0 0 1px color-mix(in srgb, var(--btn-primary-bg) 45%, transparent)",
};

export function themeVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--bg-primary": theme.bgPrimary,
    "--bg-gradient": theme.bgGradient ?? theme.bgPrimary,
    "--nav-bg": theme.navBg,
    "--nav-border": theme.navBorder,
    "--nav-shadow": theme.navShadow,
    "--dropdown-bg": theme.dropdownBg,
    "--dropdown-shadow": theme.dropdownShadow,
    "--text-primary": theme.textPrimary,
    "--text-secondary": theme.textSecondary,
    "--text-muted": theme.textMuted,
    "--accent-primary": theme.accentPrimary,
    "--accent-secondary": theme.accentSecondary,
    "--accent-hover": theme.accentHover,
    "--card-bg": theme.cardBg,
    "--card-bg-hover": theme.cardBgHover,
    "--card-border": theme.cardBorder,
    "--card-border-hover": theme.cardBorderHover,
    "--card-shadow": theme.cardShadow,
    "--card-shadow-hover": theme.cardShadowHover,
    "--card-overlay": theme.cardOverlay,
    "--btn-primary-bg": theme.btnPrimaryBg,
    "--btn-primary-text": theme.btnPrimaryText,
    "--btn-primary-hover": theme.btnPrimaryHover,
    "--btn-secondary-bg": theme.btnSecondaryBg,
    "--btn-secondary-text": theme.btnSecondaryText,
    "--btn-secondary-hover": theme.btnSecondaryHover,
    "--btn-orange-bg": theme.btnOrangeBg,
    "--btn-orange-text": theme.btnOrangeText,
    "--btn-orange-hover": theme.btnOrangeHover,
    "--input-bg": theme.inputBg,
    "--input-border": theme.inputBorder,
    "--input-text": theme.inputText,
    "--input-focus": theme.inputFocus,
    "--status-success": theme.statusSuccess,
    "--status-warning": theme.statusWarning,
    "--status-error": theme.statusError,
    "--status-info": theme.statusInfo,
    "--stat-gradient-1": theme.statGradient1,
    "--stat-gradient-2": theme.statGradient2,
    "--stat-gradient-3": theme.statGradient3,
    "--stat-gradient-4": theme.statGradient4,
    "--stat-border-1": theme.statBorder1,
    "--stat-border-2": theme.statBorder2,
    "--stat-border-3": theme.statBorder3,
    "--stat-border-4": theme.statBorder4,
    "--player-bar-bg": theme.playerBarBg,
    "--player-bar-border": theme.playerBarBorder,
    "--player-bar-button-hover": theme.playerBarButtonHover,
    "--player-progress-bg": theme.playerProgressBg,
    "--icon-audio": theme.iconAudio,
    "--icon-video": theme.iconVideo,
    "--icon-tag": theme.iconTag,
    "--icon-all": theme.iconAll,
    "--chart-1": theme.chartSeries1,
    "--chart-2": theme.chartSeries2,
    "--tint-rgb": theme.tintRgb,
  };
}

export function isLightTheme(theme: ThemeConfig) {
  const r = parseInt(theme.bgPrimary.slice(1, 3), 16);
  const g = parseInt(theme.bgPrimary.slice(3, 5), 16);
  const b = parseInt(theme.bgPrimary.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(themeVars(theme))) {
    root.style.setProperty(name, value);
  }

  const isLight = isLightTheme(theme);
  root.style.colorScheme = isLight ? "light" : "dark";

  // Keep browser chrome (status/URL bar) in sync with the active theme
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.setAttribute("content", theme.bgPrimary);

  const statusBarMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  );
  if (statusBarMeta) {
    statusBarMeta.setAttribute(
      "content",
      isLight ? "default" : "black-translucent",
    );
  }
}
