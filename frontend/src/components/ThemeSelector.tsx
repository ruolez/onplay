import { useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeSelect = (value: ThemeType) => {
    setTheme(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all theme-button min-h-[44px]"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-5 h-5" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl theme-dropdown z-[9999]">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => handleThemeSelect(t.value)}
              className={`w-full text-left px-4 py-3 first:rounded-t-lg last:rounded-b-lg transition-colors theme-dropdown-item min-h-[44px] ${
                theme === t.value ? "theme-dropdown-item-active" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
