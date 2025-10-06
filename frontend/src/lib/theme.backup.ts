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

  space: {
    bgPrimary: "#0a0d1f",
    bgGradient:
      "linear-gradient(135deg, #0a0d1f 0%, #1a1035 50%, #0f0820 100%)",
    navBg: "rgba(13, 15, 36, 0.9)",
    navBorder: "rgba(99, 102, 241, 0.2)",
    navShadow: "0 4px 24px rgba(99, 102, 241, 0.2)",
    textPrimary: "#eef2ff",
    textSecondary: "rgba(199, 210, 254, 0.7)",
    textMuted: "rgba(199, 210, 254, 0.5)",
    accentPrimary: "#6366f1",
    accentSecondary: "#818cf8",
    accentHover: "#818cf8",
    cardBg: "rgba(99, 102, 241, 0.05)",
    cardBgHover: "rgba(99, 102, 241, 0.1)",
    cardBorder: "rgba(99, 102, 241, 0.15)",
    cardBorderHover: "rgba(99, 102, 241, 0.4)",
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
    cardShadowHover:
      "0 20px 25px -5px rgba(99, 102, 241, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    btnPrimaryBg: "#6366f1",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#818cf8",
    btnSecondaryBg: "rgba(99, 102, 241, 0.1)",
    btnSecondaryText: "rgba(199, 210, 254, 0.7)",
    btnSecondaryHover: "rgba(99, 102, 241, 0.2)",
    inputBg: "rgba(99, 102, 241, 0.05)",
    inputBorder: "rgba(99, 102, 241, 0.2)",
    inputText: "#eef2ff",
    inputFocus: "#6366f1",
    statusSuccess: "#10b981",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#6366f1",
    statGradient1:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)",
    statGradient2:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)",
    statGradient3:
      "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(192, 132, 252, 0.2) 100%)",
    statGradient4:
      "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)",
    statBorder1: "rgba(99, 102, 241, 0.3)",
    statBorder2: "rgba(59, 130, 246, 0.3)",
    statBorder3: "rgba(168, 85, 247, 0.3)",
    statBorder4: "rgba(139, 92, 246, 0.3)",
  },

  carbon: {
    bgPrimary: "#000000",
    bgGradient:
      "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)",
    navBg: "rgba(9, 9, 11, 0.8)",
    navBorder: "rgba(245, 158, 11, 0.15)",
    navShadow: "0 4px 16px rgba(245, 158, 11, 0.1)",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accentPrimary: "#f59e0b",
    accentSecondary: "#fbbf24",
    accentHover: "#fbbf24",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardBgHover: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(245, 158, 11, 0.1)",
    cardBorderHover: "rgba(245, 158, 11, 0.3)",
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    cardShadowHover:
      "0 20px 25px -5px rgba(245, 158, 11, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
    btnPrimaryBg: "#f59e0b",
    btnPrimaryText: "#18181b",
    btnPrimaryHover: "#fbbf24",
    btnSecondaryBg: "rgba(245, 158, 11, 0.1)",
    btnSecondaryText: "#a1a1aa",
    btnSecondaryHover: "rgba(245, 158, 11, 0.15)",
    inputBg: "rgba(255, 255, 255, 0.03)",
    inputBorder: "rgba(245, 158, 11, 0.2)",
    inputText: "#fafafa",
    inputFocus: "#f59e0b",
    statusSuccess: "#10b981",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#fbbf24",
    statGradient1:
      "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%)",
    statGradient2:
      "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(252, 211, 77, 0.15) 100%)",
    statGradient3:
      "linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)",
    statGradient4:
      "linear-gradient(135deg, rgba(180, 83, 9, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
    statBorder1: "rgba(245, 158, 11, 0.3)",
    statBorder2: "rgba(251, 191, 36, 0.3)",
    statBorder3: "rgba(217, 119, 6, 0.3)",
    statBorder4: "rgba(180, 83, 9, 0.3)",
  },

  rose: {
    bgPrimary: "#0f172a",
    bgGradient:
      "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
    navBg: "rgba(15, 23, 42, 0.9)",
    navBorder: "rgba(251, 113, 133, 0.2)",
    navShadow: "0 4px 20px rgba(251, 113, 133, 0.15)",
    textPrimary: "#fff1f2",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    accentPrimary: "#fb7185",
    accentSecondary: "#fda4af",
    accentHover: "#fda4af",
    cardBg: "rgba(251, 113, 133, 0.05)",
    cardBgHover: "rgba(251, 113, 133, 0.08)",
    cardBorder: "rgba(251, 113, 133, 0.15)",
    cardBorderHover: "rgba(251, 113, 133, 0.4)",
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    cardShadowHover:
      "0 20px 25px -5px rgba(251, 113, 133, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    btnPrimaryBg: "#fb7185",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#fda4af",
    btnSecondaryBg: "rgba(251, 113, 133, 0.1)",
    btnSecondaryText: "#cbd5e1",
    btnSecondaryHover: "rgba(251, 113, 133, 0.15)",
    inputBg: "rgba(251, 113, 133, 0.05)",
    inputBorder: "rgba(251, 113, 133, 0.2)",
    inputText: "#fff1f2",
    inputFocus: "#fb7185",
    statusSuccess: "#10b981",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#fb7185",
    statGradient1:
      "linear-gradient(135deg, rgba(251, 113, 133, 0.2) 0%, rgba(253, 164, 175, 0.2) 100%)",
    statGradient2:
      "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(251, 113, 133, 0.2) 100%)",
    statGradient3:
      "linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(251, 113, 133, 0.2) 100%)",
    statGradient4:
      "linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)",
    statBorder1: "rgba(251, 113, 133, 0.3)",
    statBorder2: "rgba(236, 72, 153, 0.3)",
    statBorder3: "rgba(244, 63, 94, 0.3)",
    statBorder4: "rgba(225, 29, 72, 0.3)",
  },

  obsidian: {
    bgPrimary: "#0a0a0a",
    bgGradient:
      "linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)",
    navBg: "rgba(9, 9, 11, 0.9)",
    navBorder: "rgba(239, 68, 68, 0.2)",
    navShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
    textPrimary: "#fafafa",
    textSecondary: "#d4d4d4",
    textMuted: "#a1a1aa",
    accentPrimary: "#ef4444",
    accentSecondary: "#f87171",
    accentHover: "#f87171",
    cardBg: "rgba(239, 68, 68, 0.05)",
    cardBgHover: "rgba(239, 68, 68, 0.08)",
    cardBorder: "rgba(239, 68, 68, 0.15)",
    cardBorderHover: "rgba(239, 68, 68, 0.4)",
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
    cardShadowHover:
      "0 20px 25px -5px rgba(239, 68, 68, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    btnPrimaryBg: "#ef4444",
    btnPrimaryText: "#ffffff",
    btnPrimaryHover: "#f87171",
    btnSecondaryBg: "rgba(239, 68, 68, 0.1)",
    btnSecondaryText: "#d4d4d4",
    btnSecondaryHover: "rgba(239, 68, 68, 0.15)",
    inputBg: "rgba(239, 68, 68, 0.05)",
    inputBorder: "rgba(239, 68, 68, 0.2)",
    inputText: "#fafafa",
    inputFocus: "#ef4444",
    statusSuccess: "#10b981",
    statusWarning: "#f59e0b",
    statusError: "#ef4444",
    statusInfo: "#3b82f6",
    statGradient1:
      "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)",
    statGradient2:
      "linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)",
    statGradient3:
      "linear-gradient(135deg, rgba(185, 28, 28, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)",
    statGradient4:
      "linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)",
    statBorder1: "rgba(239, 68, 68, 0.3)",
    statBorder2: "rgba(220, 38, 38, 0.3)",
    statBorder3: "rgba(185, 28, 28, 0.3)",
    statBorder4: "rgba(153, 27, 27, 0.3)",
  },

  cyber: {
    bgPrimary: "#000000",
    bgGradient:
      "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)",
    navBg: "rgba(0, 0, 0, 0.9)",
    navBorder: "rgba(0, 255, 136, 0.3)",
    navShadow: "0 0 15px rgba(0, 255, 136, 0.3)",
    textPrimary: "#ffffff",
    textSecondary: "#a0a0a0",
    textMuted: "#707070",
    accentPrimary: "#00ff88",
    accentSecondary: "#00d9ff",
    accentHover: "#00ffaa",
    cardBg: "rgba(0, 255, 136, 0.03)",
    cardBgHover: "rgba(0, 255, 136, 0.06)",
    cardBorder: "rgba(0, 255, 136, 0.2)",
    cardBorderHover: "rgba(0, 255, 136, 0.5)",
    cardShadow: "0 0 10px rgba(0, 255, 136, 0.1)",
    cardShadowHover:
      "0 0 30px rgba(0, 255, 136, 0.3), 0 10px 20px rgba(0, 0, 0, 0.3)",
    btnPrimaryBg: "#00ff88",
    btnPrimaryText: "#000000",
    btnPrimaryHover: "#00ffaa",
    btnSecondaryBg: "rgba(0, 255, 136, 0.1)",
    btnSecondaryText: "#a0a0a0",
    btnSecondaryHover: "rgba(0, 255, 136, 0.2)",
    inputBg: "rgba(0, 255, 136, 0.05)",
    inputBorder: "rgba(0, 255, 136, 0.3)",
    inputText: "#ffffff",
    inputFocus: "#00ff88",
    statusSuccess: "#00ff88",
    statusWarning: "#ffaa00",
    statusError: "#ff0055",
    statusInfo: "#00d9ff",
    statGradient1:
      "linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 217, 255, 0.15) 100%)",
    statGradient2:
      "linear-gradient(135deg, rgba(0, 217, 255, 0.15) 0%, rgba(0, 170, 255, 0.15) 100%)",
    statGradient3:
      "linear-gradient(135deg, rgba(0, 255, 170, 0.15) 0%, rgba(0, 255, 136, 0.15) 100%)",
    statGradient4:
      "linear-gradient(135deg, rgba(170, 255, 0, 0.15) 0%, rgba(0, 255, 170, 0.15) 100%)",
    statBorder1: "rgba(0, 255, 136, 0.3)",
    statBorder2: "rgba(0, 217, 255, 0.3)",
    statBorder3: "rgba(0, 255, 170, 0.3)",
    statBorder4: "rgba(170, 255, 0, 0.3)",
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
