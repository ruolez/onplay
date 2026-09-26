import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GalleryProvider } from "./contexts/GalleryContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { ToastProvider } from "./contexts/ToastContext";
import { themes, applyTheme } from "./lib/theme";
import { readSavedTheme } from "./contexts/ThemeContext";
import "./index.css";

// Paint the saved theme before React mounts so there is no wrong-theme flash
applyTheme(themes[readSavedTheme()]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <GalleryProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </GalleryProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Accept HMR updates without full page reload
if (import.meta.hot) {
  import.meta.hot.accept();
}
