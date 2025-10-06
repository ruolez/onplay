import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mediaApi, Media, Tag } from "../lib/api";
import { formatDuration, formatFileSize, formatDate } from "../lib/utils";
import {
  Play,
  Music,
  Clock,
  HardDrive,
  Calendar,
  Trash2,
  Edit2,
  X,
  Search,
  Grid3x3,
  List,
  Tag as TagIcon,
} from "lucide-react";

export default function Gallery() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "video" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("gallery-view") as "grid" | "list") || "grid",
  );
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string | null;
  }>({ show: false, id: null });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [renameModal, setRenameModal] = useState<{
    show: boolean;
    id: string | null;
    currentName: string;
  }>({ show: false, id: null, currentName: "" });
  const [newFilename, setNewFilename] = useState("");
  const [loadTime] = useState(Date.now());
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tagModal, setTagModal] = useState<{
    show: boolean;
    mediaId: string | null;
  }>({ show: false, mediaId: null });
  const [tagInput, setTagInput] = useState("");
  const navigate = useNavigate();

  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("gallery-view", mode);
  };

  useEffect(() => {
    loadMedia();
    loadTags();
  }, [filter]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaApi.getMedia(
        0,
        100,
        filter === "all" ? undefined : filter,
      );
      setMedia(response.data.items);
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await mediaApi.getAllTags();
      setAllTags(response.data);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500 animate-pulse";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ show: true, id });
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await mediaApi.deleteMedia(deleteModal.id, deletePassword);
      setDeleteModal({ show: false, id: null });
      setDeletePassword("");
      loadMedia();
    } catch (error: any) {
      if (error.response?.status === 403) {
        setDeleteError("Invalid password");
      } else {
        setDeleteError("Failed to delete media");
      }
    }
  };

  const handleRenameClick = (
    e: React.MouseEvent,
    id: string,
    currentName: string,
  ) => {
    e.stopPropagation();
    setRenameModal({ show: true, id, currentName });
    setNewFilename(currentName);
  };

  const handleRename = async () => {
    if (!renameModal.id || !newFilename.trim()) return;

    try {
      await mediaApi.renameMedia(renameModal.id, newFilename);
      setRenameModal({ show: false, id: null, currentName: "" });
      loadMedia();
    } catch (error) {
      console.error("Failed to rename media:", error);
    }
  };

  const handleAddTag = async () => {
    if (!tagModal.mediaId || !tagInput.trim()) return;

    try {
      await mediaApi.addTagToMedia(tagModal.mediaId, tagInput.trim());
      setTagModal({ show: false, mediaId: null });
      setTagInput("");
      loadMedia();
      loadTags();
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (
    e: React.MouseEvent,
    mediaId: string,
    tagId: number,
  ) => {
    e.stopPropagation();

    try {
      await mediaApi.removeTagFromMedia(mediaId, tagId);
      loadMedia();
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const toggleTagFilter = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleTagClick = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    setTagModal({ show: true, mediaId });
    setTagInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="theme-text-primary text-xl">Loading media...</div>
      </div>
    );
  }

  // Filter media based on search query and tags (OR logic for tags)
  const filteredMedia = media.filter((item) => {
    const matchesSearch = item.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      item.tags.some((tag) => selectedTags.includes(tag.id));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Controls */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl theme-input focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              borderColor: "var(--card-border)",
            }}
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag.id)
                    ? "theme-btn-primary"
                    : "theme-btn-secondary"
                }`}
              >
                {tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 rounded-full text-sm font-medium theme-btn-secondary hover:bg-red-500/20 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            {["all", "video", "audio"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  filter === f ? "theme-btn-primary" : "theme-btn-secondary"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => toggleViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "theme-btn-primary"
                  : "theme-btn-secondary"
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "theme-btn-primary"
                  : "theme-btn-secondary"
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-20">
          <p className="theme-text-muted text-lg">
            {searchQuery
              ? `No media found matching "${searchQuery}"`
              : "No media files found. Upload some files to get started!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                item.status === "ready" && navigate(`/player/${item.id}`)
              }
              className={`group relative theme-card rounded-xl overflow-hidden hover:scale-105 ${
                item.status === "ready" ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video"
                style={{ background: "var(--card-bg)" }}
              >
                {item.thumbnail_path ? (
                  <img
                    src={`http://localhost:9090${item.thumbnail_path}?t=${loadTime}`}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {item.media_type === "video" ? (
                      <Play className="w-16 h-16 theme-text-muted opacity-50" />
                    ) : (
                      <Music className="w-16 h-16 theme-text-muted opacity-50" />
                    )}
                  </div>
                )}

                {/* Play overlay */}
                {item.status === "ready" && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-16 h-16 theme-text-primary drop-shadow-lg" />
                  </div>
                )}

                {/* Status badge - only show if not ready */}
                {item.status !== "ready" && (
                  <div className="absolute top-2 right-2">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="theme-text-primary font-medium truncate flex-1">
                    {item.filename}
                  </h3>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => handleTagClick(e, item.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Add tag"
                    >
                      <TagIcon className="w-4 h-4 theme-text-muted" />
                    </button>
                    <button
                      onClick={(e) =>
                        handleRenameClick(e, item.id, item.filename)
                      }
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4 theme-text-muted" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, item.id)}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm theme-text-muted">
                  {item.duration && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  )}
                  {item.file_size && (
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4" />
                      <span>{formatFileSize(item.file_size)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag.id}
                        onClick={(e) => handleRemoveTag(e, item.id, tag.id)}
                        className="px-2 py-0.5 bg-white/10 hover:bg-red-500/20 rounded text-xs theme-text-secondary cursor-pointer transition-colors"
                        title="Click to remove"
                      >
                        {tag.name} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                item.status === "ready" && navigate(`/player/${item.id}`)
              }
              className={`theme-card rounded-xl p-4 transition-all ${
                item.status === "ready"
                  ? "cursor-pointer hover:scale-[1.02]"
                  : "cursor-default"
              }`}
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div
                  className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: "var(--card-bg)" }}
                >
                  {item.thumbnail_path ? (
                    <img
                      src={`http://localhost:9090${item.thumbnail_path}?t=${loadTime}`}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {item.media_type === "video" ? (
                        <Play className="w-10 h-10 theme-text-muted opacity-50" />
                      ) : (
                        <Music className="w-10 h-10 theme-text-muted opacity-50" />
                      )}
                    </div>
                  )}

                  {/* Status badge */}
                  {item.status !== "ready" && (
                    <div className="absolute top-2 right-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </div>
                    </div>
                  )}

                  {/* Play overlay */}
                  {item.status === "ready" && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 theme-text-primary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="theme-text-primary font-medium text-lg truncate flex-1">
                      {item.filename}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm theme-text-muted mb-2">
                    <div className="flex items-center space-x-1">
                      <span className="capitalize font-medium">
                        {item.media_type}
                      </span>
                    </div>
                    {item.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    )}
                    {item.file_size && (
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatFileSize(item.file_size)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag.id}
                          onClick={(e) => handleRemoveTag(e, item.id, tag.id)}
                          className="px-2 py-0.5 bg-white/10 hover:bg-red-500/20 rounded text-xs theme-text-secondary cursor-pointer transition-colors"
                          title="Click to remove"
                        >
                          {tag.name} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleTagClick(e, item.id)}
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    title="Add tag"
                  >
                    <TagIcon className="w-4 h-4 theme-text-muted" />
                  </button>
                  <button
                    onClick={(e) =>
                      handleRenameClick(e, item.id, item.filename)
                    }
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4 theme-text-muted" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, item.id)}
                    className="p-2 rounded hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setDeleteModal({ show: false, id: null })}
        >
          <div
            className="theme-card rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold theme-text-primary">
                Delete Media
              </h2>
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="theme-text-muted hover:theme-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="theme-text-secondary mb-4">
              Enter password to delete this media file. This action cannot be
              undone.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              placeholder="Password"
              className="theme-input w-full px-4 py-2 rounded-lg mb-2"
              autoFocus
            />
            {deleteError && (
              <p className="text-red-500 text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="flex-1 theme-btn-secondary px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.show && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() =>
            setRenameModal({ show: false, id: null, currentName: "" })
          }
        >
          <div
            className="theme-card rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold theme-text-primary">
                Rename Media
              </h2>
              <button
                onClick={() =>
                  setRenameModal({ show: false, id: null, currentName: "" })
                }
                className="theme-text-muted hover:theme-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              placeholder="New filename"
              className="theme-input w-full px-4 py-2 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setRenameModal({ show: false, id: null, currentName: "" })
                }
                className="flex-1 theme-btn-secondary px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="flex-1 theme-btn-primary px-4 py-2 rounded-lg font-medium"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {tagModal.show && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setTagModal({ show: false, mediaId: null })}
        >
          <div
            className="theme-card rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold theme-text-primary">Add Tag</h2>
              <button
                onClick={() => setTagModal({ show: false, mediaId: null })}
                className="theme-text-muted hover:theme-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="Tag name"
              className="theme-input w-full px-4 py-2 rounded-lg mb-4"
              autoFocus
            />
            {allTags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm theme-text-muted mb-2">
                  Existing tags (click to use):
                </p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setTagInput(tag.name)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs theme-text-secondary transition-colors"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setTagModal({ show: false, mediaId: null })}
                className="flex-1 theme-btn-secondary px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                className="flex-1 theme-btn-primary px-4 py-2 rounded-lg font-medium"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
