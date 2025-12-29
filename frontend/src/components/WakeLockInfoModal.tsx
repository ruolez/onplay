import { X, ExternalLink, Settings, Download } from "lucide-react";
import {
  getIOSVersion,
  formatIOSVersion,
  type WakeLockFailureReason,
} from "../lib/platformDetection";

interface WakeLockInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  failureReason: WakeLockFailureReason | null;
}

export function WakeLockInfoModal({
  isOpen,
  onClose,
  failureReason,
}: WakeLockInfoModalProps) {
  if (!isOpen) return null;

  const iosVersion = getIOSVersion();

  const handleOpenInSafari = () => {
    // Opening the current URL will launch Safari on iOS PWA
    window.open(window.location.href, "_blank");
  };

  const getContent = () => {
    switch (failureReason) {
      case "ios_pwa_bug":
        return {
          title: "Screen Wake Lock Unavailable",
          description: `Your iOS version (${formatIOSVersion(iosVersion)}) has a known bug that prevents screen wake lock from working in installed apps (PWAs). This was fixed in iOS 18.4.`,
          solutions: [
            {
              icon: Download,
              title: "Update iOS",
              description: "Update to iOS 18.4 or later (recommended)",
            },
            {
              icon: ExternalLink,
              title: "Use Safari",
              description:
                "Open in Safari browser instead of the installed app",
              action: handleOpenInSafari,
              actionLabel: "Open in Safari",
            },
            {
              icon: Settings,
              title: "Disable Auto-Lock",
              description:
                "Settings > Display & Brightness > Auto-Lock > Never",
            },
          ],
        };

      case "not_supported":
        return {
          title: "Screen Wake Lock Not Supported",
          description:
            "Your browser doesn't support the Screen Wake Lock feature. This feature requires a modern browser with Wake Lock API support.",
          solutions: [
            {
              icon: Settings,
              title: "Disable Auto-Lock",
              description:
                "Use your device settings to disable screen auto-lock while using the app",
            },
          ],
        };

      case "video_blocked":
        return {
          title: "Screen Wake Lock Failed",
          description:
            "The fallback method for keeping the screen awake was blocked. This can happen due to browser autoplay restrictions.",
          solutions: [
            {
              icon: Settings,
              title: "Disable Auto-Lock",
              description:
                "Use your device settings to disable screen auto-lock while using the app",
            },
          ],
        };

      default:
        return {
          title: "Screen Wake Lock Unavailable",
          description:
            "The screen wake lock feature isn't working on your device. The screen may dim or lock during playback.",
          solutions: [
            {
              icon: Settings,
              title: "Disable Auto-Lock",
              description:
                "Use your device settings to disable screen auto-lock while using the app",
            },
          ],
        };
    }
  };

  const content = getContent();

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="theme-card rounded-lg sm:rounded-xl p-5 sm:p-6 w-full max-w-[92vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold theme-text-primary pr-4">
            {content.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm theme-text-secondary mb-5 leading-relaxed">
          {content.description}
        </p>

        {/* Solutions */}
        <div className="space-y-3">
          <p className="text-xs font-medium theme-text-muted uppercase tracking-wide">
            Solutions
          </p>
          {content.solutions.map((solution, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: "var(--card-hover)" }}
            >
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ background: "var(--btn-primary-bg)" }}
              >
                <solution.icon
                  className="w-4 h-4"
                  style={{ color: "var(--btn-primary-text)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium theme-text-primary">
                  {solution.title}
                </p>
                <p className="text-xs theme-text-secondary mt-0.5">
                  {solution.description}
                </p>
                {solution.action && (
                  <button
                    onClick={solution.action}
                    className="mt-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                    style={{
                      background: "var(--btn-primary-bg)",
                      color: "var(--btn-primary-text)",
                    }}
                  >
                    {solution.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dismiss button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium transition-colors theme-text-secondary hover:theme-text-primary"
          style={{ background: "var(--card-hover)" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
