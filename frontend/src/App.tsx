import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import LogoPreview from "./pages/LogoPreview";
import ThemeSelector from "./components/ThemeSelector";
import PersistentPlayer from "./components/PersistentPlayer";
import { useTheme } from "./contexts/ThemeContext";
import { themes, applyTheme } from "./lib/theme";
import {
  Home,
  Upload as UploadIcon,
  BarChart3,
  Menu,
  X,
  Search,
} from "lucide-react";

function AppContent() {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileSearchQuery, setMobileSearchQuery] = useState(
    searchParams.get("q") || "",
  );

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

  // Sync mobile search with URL params
  useEffect(() => {
    setMobileSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Update URL when mobile search changes
  const handleMobileSearchChange = (value: string) => {
    setMobileSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen theme-bg pb-24">
      {/* Navigation */}
      <nav className="theme-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              to="/"
              className="flex items-center space-x-1.5 sm:space-x-2 font-bold text-base sm:text-lg lg:text-xl theme-text-primary flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 theme-icon-accent"
                viewBox="0 0 32 32"
                fill="none"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="10"
                  fill="currentColor"
                  opacity="0.15"
                />
                <path d="M13 11L21 16L13 21V11Z" fill="currentColor" />
                <path
                  d="M16 2C8.3 2 2 8.3 2 16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <path
                  d="M30 16c0 7.7-6.3 14-14 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
              <span>On·Play</span>
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

            {/* Mobile Search Input (Gallery only) */}
            {location.pathname === "/" && (
              <div className="md:hidden flex-1 mx-2 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={mobileSearchQuery}
                  onChange={(e) => handleMobileSearchChange(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg text-sm theme-input focus:outline-none focus:ring-1 focus:ring-offset-1"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderColor: "var(--card-border)",
                  }}
                />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg theme-btn-secondary transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
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

      {/* Persistent Player */}
      <PersistentPlayer />
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
