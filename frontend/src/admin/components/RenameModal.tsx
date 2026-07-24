import { useEffect, useState } from "react";
import Modal from "./Modal";
import { mediaApi, type Media } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type RenameModalProps = {
  media: Media | null;
  onClose: () => void;
  onRenamed: () => void;
};

export default function RenameModal({
  media,
  onClose,
  onRenamed,
}: RenameModalProps) {
  const { showToast } = useToast();
  const [filename, setFilename] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFilename(media?.filename ?? "");
  }, [media]);

  const handleSave = async () => {
    if (!media || !filename.trim()) return;
    setSaving(true);
    try {
      await mediaApi.renameMedia(media.id, filename.trim());
      showToast("Media renamed", "success");
      onRenamed();
      onClose();
    } catch {
      showToast("Failed to rename media", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!media}
      onClose={onClose}
      title="Rename media"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={saving}
            className="theme-btn-secondary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !filename.trim()}
            className="theme-btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <input
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        autoFocus
        className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
        placeholder="Filename"
      />
    </Modal>
  );
}
