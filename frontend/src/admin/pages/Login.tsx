import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  useEffect(() => {
    if (status === "authenticated") {
      navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.status === 401
          ? "Invalid credentials"
          : "Login failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh theme-bg flex items-center justify-center px-4">
      <div className="theme-card rounded-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <svg
            className="w-14 h-14 mb-3"
            viewBox="0 0 32 32"
            fill="none"
            style={{ color: "var(--accent-primary)" }}
          >
            <circle cx="16" cy="16" r="10" fill="currentColor" opacity="0.15" />
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
          <h1 className="logo-text text-xl theme-text-primary">
            On<span className="middle-dot"> · </span>Play
          </h1>
          <p className="theme-text-muted text-sm mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Admin sign in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-sm theme-text-secondary mb-1.5"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm theme-text-secondary mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--status-error)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full theme-btn-primary py-2.5 rounded-lg font-medium disabled:opacity-60 transition-opacity"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
