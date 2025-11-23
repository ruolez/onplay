import { Sun, Moon, Check } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { themes, ThemeName } from "../lib/theme";

interface ThemeSelectorProps {
  /** Optional callback when a theme is selected (used for mobile modal) */
  onSelect?: () => void;
}

// Theme display names and icons
const themeConfig: Record<ThemeName, { name: string; isDark: boolean }> = {
  eclipse: { name: "Eclipse", isDark: true },
  linen: { name: "Linen", isDark: false },
};

export default function ThemeSelector({ onSelect }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  // Simple toggle for desktop (header icon)
  const toggleTheme = () => {
    setTheme(theme === "eclipse" ? "linen" : "eclipse");
    onSelect?.();
  };

  // If onSelect is provided, render full theme grid (for mobile modal)
  if (onSelect) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(themeConfig) as ThemeName[]).map((themeName) => {
          const config = themeConfig[themeName];
          const themeData = themes[themeName];
          const isActive = theme === themeName;

          return (
            <button
              key={themeName}
              onClick={() => {
                setTheme(themeName);
                onSelect();
              }}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all min-h-[72px] ${
                isActive
                  ? "ring-2 ring-offset-2 ring-offset-transparent"
                  : "hover:bg-white/5"
              }`}
              style={{
                background: themeData.bgPrimary,
                borderColor: isActive ? themeData.accentPrimary : "transparent",
                border: `1px solid ${isActive ? themeData.accentPrimary : "rgba(255,255,255,0.1)"}`,
              }}
              aria-label={`Select ${config.name} theme`}
              aria-pressed={isActive}
            >
              {/* Theme color preview */}
              <div
                className="w-6 h-6 rounded-full mb-1.5"
                style={{ background: themeData.accentPrimary }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: themeData.textPrimary }}
              >
                {config.name}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: themeData.accentPrimary }}
                >
                  <Check className="w-3 h-3" style={{ color: themeData.bgPrimary }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Simple toggle button for desktop header
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2.5 rounded-lg transition-all theme-button min-h-[44px] min-w-[44px]"
      aria-label={theme === "eclipse" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "eclipse" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
