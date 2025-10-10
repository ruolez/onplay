import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mediaApi, Media } from "../lib/api";
import { formatDuration, formatLongDuration } from "../lib/utils";
import { usePlayer } from "../contexts/PlayerContext";
import { useGallery } from "../contexts/GalleryContext";
import SegmentedControl from "../components/SegmentedControl";
import {
  Play,
  Music,
  Clock,
  Trash2,
  Edit2,
  X,
  Search,
  Grid3x3,
  List,
  Tag as TagIcon,
  MoreVertical,
  ArrowUpDown,
} from "lucide-react";

export default function Gallery() {
  // Use Gallery context for state management
  const {
    loading,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedTags,
    setSelectedTags,
    filteredMedia,
    sortedMedia,
    allTags,
    refreshMedia,
    refreshTags,
  } = useGallery();

  // Local UI state (view mode, modals)
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
  const [tagModal, setTagModal] = useState<{
    show: boolean;
    mediaId: string | null;
  }>({ show: false, mediaId: null });
  const [tagInput, setTagInput] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { openPlayer, requestFullscreen } = usePlayer();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read search from URL params
  const urlSearchQuery = searchParams.get("q") || "";

  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("gallery-view", mode);
  };

  // Sync URL search query to context state
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery, setSearchQuery]);

  // Update URL when search changes (desktop only - mobile uses top bar)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortMenuOpen &&
        !(e.target as Element).closest(".sort-menu-container")
      ) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortMenuOpen]);

  // Close three-dots menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as Element).closest(".media-menu-container")) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
      refreshMedia();
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
      refreshMedia();
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
      refreshMedia();
      refreshTags();
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
      refreshMedia();
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

  const handleMenuClick = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === mediaId ? null : mediaId);
  };

  const handleViewDetails = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    navigate(`/player/${mediaId}`);
  };

  const handleCardClick = (item: Media) => {
    if (item.status === "ready") {
      openPlayer(item.id, sortedMedia);

      // Request fullscreen for videos after player initializes
      if (item.media_type === "video") {
        setTimeout(() => {
          requestFullscreen();
        }, 800);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="theme-text-primary text-xl">Loading media...</div>
      </div>
    );
  }

  // Calculate total duration (filteredMedia and sortedMedia now come from context)
  const totalDuration = filteredMedia.reduce(
    (sum, item) => sum + (item.duration || 0),
    0,
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-6 sm:pb-8">
      {/* Controls */}
      <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <SegmentedControl
            options={[
              { value: "all", label: "All" },
              { value: "video", label: "Video" },
              { value: "audio", label: "Audio" },
            ]}
            value={filter}
            onChange={setFilter}
            className="flex-1 sm:flex-initial"
          />

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Sort Dropdown */}
            <div className="relative sort-menu-container">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 theme-btn-secondary hover:theme-btn-secondary"
                title="Sort options"
              >
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline capitalize">{sortBy}</span>
                <span className="text-[10px]">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg shadow-xl theme-dropdown z-50">
                  {[
                    { value: "new" as const, label: "New" },
                    { value: "name" as const, label: "Name" },
                    { value: "popular" as const, label: "Popular" },
                    { value: "duration" as const, label: "Duration" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (sortBy === option.value) {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy(option.value);
                          setSortOrder("asc");
                        }
                        setSortMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs sm:text-sm flex items-center justify-between first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <span className="text-[10px]">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => toggleViewMode("grid")}
                className={`p-2 rounded-lg transition-all min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center ${
                  viewMode === "grid"
                    ? "theme-btn-primary"
                    : "theme-btn-secondary"
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => toggleViewMode("list")}
                className={`p-2 rounded-lg transition-all min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center ${
                  viewMode === "list"
                    ? "theme-btn-primary"
                    : "theme-btn-secondary"
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[36px] ${
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
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium theme-btn-secondary hover:bg-red-500/20 transition-colors min-h-[36px]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Grid/List */}
      {sortedMedia.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <p className="theme-text-muted text-base sm:text-lg px-4">
            {searchQuery
              ? `No media found matching "${searchQuery}"`
              : "No media files found. Upload some files to get started!"}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {sortedMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative theme-card rounded-lg sm:rounded-xl transition-transform active:scale-95 sm:hover:scale-105 ${
                    item.status === "ready"
                      ? "cursor-pointer"
                      : "cursor-default"
                  } ${menuOpen === item.id ? "z-[110]" : ""}`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video overflow-hidden rounded-t-lg sm:rounded-t-xl"
                    style={{ background: "var(--card-bg)" }}
                  >
                    {item.thumbnail_path ? (
                      <img
                        src={`${item.thumbnail_path}?t=${loadTime}`}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {item.media_type === "video" ? (
                          <Play
                            className="w-16 h-16 opacity-50"
                            style={{ color: "var(--icon-video)" }}
                          />
                        ) : (
                          <Music
                            className="w-16 h-16 opacity-50"
                            style={{ color: "var(--icon-audio)" }}
                          />
                        )}
                      </div>
                    )}

                    {/* Play overlay */}
                    {item.status === "ready" && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: "var(--card-overlay)" }}
                      >
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
                  <div className="p-2 sm:p-4">
                    {/* Filename - First Line */}
                    <h3 className="theme-text-primary font-medium truncate text-xs sm:text-sm mb-1 sm:mb-2">
                      {item.filename}
                    </h3>

                    {/* Duration and Three-Dots Menu - Second Line */}
                    <div className="hidden sm:flex items-center justify-between mb-1 sm:mb-2">
                      {/* Duration - Left aligned */}
                      <div className="flex items-center space-x-2 text-xs sm:text-sm theme-text-muted">
                        {item.duration && (
                          <>
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{formatDuration(item.duration)}</span>
                          </>
                        )}
                      </div>

                      {/* Three-Dots Menu - Right aligned */}
                      <div className="relative media-menu-container">
                        <button
                          onClick={(e) => handleMenuClick(e, item.id)}
                          className="p-1.5 rounded hover:bg-white/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4 theme-text-muted" />
                        </button>
                        {menuOpen === item.id && (
                          <div className="absolute right-0 mt-1 w-40 rounded-lg shadow-xl theme-dropdown z-[100]">
                            <button
                              onClick={(e) => handleViewDetails(e, item.id)}
                              className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2 first:rounded-t-lg"
                            >
                              <Play className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => handleTagClick(e, item.id)}
                              className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2"
                            >
                              <TagIcon className="w-3.5 h-3.5" />
                              Add Tag
                            </button>
                            <button
                              onClick={(e) =>
                                handleRenameClick(e, item.id, item.filename)
                              }
                              className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, item.id)}
                              className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2 last:rounded-b-lg text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 sm:px-2 py-0.5 bg-white/10 rounded text-xs theme-text-secondary"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedMedia.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`relative theme-card rounded-lg p-2 transition-all ${
                    item.status === "ready"
                      ? "cursor-pointer active:scale-[0.98] sm:hover:scale-[1.02]"
                      : "cursor-default"
                  } ${menuOpen === item.id ? "z-[110]" : ""}`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className="flex items-center gap-2">
                    {/* Number */}
                    <div className="flex-shrink-0 w-6 text-right">
                      <span className="text-xs theme-text-muted font-mono">
                        {index + 1}
                      </span>
                    </div>

                    {/* Media Type Icon */}
                    <div className="flex-shrink-0">
                      {item.media_type === "video" ? (
                        <Play
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

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="theme-text-primary font-medium text-xs sm:text-sm truncate flex-1">
                          {item.filename}
                        </h3>

                        {/* Status badge inline */}
                        {item.status !== "ready" && (
                          <div
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white flex-shrink-0 ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </div>
                        )}
                      </div>

                      {/* Tags on second line */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-1 py-[1px] bg-white/10 rounded text-[10px] theme-text-secondary"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Duration and Play Count - Right aligned */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-[10px] sm:text-xs theme-text-muted">
                      {item.duration && (
                        <div className="flex items-center space-x-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(item.duration)}</span>
                        </div>
                      )}
                      {(item.play_count ?? 0) > 0 && (
                        <div className="flex items-center space-x-0.5">
                          <Play className="w-3 h-3" />
                          <span>{item.play_count} plays</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 relative media-menu-container">
                      <button
                        onClick={(e) => handleMenuClick(e, item.id)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5 theme-text-muted" />
                      </button>
                      {menuOpen === item.id && (
                        <div className="absolute right-0 mt-1 w-40 rounded-lg shadow-xl theme-dropdown z-[100]">
                          <button
                            onClick={(e) => handleViewDetails(e, item.id)}
                            className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2 first:rounded-t-lg"
                          >
                            <Play className="w-3.5 h-3.5" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => handleTagClick(e, item.id)}
                            className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2"
                          >
                            <TagIcon className="w-3.5 h-3.5" />
                            Add Tag
                          </button>
                          <button
                            onClick={(e) =>
                              handleRenameClick(e, item.id, item.filename)
                            }
                            className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Rename
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, item.id)}
                            className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-xs flex items-center gap-2 last:rounded-b-lg text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Duration Display */}
          <div
            className="mt-4 pt-3 border-t flex items-center justify-center gap-1.5 text-xs theme-text-muted"
            style={{ borderColor: "var(--card-border)" }}
          >
            <span>{sortedMedia.length} items</span>
            <span>•</span>
            <span>{formatLongDuration(totalDuration)}</span>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm px-4"
          onClick={() => setDeleteModal({ show: false, id: null })}
        >
          <div
            className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold theme-text-primary">
                Delete Media
              </h2>
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="theme-text-muted hover:theme-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="theme-text-secondary mb-3 sm:mb-4 text-sm sm:text-base">
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
              className="theme-input w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2 text-sm sm:text-base"
              autoFocus
            />
            {deleteError && (
              <p className="text-red-500 text-sm mb-3 sm:mb-4">{deleteError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="flex-1 theme-btn-secondary px-4 py-3 rounded-lg font-medium min-h-[48px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors min-h-[48px] text-sm sm:text-base"
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm px-4"
          onClick={() =>
            setRenameModal({ show: false, id: null, currentName: "" })
          }
        >
          <div
            className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold theme-text-primary">
                Rename Media
              </h2>
              <button
                onClick={() =>
                  setRenameModal({ show: false, id: null, currentName: "" })
                }
                className="theme-text-muted hover:theme-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                aria-label="Close"
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
              className="theme-input w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() =>
                  setRenameModal({ show: false, id: null, currentName: "" })
                }
                className="flex-1 theme-btn-secondary px-4 py-3 rounded-lg font-medium min-h-[48px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="flex-1 theme-btn-primary px-4 py-3 rounded-lg font-medium min-h-[48px] text-sm sm:text-base"
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm px-4"
          onClick={() => setTagModal({ show: false, mediaId: null })}
        >
          <div
            className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold theme-text-primary">
                Add Tag
              </h2>
              <button
                onClick={() => setTagModal({ show: false, mediaId: null })}
                className="theme-text-muted hover:theme-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                aria-label="Close"
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
              className="theme-input w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base"
              autoFocus
            />
            {allTags.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm theme-text-muted mb-2">
                  Existing tags (click to use):
                </p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setTagInput(tag.name)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs theme-text-secondary transition-colors min-h-[36px]"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setTagModal({ show: false, mediaId: null })}
                className="flex-1 theme-btn-secondary px-4 py-3 rounded-lg font-medium min-h-[48px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                className="flex-1 theme-btn-primary px-4 py-3 rounded-lg font-medium min-h-[48px] text-sm sm:text-base"
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
