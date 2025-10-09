import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "eclipse" ? "linen" : "eclipse");
  };

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
