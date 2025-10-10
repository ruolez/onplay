import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GalleryProvider } from "./contexts/GalleryContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <GalleryProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </GalleryProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Accept HMR updates without full page reload
if (import.meta.hot) {
  import.meta.hot.accept();
}
