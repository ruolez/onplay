import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import { useTheme, type ThemeType } from "../contexts/ThemeContext";

const themes: { value: ThemeType; label: string }[] = [
  { value: "jade", label: "Jade" },
  { value: "midnight", label: "Midnight" },
  { value: "charcoal", label: "Charcoal" },
  { value: "graphite", label: "Graphite" },
  { value: "onyx", label: "Onyx" },
  { value: "steel", label: "Steel" },
  { value: "eclipse", label: "Eclipse" },
  { value: "linen", label: "Linen" },
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
        <div className="absolute right-0 mt-2 w-40 sm:w-48 rounded-lg shadow-xl theme-dropdown z-[9999]">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-0">
            {themes.map((t, index) => (
              <button
                key={t.value}
                onClick={() => handleThemeSelect(t.value)}
                className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base transition-colors theme-dropdown-item min-h-[36px] sm:min-h-[44px] ${
                  theme === t.value ? "theme-dropdown-item-active" : ""
                } ${
                  // Round corners based on grid position
                  index === 0
                    ? "rounded-tl-lg sm:rounded-tr-lg"
                    : index === 1
                      ? "rounded-tr-lg sm:rounded-tr-none"
                      : index === themes.length - 2
                        ? "sm:rounded-bl-none sm:rounded-br-none"
                        : index === themes.length - 1
                          ? "rounded-br-lg sm:rounded-bl-lg"
                          : ""
                } ${
                  // Handle odd number of items - last item spans full width on mobile
                  themes.length % 2 !== 0 && index === themes.length - 1
                    ? "col-span-2 sm:col-span-1 rounded-b-lg sm:rounded-bl-lg sm:rounded-br-lg"
                    : ""
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
