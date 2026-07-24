import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Edit2,
  ExternalLink,
  Image,
  Music,
  MoreVertical,
  Play,
  Search,
  Tag as TagIcon,
  Trash2,
  Video,
} from "lucide-react";
import SegmentedControl from "../../components/SegmentedControl";
import ConfirmDialog from "../components/ConfirmDialog";
import RenameModal from "../components/RenameModal";
import TagEditorModal from "../components/TagEditorModal";
import AdminThumbnailModal from "../components/AdminThumbnailModal";
import { mediaApi, type Media } from "../../lib/api";
import { formatDate, formatDuration, formatFileSize } from "../../lib/utils";
import { useGallery } from "../../contexts/GalleryContext";
import { useToast } from "../../contexts/ToastContext";

type TypeFilter = "all" | "video" | "audio";

const PAGE_SIZE = 50;

const STATUS_COLORS: Record<string, string> = {
  ready: "var(--status-success)",
  processing: "var(--status-warning)",
  uploading: "var(--status-info)",
  failed: "var(--status-error)",
};

export default function MediaLibrary() {
  const { showToast } = useToast();
  const { refreshMedia, refreshTags } = useGallery();
  const [items, setItems] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Media | null>(null);
  const [tagTarget, setTagTarget] = useState<Media | null>(null);
  const [thumbnailTarget, setThumbnailTarget] = useState<Media | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (skip: number, append: boolean) => {
      const res = await mediaApi.getMedia(
        skip,
        PAGE_SIZE,
        typeFilter === "all" ? undefined : typeFilter,
      );
      setTotal(res.data.total);
      setItems((prev) =>
        append ? [...prev, ...res.data.items] : res.data.items,
      );
    },
    [typeFilter],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPage(0, false)
      .catch(() => {
        if (!cancelled) showToast("Failed to load media", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPage, showToast]);

  const reload = useCallback(() => {
    loadPage(0, false).catch(() => {});
    refreshMedia();
  }, [loadPage, refreshMedia]);

  // Close row menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (m) =>
        m.filename.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.name.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mediaApi.deleteMedia(deleteTarget.id);
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("Media deleted", "success");
      setDeleteTarget(null);
      refreshMedia();
      refreshTags();
    } catch {
      showToast("Failed to delete media", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadPage(items.length, true);
    } catch {
      showToast("Failed to load more", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const rowMenu = (media: Media) => (
    <div
      className="relative"
      ref={menuOpenId === media.id ? menuRef : undefined}
    >
      <button
        onClick={() => setMenuOpenId(menuOpenId === media.id ? null : media.id)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 theme-text-muted" />
      </button>
      {menuOpenId === media.id && (
        <div className="absolute right-0 top-full mt-1 w-48 theme-dropdown rounded-lg py-1 z-[100] shadow-xl">
          <Link
            to={`/player/${media.id}`}
            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full"
            onClick={() => setMenuOpenId(null)}
          >
            <ExternalLink className="w-4 h-4" />
            Open player
          </Link>
          <button
            onClick={() => {
              setRenameTarget(media);
              setMenuOpenId(null);
            }}
            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={() => {
              setTagTarget(media);
              setMenuOpenId(null);
            }}
            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left"
          >
            <TagIcon className="w-4 h-4" />
            Edit tags
          </button>
          <button
            onClick={() => {
              setThumbnailTarget(media);
              setMenuOpenId(null);
            }}
            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left"
          >
            <Image className="w-4 h-4" />
            Edit thumbnail
          </button>
          <button
            onClick={() => {
              setDeleteTarget(media);
              setMenuOpenId(null);
            }}
            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left"
            style={{ color: "var(--status-error)" }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold theme-text-primary">Media</h1>
        <span className="text-sm theme-text-muted">
          {filtered.length} of {total} item{total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or tag…"
            className="w-full pl-9 pr-3 py-2 rounded-lg theme-input focus:outline-none text-sm"
          />
        </div>
        <SegmentedControl<TypeFilter>
          options={[
            { value: "all", label: "All" },
            { value: "video", label: "Video" },
            { value: "audio", label: "Audio" },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-block h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-card rounded-xl p-10 text-center">
          <p className="theme-text-secondary">
            {search ? "No media matches your search." : "No media yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block theme-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left theme-text-muted border-b"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Plays</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                    <th className="px-4 py-3 font-medium">Added</th>
                    <th className="px-4 py-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((media) => (
                    <tr
                      key={media.id}
                      className="border-b last:border-b-0 hover:bg-white/[0.03] transition-colors"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {media.thumbnail_path ? (
                            <img
                              src={media.thumbnail_path}
                              alt=""
                              className="w-14 h-9 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-14 h-9 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: "var(--card-bg-hover)" }}
                            >
                              {media.media_type === "video" ? (
                                <Video
                                  className="w-4 h-4"
                                  style={{ color: "var(--icon-video)" }}
                                />
                              ) : (
                                <Music
                                  className="w-4 h-4"
                                  style={{ color: "var(--icon-audio)" }}
                                />
                              )}
                            </div>
                          )}
                          <span
                            className="theme-text-primary font-medium truncate max-w-[260px]"
                            title={media.filename}
                          >
                            {media.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 capitalize theme-text-secondary">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{
                              background:
                                STATUS_COLORS[media.status] ??
                                "var(--text-muted)",
                            }}
                          />
                          {media.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 theme-text-secondary">
                        {media.duration ? formatDuration(media.duration) : "—"}
                      </td>
                      <td className="px-4 py-3 theme-text-secondary">
                        {media.file_size
                          ? formatFileSize(media.file_size)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 theme-text-secondary">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {media.play_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {media.tags && media.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {media.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="theme-button px-2 py-0.5 rounded-full text-xs"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {media.tags.length > 3 && (
                              <span className="text-xs theme-text-muted px-1 py-0.5">
                                +{media.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="theme-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 theme-text-secondary whitespace-nowrap">
                        {formatDate(media.created_at)}
                      </td>
                      <td className="px-4 py-3">{rowMenu(media)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-2">
            {filtered.map((media) => (
              <div
                key={media.id}
                className="theme-card rounded-xl p-3 flex items-center gap-3"
              >
                {media.thumbnail_path ? (
                  <img
                    src={media.thumbnail_path}
                    alt=""
                    className="w-16 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-10 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--card-bg-hover)" }}
                  >
                    {media.media_type === "video" ? (
                      <Video
                        className="w-4 h-4"
                        style={{ color: "var(--icon-video)" }}
                      />
                    ) : (
                      <Music
                        className="w-4 h-4"
                        style={{ color: "var(--icon-audio)" }}
                      />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="theme-text-primary text-sm font-medium truncate">
                    {media.filename}
                  </p>
                  <p className="text-xs theme-text-muted flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background:
                          STATUS_COLORS[media.status] ?? "var(--text-muted)",
                      }}
                    />
                    {media.duration ? formatDuration(media.duration) : "—"}
                    <span>·</span>
                    {media.play_count ?? 0} plays
                  </p>
                </div>
                {rowMenu(media)}
              </div>
            ))}
          </div>

          {/* Load more */}
          {!search && items.length < total && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="theme-btn-secondary px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading…"
                  : `Load more (${total - items.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <RenameModal
        media={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRenamed={reload}
      />
      <TagEditorModal
        media={tagTarget}
        onClose={() => setTagTarget(null)}
        onChanged={() => {
          reload();
          refreshTags();
        }}
      />
      <AdminThumbnailModal
        media={thumbnailTarget}
        onClose={() => setThumbnailTarget(null)}
        onChanged={reload}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete media"
        message={`Permanently delete "${deleteTarget?.filename ?? ""}"? This removes the original file, all streaming variants, and analytics. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
