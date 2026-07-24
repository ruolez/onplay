import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "unknown") {
    return (
      <div className="min-h-dvh theme-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <Outlet />;
}
