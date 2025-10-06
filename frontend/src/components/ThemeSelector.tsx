import { Palette } from "lucide-react";
import { useTheme, type ThemeType } from "../contexts/ThemeContext";

const themes: { value: ThemeType; label: string }[] = [
  { value: "slate", label: "Slate" },
  { value: "jade", label: "Jade" },
  { value: "midnight", label: "Midnight" },
  { value: "charcoal", label: "Charcoal" },
  { value: "graphite", label: "Graphite" },
  { value: "onyx", label: "Onyx" },
  { value: "steel", label: "Steel" },
  { value: "eclipse", label: "Eclipse" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all theme-button">
        <Palette className="w-5 h-5" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all theme-dropdown z-[9999]">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`w-full text-left px-4 py-2 first:rounded-t-lg last:rounded-b-lg transition-colors theme-dropdown-item ${
              theme === t.value ? "theme-dropdown-item-active" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
