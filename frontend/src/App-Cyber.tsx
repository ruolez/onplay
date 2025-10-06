import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import { Film, Upload as UploadIcon, BarChart3 } from "lucide-react";

// THEME 2: Neon Cyberpunk
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        {/* Navigation */}
        <nav className="border-b border-[#00ff88]/30 bg-black/90 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,136,0.3)]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link
                to="/"
                className="flex items-center space-x-2 text-[#00ff88] font-bold text-xl"
              >
                <Film className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
                <span className="drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">
                  ONPLAY
                </span>
              </Link>

              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="text-gray-400 hover:text-[#00ff88] transition-all hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] flex items-center space-x-2"
                >
                  <Film className="w-5 h-5" />
                  <span>GALLERY</span>
                </Link>
                <Link
                  to="/upload"
                  className="text-gray-400 hover:text-[#00d9ff] transition-all hover:drop-shadow-[0_0_8px_rgba(0,217,255,0.6)] flex items-center space-x-2"
                >
                  <UploadIcon className="w-5 h-5" />
                  <span>UPLOAD</span>
                </Link>
                <Link
                  to="/stats"
                  className="text-gray-400 hover:text-[#00ff88] transition-all hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] flex items-center space-x-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>STATS</span>
                </Link>
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
