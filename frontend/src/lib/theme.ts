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
}

export const themes: Record<string, ThemeConfig> = {
  eclipse: {
    bgPrimary: "#0e0e10",
    bgGradient: "linear-gradient(180deg, #0e0e10 0%, #18181b 100%)",
    navBg: "rgba(14, 14, 16, 0.9)",
    navBorder: "rgba(113, 113, 122, 0.15)",
    navShadow: "none",
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
    btnSecondaryBg: "rgba(113, 113, 122, 0.15)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(113, 113, 122, 0.25)",
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
  },

  linen: {
    // Main background - warm off-white with subtle gradient
    bgPrimary: "#fafaf8",
    bgGradient: "linear-gradient(180deg, #fafaf8 0%, #f5f5f3 100%)",

    // Navigation - slightly darker with subtle border and shadow
    navBg: "rgba(255, 255, 255, 0.9)",
    navBorder: "rgba(0, 0, 0, 0.06)",
    navShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
    dropdownBg: "rgba(255, 255, 255, 0.95)",

    // Text colors - charcoal instead of pure black for softer readability
    textPrimary: "#1c1c1c",
    textSecondary: "#52525b",
    textMuted: "#5f5f66",

    // Accent colors - professional calm blue
    accentPrimary: "#0969da",
    accentSecondary: "#0550ae",
    accentHover: "#0550ae",

    // Card styles - white with subtle warm gray borders
    cardBg: "#ffffff",
    cardBgHover: "#fafafa",
    cardBorder: "rgba(0, 0, 0, 0.12)",
    cardBorderHover: "rgba(9, 105, 218, 0.4)",
    cardShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
    cardShadowHover: "0 2px 8px rgba(0, 0, 0, 0.08)",
    cardOverlay: "rgba(255, 255, 255, 0.7)",

    // Primary button - blue with white text
    btnPrimaryBg: "#0757b8",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#054a93",

    // Secondary button - light gray backgrounds
    btnSecondaryBg: "rgba(0, 0, 0, 0.08)",
    btnSecondaryText: "#52525b",
    btnSecondaryHover: "rgba(0, 0, 0, 0.12)",

    // Orange button - warm terracotta
    btnOrangeBg: "#e76f51",
    btnOrangeText: "#1c1c1c",
    btnOrangeHover: "#f28066",

    // Input styles - subtle background with clear borders
    inputBg: "#ffffff",
    inputBorder: "rgba(0, 0, 0, 0.12)",
    inputText: "#1c1c1c",
    inputFocus: "#0969da",

    // Status colors - gentle, not harsh
    statusSuccess: "#059669",
    statusWarning: "#d97706",
    statusError: "#dc2626",
    statusInfo: "#0284c7",

    // Stat card gradients - subtle backgrounds with visible borders
    statGradient1: "rgba(9, 105, 218, 0.04)",
    statGradient2: "rgba(5, 150, 105, 0.04)",
    statGradient3: "rgba(2, 132, 199, 0.04)",
    statGradient4: "rgba(217, 119, 6, 0.04)",
    statBorder1: "rgba(9, 105, 218, 0.3)",
    statBorder2: "rgba(5, 150, 105, 0.3)",
    statBorder3: "rgba(2, 132, 199, 0.3)",
    statBorder4: "rgba(217, 119, 6, 0.3)",
    // Player bar - light theme values
    playerBarBg: "rgba(255, 255, 255, 0.95)",
    playerBarBorder: "rgba(0, 0, 0, 0.1)",
    playerBarButtonHover: "rgba(0, 0, 0, 0.05)",
    playerProgressBg: "rgba(0, 0, 0, 0.1)",
    iconAudio: "#8b5cf6",
    iconVideo: "#3b82f6",
    iconTag: "#d97706",
  },
};

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;

  root.style.setProperty("--bg-primary", theme.bgPrimary);
  if (theme.bgGradient) {
    root.style.setProperty("--bg-gradient", theme.bgGradient);
  }

  root.style.setProperty("--nav-bg", theme.navBg);
  root.style.setProperty("--nav-border", theme.navBorder);
  root.style.setProperty("--nav-shadow", theme.navShadow);
  root.style.setProperty("--dropdown-bg", theme.dropdownBg);

  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty("--text-muted", theme.textMuted);

  root.style.setProperty("--accent-primary", theme.accentPrimary);
  root.style.setProperty("--accent-secondary", theme.accentSecondary);
  root.style.setProperty("--accent-hover", theme.accentHover);

  root.style.setProperty("--card-bg", theme.cardBg);
  root.style.setProperty("--card-bg-hover", theme.cardBgHover);
  root.style.setProperty("--card-border", theme.cardBorder);
  root.style.setProperty("--card-border-hover", theme.cardBorderHover);
  root.style.setProperty("--card-shadow", theme.cardShadow);
  root.style.setProperty("--card-shadow-hover", theme.cardShadowHover);
  root.style.setProperty("--card-overlay", theme.cardOverlay);

  root.style.setProperty("--btn-primary-bg", theme.btnPrimaryBg);
  root.style.setProperty("--btn-primary-text", theme.btnPrimaryText);
  root.style.setProperty("--btn-primary-hover", theme.btnPrimaryHover);
  root.style.setProperty("--btn-secondary-bg", theme.btnSecondaryBg);
  root.style.setProperty("--btn-secondary-text", theme.btnSecondaryText);
  root.style.setProperty("--btn-secondary-hover", theme.btnSecondaryHover);
  root.style.setProperty("--btn-orange-bg", theme.btnOrangeBg);
  root.style.setProperty("--btn-orange-text", theme.btnOrangeText);
  root.style.setProperty("--btn-orange-hover", theme.btnOrangeHover);

  root.style.setProperty("--input-bg", theme.inputBg);
  root.style.setProperty("--input-border", theme.inputBorder);
  root.style.setProperty("--input-text", theme.inputText);
  root.style.setProperty("--input-focus", theme.inputFocus);

  root.style.setProperty("--status-success", theme.statusSuccess);
  root.style.setProperty("--status-warning", theme.statusWarning);
  root.style.setProperty("--status-error", theme.statusError);
  root.style.setProperty("--status-info", theme.statusInfo);

  root.style.setProperty("--stat-gradient-1", theme.statGradient1);
  root.style.setProperty("--stat-gradient-2", theme.statGradient2);
  root.style.setProperty("--stat-gradient-3", theme.statGradient3);
  root.style.setProperty("--stat-gradient-4", theme.statGradient4);
  root.style.setProperty("--stat-border-1", theme.statBorder1);
  root.style.setProperty("--stat-border-2", theme.statBorder2);
  root.style.setProperty("--stat-border-3", theme.statBorder3);
  root.style.setProperty("--stat-border-4", theme.statBorder4);

  root.style.setProperty("--player-bar-bg", theme.playerBarBg);
  root.style.setProperty("--player-bar-border", theme.playerBarBorder);
  root.style.setProperty("--player-bar-button-hover", theme.playerBarButtonHover);
  root.style.setProperty("--player-progress-bg", theme.playerProgressBg);

  root.style.setProperty("--icon-audio", theme.iconAudio);
  root.style.setProperty("--icon-video", theme.iconVideo);
  root.style.setProperty("--icon-tag", theme.iconTag);
}
