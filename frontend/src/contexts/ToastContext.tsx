import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_DURATION_MS = 4000;

const iconFor: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />,
  info: <Info className="w-5 h-5 flex-shrink-0 theme-icon-accent" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Above the mini player + bottom nav via the measured layout vars */}
      <div
        aria-live="polite"
        className="fixed left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
        style={{
          bottom:
            "calc(var(--bottom-nav-height, 0px) + var(--mini-player-height, 0px) + max(1rem, env(safe-area-inset-bottom)))",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl shadow-xl pointer-events-auto"
            style={{
              background: "var(--dropdown-bg, rgba(20, 20, 20, 0.95))",
              border: "1px solid var(--card-border)",
              backdropFilter: "blur(16px)",
            }}
          >
            {iconFor[toast.type]}
            <p className="theme-text-primary text-sm flex-1 min-w-0 break-words">
              {toast.message}
            </p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="theme-text-muted hover:theme-text-primary p-1 -mr-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
