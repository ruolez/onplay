import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import LogoPreview from "./pages/LogoPreview";
import ThemeSelector from "./components/ThemeSelector";
import PersistentPlayer from "./components/PersistentPlayer";
import { useTheme } from "./contexts/ThemeContext";
import { themes, applyTheme } from "./lib/theme";
import { Upload as UploadIcon, BarChart3, Menu, X, Search } from "lucide-react";

function AppContent() {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

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

  // Sync search with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Update URL when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Auto-open search if query exists
  useEffect(() => {
    if (searchParams.get("q")) {
      setIsDesktopSearchOpen(true);
      setIsMobileSearchOpen(true);
    }
  }, [searchParams]);

  // Auto-focus desktop search when opened
  useEffect(() => {
    if (isDesktopSearchOpen && desktopSearchRef.current) {
      desktopSearchRef.current.focus();
    }
  }, [isDesktopSearchOpen]);

  // Auto-focus mobile search when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Click-outside handler for desktop search (only close if empty)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isDesktopSearchOpen &&
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target as Node) &&
        !searchQuery
      ) {
        setIsDesktopSearchOpen(false);
      }
    };

    if (isDesktopSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDesktopSearchOpen, searchQuery]);

  // Click-outside handler for mobile search (only close if empty)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMobileSearchOpen &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node) &&
        !searchQuery
      ) {
        setIsMobileSearchOpen(false);
      }
    };

    if (isMobileSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSearchOpen, searchQuery]);

  return (
    <div className="min-h-screen theme-bg pb-24">
      {/* Navigation */}
      <nav className="theme-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              to="/"
              className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12"
                viewBox="0 0 32 32"
                fill="none"
                style={{ color: "var(--accent-primary)" }}
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
              <span className="logo-text text-base sm:text-lg lg:text-xl theme-text-primary">
                On<span className="middle-dot"> · </span>Play
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link
                to="/upload"
                className="transition-colors theme-nav-link p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Upload"
                aria-label="Upload"
              >
                <UploadIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/stats"
                className="transition-colors theme-nav-link p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Stats"
                aria-label="Stats"
              >
                <BarChart3 className="w-5 h-5" />
              </Link>

              {/* Desktop Search (Gallery only) */}
              {location.pathname === "/" && (
                <>
                  {isDesktopSearchOpen ? (
                    <div className="relative w-64 lg:w-80 transition-all duration-300 ease-in-out">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
                      <input
                        ref={desktopSearchRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 rounded-lg text-sm theme-input focus:outline-none focus:ring-1 focus:ring-offset-1"
                        style={{
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                          borderColor: "var(--card-border)",
                        }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => handleSearchChange("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="w-3.5 h-3.5 theme-text-muted" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsDesktopSearchOpen(true)}
                      className="p-2 rounded-lg theme-btn-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Search"
                      title="Search"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}

              <ThemeSelector />
            </div>

            {/* Mobile Actions (right side) */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Search Icon (Gallery only) */}
              {location.pathname === "/" && (
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 rounded-lg theme-btn-secondary transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Search"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg theme-btn-secondary transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
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
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 theme-dropdown border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-2">
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

        {/* Mobile Search Modal */}
        {isMobileSearchOpen && (
          <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start pt-20">
            <div className="container mx-auto px-4">
              <div className="theme-card rounded-lg p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted pointer-events-none" />
                  <input
                    ref={mobileSearchRef}
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-lg text-base theme-input focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderColor: "var(--card-border)",
                    }}
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-5 h-5 theme-text-muted" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded transition-colors"
                      aria-label="Close search"
                    >
                      <X className="w-5 h-5 theme-text-muted" />
                    </button>
                  )}
                </div>
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
