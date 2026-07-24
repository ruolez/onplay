import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Modal from "./Modal";
import { mediaApi, type Media, type Tag } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type TagEditorModalProps = {
  media: Media | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function TagEditorModal({
  media,
  onClose,
  onChanged,
}: TagEditorModalProps) {
  const { showToast } = useToast();
  const [currentTags, setCurrentTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCurrentTags(media?.tags ?? []);
    setInput("");
    if (media) {
      mediaApi
        .getAllTags()
        .then((res) => setAllTags(res.data))
        .catch(() => {});
    }
  }, [media]);

  const addTag = async (name: string) => {
    const trimmed = name.trim();
    if (!media || !trimmed || busy) return;
    if (
      currentTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setInput("");
      return;
    }
    setBusy(true);
    try {
      const res = await mediaApi.addTagToMedia(media.id, trimmed);
      setCurrentTags((prev) => [...prev, res.data.tag]);
      setInput("");
      onChanged();
    } catch {
      showToast("Failed to add tag", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async (tagId: number) => {
    if (!media || busy) return;
    setBusy(true);
    try {
      await mediaApi.removeTagFromMedia(media.id, tagId);
      setCurrentTags((prev) => prev.filter((t) => t.id !== tagId));
      onChanged();
    } catch {
      showToast("Failed to remove tag", "error");
    } finally {
      setBusy(false);
    }
  };

  const suggestions = allTags.filter(
    (t) =>
      !currentTags.some((c) => c.id === t.id) &&
      (!input || t.name.toLowerCase().includes(input.toLowerCase())),
  );

  return (
    <Modal open={!!media} onClose={onClose} title="Edit tags">
      <div className="space-y-4">
        {/* Current tags */}
        <div>
          <p className="text-xs theme-text-muted mb-2">Current tags</p>
          {currentTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => removeTag(tag.id)}
                  className="group theme-button px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 hover:!bg-red-500/20 hover:!text-red-400 hover:!border-red-500/50 transition-all"
                  title="Remove tag"
                >
                  <span>{tag.name}</span>
                  <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm theme-text-secondary">No tags yet.</p>
          )}
        </div>

        {/* Add tag */}
        <div>
          <p className="text-xs theme-text-muted mb-2">Add a tag</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag(input);
              }}
              placeholder="Type a tag name…"
              className="flex-1 px-3 py-2 rounded-lg theme-input focus:outline-none text-sm"
            />
            <button
              onClick={() => addTag(input)}
              disabled={busy || !input.trim()}
              className="theme-btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>

        {/* Existing tag quick-select */}
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs theme-text-muted mb-2">Existing tags</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.name)}
                  disabled={busy}
                  className="theme-button px-3 py-1.5 rounded-full text-sm disabled:opacity-60"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
