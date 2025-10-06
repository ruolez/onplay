import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Gallery from "./pages/Gallery";
import Player from "./pages/Player";
import Upload from "./pages/Upload";
import Stats from "./pages/Stats";
import { Film, Upload as UploadIcon, BarChart3 } from "lucide-react";

// THEME 3: Ocean Blue/Teal
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
        {/* Navigation */}
        <nav className="border-b border-cyan-500/20 backdrop-blur-sm bg-slate-900/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link
                to="/"
                className="flex items-center space-x-2 text-white font-bold text-xl"
              >
                <Film className="w-8 h-8 text-cyan-400" />
                <span>OnPlay</span>
              </Link>

              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                >
                  <Film className="w-5 h-5" />
                  <span>Gallery</span>
                </Link>
                <Link
                  to="/upload"
                  className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                >
                  <UploadIcon className="w-5 h-5" />
                  <span>Upload</span>
                </Link>
                <Link
                  to="/stats"
                  className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Stats</span>
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
