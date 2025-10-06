export interface ThemeConfig {
  // Main background
  bgPrimary: string;
  bgGradient?: string;

  // Navigation
  navBg: string;
  navBorder: string;
  navShadow: string;

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

  // Button styles
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryHover: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  btnSecondaryHover: string;

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
}

export const themes: Record<string, ThemeConfig> = {
  slate: {
    bgPrimary: "#0a0a0a",
    bgGradient: "linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)",
    navBg: "rgba(10, 10, 10, 0.8)",
    navBorder: "rgba(255, 255, 255, 0.06)",
    navShadow: "0 1px 0 rgba(255, 255, 255, 0.03)",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accentPrimary: "#8b5cf6",
    accentSecondary: "#a78bfa",
    accentHover: "#a78bfa",
    cardBg: "rgba(255, 255, 255, 0.02)",
    cardBgHover: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    cardBorderHover: "rgba(139, 92, 246, 0.3)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(139, 92, 246, 0.2)",
    btnPrimaryBg: "#8b5cf6",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#7c3aed",
    btnSecondaryBg: "rgba(255, 255, 255, 0.04)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(255, 255, 255, 0.08)",
    inputBg: "rgba(255, 255, 255, 0.02)",
    inputBorder: "rgba(255, 255, 255, 0.08)",
    inputText: "#e4e4e7",
    inputFocus: "#8b5cf6",
    statusSuccess: "#22c55e",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#3b82f6",
    statGradient1: "rgba(139, 92, 246, 0.05)",
    statGradient2: "rgba(34, 197, 94, 0.05)",
    statGradient3: "rgba(59, 130, 246, 0.05)",
    statGradient4: "rgba(245, 158, 11, 0.05)",
    statBorder1: "rgba(139, 92, 246, 0.15)",
    statBorder2: "rgba(34, 197, 94, 0.15)",
    statBorder3: "rgba(59, 130, 246, 0.15)",
    statBorder4: "rgba(245, 158, 11, 0.15)",
  },

  jade: {
    bgPrimary: "#0c0d0d",
    bgGradient: "linear-gradient(180deg, #0c0d0d 0%, #111212 100%)",
    navBg: "rgba(12, 13, 13, 0.8)",
    navBorder: "rgba(255, 255, 255, 0.06)",
    navShadow: "0 1px 0 rgba(255, 255, 255, 0.03)",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accentPrimary: "#14b8a6",
    accentSecondary: "#2dd4bf",
    accentHover: "#2dd4bf",
    cardBg: "rgba(255, 255, 255, 0.02)",
    cardBgHover: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    cardBorderHover: "rgba(20, 184, 166, 0.3)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(20, 184, 166, 0.2)",
    btnPrimaryBg: "#14b8a6",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#0d9488",
    btnSecondaryBg: "rgba(255, 255, 255, 0.04)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(255, 255, 255, 0.08)",
    inputBg: "rgba(255, 255, 255, 0.02)",
    inputBorder: "rgba(255, 255, 255, 0.08)",
    inputText: "#e4e4e7",
    inputFocus: "#14b8a6",
    statusSuccess: "#22c55e",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#14b8a6",
    statGradient1: "rgba(20, 184, 166, 0.05)",
    statGradient2: "rgba(34, 197, 94, 0.05)",
    statGradient3: "rgba(59, 130, 246, 0.05)",
    statGradient4: "rgba(245, 158, 11, 0.05)",
    statBorder1: "rgba(20, 184, 166, 0.15)",
    statBorder2: "rgba(34, 197, 94, 0.15)",
    statBorder3: "rgba(59, 130, 246, 0.15)",
    statBorder4: "rgba(245, 158, 11, 0.15)",
  },

  midnight: {
    bgPrimary: "#0d1117",
    bgGradient: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)",
    navBg: "rgba(13, 17, 23, 0.8)",
    navBorder: "rgba(48, 54, 61, 0.5)",
    navShadow: "none",
    textPrimary: "#e6edf3",
    textSecondary: "#8b949e",
    textMuted: "#6e7681",
    accentPrimary: "#539bf5",
    accentSecondary: "#6cb6ff",
    accentHover: "#6cb6ff",
    cardBg: "rgba(22, 27, 34, 0.6)",
    cardBgHover: "rgba(48, 54, 61, 0.5)",
    cardBorder: "rgba(48, 54, 61, 0.5)",
    cardBorderHover: "rgba(83, 155, 245, 0.4)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(83, 155, 245, 0.3)",
    btnPrimaryBg: "#539bf5",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#6cb6ff",
    btnSecondaryBg: "rgba(48, 54, 61, 0.5)",
    btnSecondaryText: "#8b949e",
    btnSecondaryHover: "rgba(48, 54, 61, 0.8)",
    inputBg: "rgba(22, 27, 34, 0.6)",
    inputBorder: "rgba(48, 54, 61, 0.5)",
    inputText: "#e6edf3",
    inputFocus: "#539bf5",
    statusSuccess: "#3fb950",
    statusWarning: "#d29922",
    statusError: "#f85149",
    statusInfo: "#539bf5",
    statGradient1: "rgba(83, 155, 245, 0.08)",
    statGradient2: "rgba(63, 185, 80, 0.08)",
    statGradient3: "rgba(163, 113, 247, 0.08)",
    statGradient4: "rgba(210, 153, 34, 0.08)",
    statBorder1: "rgba(83, 155, 245, 0.2)",
    statBorder2: "rgba(63, 185, 80, 0.2)",
    statBorder3: "rgba(163, 113, 247, 0.2)",
    statBorder4: "rgba(210, 153, 34, 0.2)",
  },

  charcoal: {
    bgPrimary: "#000000",
    bgGradient: "linear-gradient(180deg, #000000 0%, #0a0a0a 100%)",
    navBg: "rgba(0, 0, 0, 0.9)",
    navBorder: "rgba(255, 255, 255, 0.08)",
    navShadow: "none",
    textPrimary: "#ededed",
    textSecondary: "#999999",
    textMuted: "#666666",
    accentPrimary: "#0070f3",
    accentSecondary: "#3291ff",
    accentHover: "#3291ff",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardBgHover: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    cardBorderHover: "rgba(0, 112, 243, 0.4)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(0, 112, 243, 0.3)",
    btnPrimaryBg: "#0070f3",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#3291ff",
    btnSecondaryBg: "rgba(255, 255, 255, 0.08)",
    btnSecondaryText: "#999999",
    btnSecondaryHover: "rgba(255, 255, 255, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.03)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputText: "#ededed",
    inputFocus: "#0070f3",
    statusSuccess: "#50e3c2",
    statusWarning: "#f5a623",
    statusError: "#ff6363",
    statusInfo: "#0070f3",
    statGradient1: "rgba(0, 112, 243, 0.06)",
    statGradient2: "rgba(80, 227, 194, 0.06)",
    statGradient3: "rgba(245, 166, 35, 0.06)",
    statGradient4: "rgba(255, 99, 99, 0.06)",
    statBorder1: "rgba(0, 112, 243, 0.18)",
    statBorder2: "rgba(80, 227, 194, 0.18)",
    statBorder3: "rgba(245, 166, 35, 0.18)",
    statBorder4: "rgba(255, 99, 99, 0.18)",
  },

  graphite: {
    bgPrimary: "#0f1419",
    bgGradient: "linear-gradient(180deg, #0f1419 0%, #1a1f26 100%)",
    navBg: "rgba(15, 20, 25, 0.9)",
    navBorder: "rgba(94, 109, 130, 0.2)",
    navShadow: "none",
    textPrimary: "#d6deeb",
    textSecondary: "#7fdbca",
    textMuted: "#5f7e97",
    accentPrimary: "#7fdbca",
    accentSecondary: "#9feaf9",
    accentHover: "#9feaf9",
    cardBg: "rgba(26, 31, 38, 0.5)",
    cardBgHover: "rgba(42, 47, 56, 0.6)",
    cardBorder: "rgba(94, 109, 130, 0.2)",
    cardBorderHover: "rgba(127, 219, 202, 0.3)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(127, 219, 202, 0.25)",
    btnPrimaryBg: "#7fdbca",
    btnPrimaryText: "#011627",
    btnPrimaryHover: "#9feaf9",
    btnSecondaryBg: "rgba(94, 109, 130, 0.2)",
    btnSecondaryText: "#7fdbca",
    btnSecondaryHover: "rgba(94, 109, 130, 0.3)",
    inputBg: "rgba(26, 31, 38, 0.5)",
    inputBorder: "rgba(94, 109, 130, 0.3)",
    inputText: "#d6deeb",
    inputFocus: "#7fdbca",
    statusSuccess: "#addb67",
    statusWarning: "#ecc48d",
    statusError: "#ef5350",
    statusInfo: "#82aaff",
    statGradient1: "rgba(127, 219, 202, 0.07)",
    statGradient2: "rgba(173, 219, 103, 0.07)",
    statGradient3: "rgba(130, 170, 255, 0.07)",
    statGradient4: "rgba(236, 196, 141, 0.07)",
    statBorder1: "rgba(127, 219, 202, 0.18)",
    statBorder2: "rgba(173, 219, 103, 0.18)",
    statBorder3: "rgba(130, 170, 255, 0.18)",
    statBorder4: "rgba(236, 196, 141, 0.18)",
  },

  onyx: {
    bgPrimary: "#000000",
    bgGradient: "linear-gradient(180deg, #000000 0%, #0d0d0d 100%)",
    navBg: "rgba(0, 0, 0, 0.95)",
    navBorder: "rgba(255, 255, 255, 0.05)",
    navShadow: "none",
    textPrimary: "#ffffff",
    textSecondary: "#b3b3b3",
    textMuted: "#737373",
    accentPrimary: "#ffffff",
    accentSecondary: "#e6e6e6",
    accentHover: "#e6e6e6",
    cardBg: "rgba(255, 255, 255, 0.02)",
    cardBgHover: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    cardBorderHover: "rgba(255, 255, 255, 0.15)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(255, 255, 255, 0.15)",
    btnPrimaryBg: "#ffffff",
    btnPrimaryText: "#000000",
    btnPrimaryHover: "#e6e6e6",
    btnSecondaryBg: "rgba(255, 255, 255, 0.08)",
    btnSecondaryText: "#b3b3b3",
    btnSecondaryHover: "rgba(255, 255, 255, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.03)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputText: "#ffffff",
    inputFocus: "#ffffff",
    statusSuccess: "#00c853",
    statusWarning: "#ffc107",
    statusError: "#f44336",
    statusInfo: "#2196f3",
    statGradient1: "rgba(255, 255, 255, 0.03)",
    statGradient2: "rgba(0, 200, 83, 0.06)",
    statGradient3: "rgba(33, 150, 243, 0.06)",
    statGradient4: "rgba(255, 193, 7, 0.06)",
    statBorder1: "rgba(255, 255, 255, 0.12)",
    statBorder2: "rgba(0, 200, 83, 0.2)",
    statBorder3: "rgba(33, 150, 243, 0.2)",
    statBorder4: "rgba(255, 193, 7, 0.2)",
  },

  steel: {
    bgPrimary: "#0b0d0e",
    bgGradient: "linear-gradient(180deg, #0b0d0e 0%, #141719 100%)",
    navBg: "rgba(11, 13, 14, 0.9)",
    navBorder: "rgba(71, 85, 105, 0.2)",
    navShadow: "none",
    textPrimary: "#cbd5e1",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    accentPrimary: "#38bdf8",
    accentSecondary: "#7dd3fc",
    accentHover: "#7dd3fc",
    cardBg: "rgba(30, 41, 59, 0.2)",
    cardBgHover: "rgba(30, 41, 59, 0.35)",
    cardBorder: "rgba(71, 85, 105, 0.2)",
    cardBorderHover: "rgba(56, 189, 248, 0.3)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(56, 189, 248, 0.25)",
    btnPrimaryBg: "#38bdf8",
    btnPrimaryText: "#0f172a",
    btnPrimaryHover: "#7dd3fc",
    btnSecondaryBg: "rgba(71, 85, 105, 0.2)",
    btnSecondaryText: "#94a3b8",
    btnSecondaryHover: "rgba(71, 85, 105, 0.3)",
    inputBg: "rgba(30, 41, 59, 0.2)",
    inputBorder: "rgba(71, 85, 105, 0.25)",
    inputText: "#cbd5e1",
    inputFocus: "#38bdf8",
    statusSuccess: "#34d399",
    statusWarning: "#fbbf24",
    statusError: "#f87171",
    statusInfo: "#38bdf8",
    statGradient1: "rgba(56, 189, 248, 0.06)",
    statGradient2: "rgba(52, 211, 153, 0.06)",
    statGradient3: "rgba(251, 191, 36, 0.06)",
    statGradient4: "rgba(248, 113, 113, 0.06)",
    statBorder1: "rgba(56, 189, 248, 0.18)",
    statBorder2: "rgba(52, 211, 153, 0.18)",
    statBorder3: "rgba(251, 191, 36, 0.18)",
    statBorder4: "rgba(248, 113, 113, 0.18)",
  },

  eclipse: {
    bgPrimary: "#0e0e10",
    bgGradient: "linear-gradient(180deg, #0e0e10 0%, #18181b 100%)",
    navBg: "rgba(14, 14, 16, 0.9)",
    navBorder: "rgba(113, 113, 122, 0.15)",
    navShadow: "none",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accentPrimary: "#a1a1aa",
    accentSecondary: "#d4d4d8",
    accentHover: "#d4d4d8",
    cardBg: "rgba(39, 39, 42, 0.3)",
    cardBgHover: "rgba(39, 39, 42, 0.5)",
    cardBorder: "rgba(113, 113, 122, 0.15)",
    cardBorderHover: "rgba(161, 161, 170, 0.3)",
    cardShadow: "none",
    cardShadowHover: "0 0 0 1px rgba(161, 161, 170, 0.2)",
    btnPrimaryBg: "#fafafa",
    btnPrimaryText: "#0e0e10",
    btnPrimaryHover: "#e4e4e7",
    btnSecondaryBg: "rgba(113, 113, 122, 0.15)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(113, 113, 122, 0.25)",
    inputBg: "rgba(39, 39, 42, 0.3)",
    inputBorder: "rgba(113, 113, 122, 0.2)",
    inputText: "#fafafa",
    inputFocus: "#a1a1aa",
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

  root.style.setProperty("--btn-primary-bg", theme.btnPrimaryBg);
  root.style.setProperty("--btn-primary-text", theme.btnPrimaryText);
  root.style.setProperty("--btn-primary-hover", theme.btnPrimaryHover);
  root.style.setProperty("--btn-secondary-bg", theme.btnSecondaryBg);
  root.style.setProperty("--btn-secondary-text", theme.btnSecondaryText);
  root.style.setProperty("--btn-secondary-hover", theme.btnSecondaryHover);

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
}
