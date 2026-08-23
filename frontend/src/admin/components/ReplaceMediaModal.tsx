import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import Modal from "./Modal";
import { mediaApi, type Media } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type Phase = "idle" | "uploading" | "processing" | "failed";

type ReplaceMediaModalProps = {
  media: Media | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function ReplaceMediaModal({
  media,
  onClose,
  onChanged,
}: ReplaceMediaModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    setPhase("idle");
    setProgress(0);
    setError(null);
    return stopPolling;
  }, [media?.id]);

  const handleClose = () => {
    // The upload can't be cancelled server-side; keep the modal up until the
    // request settles. Closing during processing is fine — it continues in
    // the background and the row shows its status.
    if (phase === "uploading") return;
    stopPolling();
    if (phase === "processing") onChanged();
    onClose();
  };

  const pollStatus = (mediaId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await mediaApi.getUploadStatus(mediaId);
        const status = res.data.status;
        if (status === "ready") {
          stopPolling();
          showToast("Media replaced", "success");
          onChanged();
          onClose();
        } else if (status === "failed") {
          stopPolling();
          setError(res.data.error || "Processing failed");
          setPhase("failed");
          onChanged();
        }
      } catch {
        stopPolling();
        setError("Lost connection while checking processing status");
        setPhase("failed");
      }
    }, 5000);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !media) return;
    event.target.value = "";
    setError(null);
    setProgress(0);
    setPhase("uploading");
    try {
      await mediaApi.replaceMedia(media.id, file, setProgress);
      setPhase("processing");
      pollStatus(media.id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed");
      setPhase("failed");
    }
  };

  const busy = phase === "uploading" || phase === "processing";

  return (
    <Modal open={!!media} onClose={handleClose} title="Replace file">
      {media && (
        <div className="space-y-4">
          <p className="text-sm theme-text-secondary">
            Upload a new {media.media_type} file for "{media.filename}". The
            thumbnail, tags, and all play statistics are kept. The item is
            unavailable while it re-processes.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={media.media_type === "video" ? "video/*" : "audio/*"}
            onChange={handleFile}
            className="hidden"
          />

          {phase === "uploading" && (
            <div className="space-y-1.5">
              <p className="text-xs theme-text-muted">Uploading… {progress}%</p>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--card-bg-hover)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: "var(--status-info)",
                  }}
                />
              </div>
            </div>
          )}

          {phase === "processing" && (
            <div className="space-y-1.5">
              <p className="text-xs theme-text-muted">
                Processing… you can close this window.
              </p>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--card-bg-hover)" }}
              >
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{ background: "var(--status-warning)" }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "var(--status-error)" }}>
              {error}
            </p>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex items-center justify-center gap-2 theme-btn-secondary px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            {phase === "failed" ? "Choose another file" : "Choose file"}
          </button>
        </div>
      )}
    </Modal>
  );
}
