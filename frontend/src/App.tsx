import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect } from "react";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import ThemeSelector from "./components/ThemeSelector";
import { useTheme } from "./contexts/ThemeContext";
import { themes, applyTheme } from "./lib/theme";
import { Film, Upload as UploadIcon, BarChart3 } from "lucide-react";

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    const themeConfig = themes[theme];
    if (themeConfig) {
      applyTheme(themeConfig);
    }
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen theme-bg">
        {/* Navigation */}
        <nav className="theme-nav sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link
                to="/"
                className="flex items-center space-x-2 font-bold text-xl theme-text-primary"
              >
                <Film className="w-8 h-8 theme-icon-accent" />
                <span>OnPlay</span>
              </Link>

              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="transition-colors flex items-center space-x-2 theme-nav-link"
                >
                  <Film className="w-5 h-5" />
                  <span>Gallery</span>
                </Link>
                <Link
                  to="/upload"
                  className="transition-colors flex items-center space-x-2 theme-nav-link"
                >
                  <UploadIcon className="w-5 h-5" />
                  <span>Upload</span>
                </Link>
                <Link
                  to="/stats"
                  className="transition-colors flex items-center space-x-2 theme-nav-link"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Stats</span>
                </Link>
                <ThemeSelector />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
