import { useState, type FormEvent } from "react";
import { KeyRound, LogOut, ShieldAlert, User } from "lucide-react";
import { authApi } from "../../lib/api";
import { useAuth } from "../AuthContext";
import { useToast } from "../../contexts/ToastContext";

export default function Settings() {
  const { username, logout } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast("Password updated", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 403 || status === 401
          ? "Current password is incorrect."
          : "Failed to update password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold theme-text-primary">Settings</h1>

      <div className="theme-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <User className="w-5 h-5 theme-icon-accent" />
          <h2 className="font-semibold theme-text-primary">Account</h2>
        </div>
        <p className="theme-text-secondary text-sm">
          Signed in as <span className="font-medium">{username}</span>
        </p>
      </div>

      <div className="theme-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 theme-icon-accent" />
          <h2 className="font-semibold theme-text-primary">Change password</h2>
        </div>

        <div
          className="flex items-start gap-2.5 p-3 rounded-lg mb-4 text-sm"
          style={{
            background: "var(--card-bg-hover)",
            color: "var(--text-secondary)",
          }}
        >
          <ShieldAlert
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "var(--status-warning)" }}
          />
          <span>
            If you are still using the default password, change it now.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm theme-text-secondary mb-1.5"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm theme-text-secondary mb-1.5"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm theme-text-secondary mb-1.5"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
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
            disabled={saving}
            className="theme-btn-primary px-4 py-2.5 rounded-lg font-medium disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="theme-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="w-5 h-5 theme-icon-accent" />
          <h2 className="font-semibold theme-text-primary">Session</h2>
        </div>
        <button
          onClick={logout}
          className="theme-btn-secondary px-4 py-2.5 rounded-lg font-medium"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
