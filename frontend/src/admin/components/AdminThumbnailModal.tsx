import { useRef, useState } from "react";
import { Image, Upload } from "lucide-react";
import Modal from "./Modal";
import VideoPlayer, { type VideoPlayerRef } from "../../components/VideoPlayer";
import { mediaApi, type Media } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type AdminThumbnailModalProps = {
  media: Media | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function AdminThumbnailModal({
  media,
  onClose,
  onChanged,
}: AdminThumbnailModalProps) {
  const { showToast } = useToast();
  const playerRef = useRef<VideoPlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isVideo = media?.media_type === "video";

  const handleSetFrame = async () => {
    if (!media || !playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    setSaving(true);
    try {
      await mediaApi.setThumbnail(media.id, currentTime);
      showToast("Thumbnail updated", "success");
      onChanged();
    } catch {
      showToast("Failed to set thumbnail", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !media) return;
    event.target.value = "";
    setUploading(true);
    try {
      await mediaApi.uploadThumbnail(media.id, file);
      showToast("Thumbnail uploaded", "success");
      onChanged();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to upload thumbnail",
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={!!media}
      onClose={onClose}
      title="Edit thumbnail"
      maxWidth={isVideo ? "max-w-2xl" : "max-w-md"}
    >
      {media && (
        <div className="space-y-4">
          {isVideo ? (
            <>
              <VideoPlayer
                key={media.id}
                ref={playerRef}
                src={`/media/hls/${media.id}/master.m3u8`}
                poster={media.thumbnail_path || undefined}
              />
              <p className="text-xs theme-text-muted">
                Pause the video on the frame you want, then capture it — or
                upload a custom image (JPEG, PNG, WebP, GIF up to 5MB).
              </p>
            </>
          ) : (
            <>
              {media.thumbnail_path && (
                <img
                  src={media.thumbnail_path}
                  alt={media.filename}
                  className="w-full rounded-lg"
                />
              )}
              <p className="text-xs theme-text-muted">
                Upload a custom thumbnail image (JPEG, PNG, WebP, GIF up to
                5MB).
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            {isVideo && (
              <button
                onClick={handleSetFrame}
                disabled={saving || uploading}
                className="flex items-center justify-center gap-2 theme-btn-secondary px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                <Image className="w-4 h-4" />
                {saving ? "Saving…" : "Use current frame"}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || uploading}
              className="flex items-center justify-center gap-2 theme-btn-secondary px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload image"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
