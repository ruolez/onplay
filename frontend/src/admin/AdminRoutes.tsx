import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import RequireAuth from "./RequireAuth";
import AdminLayout from "./AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MediaLibrary from "./pages/MediaLibrary";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import ListenerDetail from "./pages/ListenerDetail";
import Tags from "./pages/Tags";
import Settings from "./pages/Settings";

export default function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="upload" element={<Upload />} />
            <Route path="analytics" element={<Analytics />} />
            <Route
              path="analytics/listeners/:listenerId"
              element={<ListenerDetail />}
            />
            <Route path="tags" element={<Tags />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
