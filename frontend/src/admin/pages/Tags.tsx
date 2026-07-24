import { useCallback, useEffect, useState } from "react";
import { Tag as TagIcon, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { mediaApi, type Tag } from "../../lib/api";
import { useGallery } from "../../contexts/GalleryContext";
import { useToast } from "../../contexts/ToastContext";

export default function Tags() {
  const { showToast } = useToast();
  const { refreshTags } = useGallery();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mediaApi.getAllTags();
      setTags(res.data);
    } catch {
      showToast("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const unusedTags = tags.filter((t) => t.media_count === 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await mediaApi.deleteTag(deleteTarget.id);
      setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("Tag deleted", "success");
      setDeleteTarget(null);
      refreshTags();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to delete tag",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBusy(true);
    let deleted = 0;
    for (const tag of unusedTags) {
      try {
        await mediaApi.deleteTag(tag.id);
        deleted++;
      } catch {
        // continue with the rest
      }
    }
    setBusy(false);
    setConfirmBulk(false);
    showToast(
      `Deleted ${deleted} unused tag${deleted === 1 ? "" : "s"}`,
      "success",
    );
    load();
    refreshTags();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold theme-text-primary">Tags</h1>
        {unusedTags.length > 0 && (
          <button
            onClick={() => setConfirmBulk(true)}
            className="theme-btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Delete {unusedTags.length} unused
          </button>
        )}
      </div>

      <p className="theme-text-muted text-sm">
        Tags are attached to media from the Media page. Tags still in use cannot
        be deleted here.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-block h-12 rounded-xl" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="theme-card rounded-xl p-10 text-center">
          <TagIcon className="w-10 h-10 theme-text-muted mx-auto mb-3" />
          <p className="theme-text-secondary">No tags yet.</p>
        </div>
      ) : (
        <div
          className="theme-card rounded-xl divide-y"
          style={{ borderColor: "var(--card-border)" }}
        >
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <TagIcon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "var(--icon-tag)" }}
                />
                <span className="theme-text-primary text-sm font-medium truncate">
                  {tag.name}
                </span>
                <span className="theme-text-muted text-xs">
                  {tag.media_count} item{tag.media_count === 1 ? "" : "s"}
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget(tag)}
                disabled={tag.media_count > 0}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={
                  tag.media_count > 0
                    ? "Tag is in use — remove it from media first"
                    : "Delete tag"
                }
              >
                <Trash2
                  className="w-4 h-4"
                  style={{ color: "var(--status-error)" }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete tag"
        message={`Delete the tag "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={handleBulkDelete}
        title="Delete unused tags"
        message={`Delete all ${unusedTags.length} tags that are not attached to any media? This cannot be undone.`}
        confirmLabel="Delete all"
        danger
        loading={busy}
      />
    </div>
  );
}
