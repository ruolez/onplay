import { useEffect, useState } from "react";
import Modal from "./Modal";
import { mediaApi, type Tag } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type RenameTagModalProps = {
  tag: Tag | null;
  onClose: () => void;
  onRenamed: (tag: Tag) => void;
};

export default function RenameTagModal({
  tag,
  onClose,
  onRenamed,
}: RenameTagModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(tag?.name ?? "");
  }, [tag]);

  const trimmed = name.trim();
  const unchanged = trimmed === tag?.name;

  const handleSave = async () => {
    if (!tag || !trimmed || unchanged || saving) return;
    setSaving(true);
    try {
      const res = await mediaApi.renameTag(tag.id, trimmed);
      showToast("Tag renamed", "success");
      onRenamed(res.data);
      onClose();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to rename tag",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!tag}
      onClose={onClose}
      title="Rename tag"
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
            disabled={saving || !trimmed || unchanged}
            className="theme-btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        autoFocus
        className="w-full px-3 py-2.5 rounded-lg theme-input focus:outline-none"
        placeholder="Tag name"
      />
    </Modal>
  );
}
