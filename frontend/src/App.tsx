import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import LogoPreview from "./pages/LogoPreview";
import ThemeSelector from "./components/ThemeSelector";
import MiniPlayer from "./components/MiniPlayer";
import { useTheme } from "./contexts/ThemeContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { themes, applyTheme } from "./lib/theme";
import { Home, Upload as UploadIcon, BarChart3, Menu, X } from "lucide-react";

function AppContent() {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const themeConfig = themes[theme];
    if (themeConfig) {
      applyTheme(themeConfig);
    }
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen theme-bg">
      {/* Navigation */}
      <nav className="theme-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 font-bold text-lg sm:text-xl theme-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-9 h-9 sm:w-10 sm:h-10 theme-icon-accent" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="10" fill="currentColor" opacity="0.15"/>
                <path d="M13 11L21 16L13 21V11Z" fill="currentColor"/>
                <path d="M16 2C8.3 2 2 8.3 2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                <path d="M30 16c0 7.7-6.3 14-14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              </svg>
              <span className="hidden sm:inline">OnPlay</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link
                to="/"
                className="transition-colors flex items-center space-x-2 theme-nav-link min-h-[44px] px-2"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/upload"
                className="transition-colors flex items-center space-x-2 theme-nav-link min-h-[44px] px-2"
              >
                <UploadIcon className="w-5 h-5" />
                <span>Upload</span>
              </Link>
              <Link
                to="/stats"
                className="transition-colors flex items-center space-x-2 theme-nav-link min-h-[44px] px-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Stats</span>
              </Link>
              <ThemeSelector />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg theme-btn-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 theme-dropdown border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 theme-nav-link p-3 rounded-lg hover:bg-white/5 transition-colors min-h-[44px]"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 theme-nav-link p-3 rounded-lg hover:bg-white/5 transition-colors min-h-[44px]"
              >
                <UploadIcon className="w-5 h-5" />
                <span>Upload</span>
              </Link>
              <Link
                to="/stats"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 theme-nav-link p-3 rounded-lg hover:bg-white/5 transition-colors min-h-[44px]"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Stats</span>
              </Link>
              <div className="pt-2 border-t border-white/10">
                <ThemeSelector />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/logo-preview" element={<LogoPreview />} />
      </Routes>

      {/* Modal Player */}
      <MiniPlayer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
