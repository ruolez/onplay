import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Media } from "../lib/api";
import { formatDuration, formatLongDuration } from "../lib/utils";
import { usePlayer } from "../contexts/PlayerContext";
import { useGallery } from "../contexts/GalleryContext";
import SegmentedControl from "../components/SegmentedControl";
import GallerySkeleton from "../components/GallerySkeleton";
import EqualizerBars from "../components/EqualizerBars";
import DownloadButton from "../components/DownloadButton";
import { menuTriggerProps, useAnchoredMenu } from "../hooks/useAnchoredMenu";
import {
  Play,
  Music,
  Grid3x3,
  Info,
  List,
  MoreVertical,
  Tag as TagIcon,
  ChevronDown,
  Check,
  SearchX,
  UploadCloud,
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
  } = useGallery();

  // Local UI state (view mode)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("gallery-view") as "grid" | "list";
    if (saved) return saved;
    // Default to list on mobile (<=768px), grid on desktop
    return window.innerWidth <= 768 ? "list" : "grid";
  });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [mediaTypeMenuOpen, setMediaTypeMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { openPlayer, currentMedia, isPlaying } = usePlayer();
  const [searchParams] = useSearchParams();

  const cardMenu = useAnchoredMenu(96);

  // Refs for auto-scrolling to current track
  const mediaRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // Close tag filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tagFilterOpen &&
        !(e.target as Element).closest(".tag-filter-container")
      ) {
        setTagFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagFilterOpen]);

  // Close media type menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mediaTypeMenuOpen &&
        !(e.target as Element).closest(".media-type-menu-container")
      ) {
        setMediaTypeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mediaTypeMenuOpen]);

  // Auto-scroll to current track when it changes
  useEffect(() => {
    if (currentMedia) {
      const element = mediaRefs.current.get(currentMedia.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMedia?.id]);

  // Sync view mode from mobile bottom nav
  useEffect(() => {
    const handleViewModeChange = (e: CustomEvent<"grid" | "list">) => {
      setViewMode(e.detail);
    };
    window.addEventListener(
      "viewModeChange",
      handleViewModeChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "viewModeChange",
        handleViewModeChange as EventListener,
      );
  }, []);

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

  const toggleTagFilter = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleViewDetails = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    navigate(`/player/${mediaId}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent, item: Media) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(item);
    }
  };

  const handleCardClick = (item: Media) => {
    if (item.status === "ready") {
      openPlayer(item.id, sortedMedia, {
        fullscreen: item.media_type === "video",
      });

      // Auto-expand the in-app player when a song starts on mobile
      if (item.media_type === "audio" && window.innerWidth < 768) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("expandPlayer"));
        }, 150);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 pb-6 sm:pb-8 pt-4 sm:pt-16">
        <p className="sr-only" role="status">
          Loading media…
        </p>
        <GallerySkeleton view={viewMode} />
      </div>
    );
  }

  const cardMenuMedia = cardMenu.openId
    ? (sortedMedia.find((m) => m.id === cardMenu.openId) ?? null)
    : null;

  // Calculate total duration (filteredMedia and sortedMedia now come from context)
  const totalDuration = filteredMedia.reduce(
    (sum, item) => sum + (item.duration || 0),
    0,
  );

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 pb-6 sm:pb-8 pt-4 sm:pt-0">
      <h1 className="sr-only">Media Gallery</h1>
      {/* Controls - Sticky flush with nav (desktop only - mobile uses MobileBottomNav) */}
      <div className="hidden sm:block sticky top-14 sm:top-16 z-40 theme-nav backdrop-blur-md mb-6 sm:mb-8 space-y-2 py-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
        {/* Desktop: Type Filter + Tags Filter + Sort + View (all in one row) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Mobile: Media Type Dropdown - Now in MobileBottomNav */}
          <div className="hidden relative media-type-menu-container flex-shrink-0">
            <button
              onClick={() => setMediaTypeMenuOpen(!mediaTypeMenuOpen)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px] flex items-center justify-center gap-1 w-[70px] theme-btn-secondary hover:theme-btn-secondary ${
                filter !== "all" ? "ring-1 ring-white/30 bg-white/10" : ""
              }`}
              title="Filter by media type"
            >
              {filter === "all" ? (
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--icon-all)" }}
                >
                  All
                </span>
              ) : filter === "video" ? (
                <Play
                  className="w-5 h-5"
                  style={{ color: "var(--icon-video)" }}
                />
              ) : (
                <Music
                  className="w-5 h-5"
                  style={{ color: "var(--icon-audio)" }}
                />
              )}
              <ChevronDown className="w-3 h-3" />
            </button>
            {mediaTypeMenuOpen && (
              <div className="absolute left-0 mt-1 w-32 rounded-lg shadow-xl theme-dropdown z-50">
                {[
                  { value: "all" as const, label: "All", showText: true },
                  { value: "video" as const, label: "Video", showText: false },
                  { value: "audio" as const, label: "Audio", showText: false },
                ].map((option) => {
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value);
                        setMediaTypeMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 transition-colors theme-dropdown-item text-xs flex items-center justify-between first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="flex items-center gap-2">
                        {option.value === "all" ? (
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--icon-all)" }}
                          >
                            {option.label}
                          </span>
                        ) : option.value === "video" ? (
                          <Play
                            className="w-5 h-5"
                            style={{ color: "var(--icon-video)" }}
                          />
                        ) : (
                          <Music
                            className="w-5 h-5"
                            style={{ color: "var(--icon-audio)" }}
                          />
                        )}
                      </span>
                      {filter === option.value && (
                        <Check className="w-3.5 h-3.5 theme-text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop: SegmentedControl */}
          <SegmentedControl
            options={[
              { value: "all", label: "All" },
              { value: "video", label: "Video" },
              { value: "audio", label: "Audio" },
            ]}
            value={filter}
            onChange={setFilter}
            className="hidden sm:flex flex-initial"
          />

          {/* Desktop: Tag Filter Dropdown (between Type and Sort) */}
          {allTags.length > 0 && (
            <div className="hidden sm:block relative tag-filter-container flex-shrink-0">
              <button
                onClick={() => setTagFilterOpen(!tagFilterOpen)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center gap-1.5 w-auto theme-btn-secondary hover:theme-btn-secondary ${
                  selectedTags.length > 0
                    ? "ring-1 ring-white/30 bg-white/10"
                    : ""
                }`}
                title="Filter by tags"
              >
                <TagIcon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "var(--icon-tag)" }}
                />
                <span className="truncate flex-1 text-left">
                  {selectedTags.length === 0
                    ? "All"
                    : selectedTags.length === 1
                      ? allTags.find((t) => t.id === selectedTags[0])?.name
                      : `${selectedTags.length} selected`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              </button>
              {tagFilterOpen && (
                <div className="absolute left-0 mt-1 w-56 sm:w-64 rounded-lg shadow-xl theme-dropdown z-50 max-h-[60vh] overflow-y-auto">
                  {/* All option */}
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setTagFilterOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-sm sm:text-base flex items-center justify-between first:rounded-t-lg"
                  >
                    <span>All</span>
                    {selectedTags.length === 0 && (
                      <Check className="w-4 h-4 theme-text-primary" />
                    )}
                  </button>
                  {/* Divider */}
                  <div className="h-px bg-white/10 my-1" />
                  {/* Tag options with checkboxes */}
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTagFilter(tag.id)}
                        className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-sm sm:text-base flex items-center justify-between last:rounded-b-lg"
                      >
                        <span>{tag.name}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 theme-text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sort + View Toggle (desktop only - mobile uses MobileBottomNav) */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {/* Sort Dropdown */}
            <div className="relative sort-menu-container">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center gap-1.5 theme-btn-secondary hover:theme-btn-secondary"
                title="Sort options"
              >
                <span className="capitalize">{sortBy}</span>
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
                          setSortOrder("desc");
                        }
                        setSortMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 transition-colors theme-dropdown-item text-sm first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle - Single Button */}
            <button
              onClick={() =>
                toggleViewMode(viewMode === "grid" ? "list" : "grid")
              }
              className="p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center theme-btn-primary"
              title={
                viewMode === "grid"
                  ? "Switch to list view"
                  : "Switch to grid view"
              }
              aria-label={
                viewMode === "grid"
                  ? "Switch to list view"
                  : "Switch to grid view"
              }
            >
              {viewMode === "grid" ? (
                <List className="w-5 h-5" />
              ) : (
                <Grid3x3 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {sortedMedia.length === 0 ? (
        searchQuery || selectedTags.length > 0 || filter !== "all" ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <SearchX className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-60" />
            <p className="theme-text-primary text-lg font-medium mb-1">
              No matching media
            </p>
            <p className="theme-text-muted text-base sm:text-sm mb-6">
              {searchQuery
                ? `Nothing matches "${searchQuery}" with the current filters.`
                : "Nothing matches the current filters."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTags([]);
                setFilter("all");
              }}
              className="theme-btn-secondary px-5 py-3 rounded-lg font-medium min-h-[44px]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20 px-4">
            <UploadCloud className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-60" />
            <p className="theme-text-primary text-lg font-medium mb-1">
              No media yet
            </p>
            <p className="theme-text-muted text-base sm:text-sm">
              Nothing has been published yet. Check back soon.
            </p>
          </div>
        )
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-7 md:gap-y-8">
              {sortedMedia.map((item, index) => {
                const isCurrentTrack = currentMedia?.id === item.id;
                const isMenuOpen = cardMenu.openId === item.id;
                const playCount = item.play_count ?? 0;
                const tagNames = item.tags.map((tag) => tag.name).join(" · ");
                return (
                  <div
                    key={item.id}
                    ref={(el) => el && mediaRefs.current.set(item.id, el)}
                    onClick={() => handleCardClick(item)}
                    onKeyDown={(e) => handleCardKeyDown(e, item)}
                    role="button"
                    tabIndex={item.status === "ready" ? 0 : -1}
                    aria-label={`Play ${item.filename}`}
                    className={`group relative rounded-lg sm:rounded-xl transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--btn-primary-bg)] ${
                      item.status === "ready"
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {/* Artwork */}
                    <div
                      className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl"
                      style={{ background: "var(--btn-secondary-bg)" }}
                    >
                      {item.thumbnail_path && item.media_type === "video" ? (
                        // Square tile, widescreen frame: show the whole frame
                        // over a blurred, dimmed copy of itself instead of
                        // cropping its sides
                        <>
                          <img
                            src={item.thumbnail_path}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-150 blur-xl brightness-90 saturate-150"
                            loading={index < 6 ? "eager" : "lazy"}
                            decoding="async"
                          />
                          <img
                            src={item.thumbnail_path}
                            alt=""
                            className="relative w-full h-full object-contain"
                            loading={index < 6 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        </>
                      ) : item.thumbnail_path ? (
                        <img
                          src={item.thumbnail_path}
                          alt=""
                          className="w-full h-full object-cover"
                          loading={index < 6 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === "video" ? (
                            <Play
                              className="w-10 h-10 opacity-60"
                              style={{ color: "var(--icon-video)" }}
                            />
                          ) : (
                            <Music
                              className="w-10 h-10 opacity-60"
                              style={{ color: "var(--icon-audio)" }}
                            />
                          )}
                        </div>
                      )}

                      {/* Hairline edge so light artwork doesn't bleed into the page */}
                      <div
                        className="pointer-events-none absolute inset-0 rounded-[inherit] border"
                        style={{ borderColor: "var(--card-border)" }}
                      />

                      {/* Play affordance (hover-capable devices only) */}
                      {item.status === "ready" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity [@media(hover:hover)]:group-hover:opacity-100">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center scale-90 transition-transform [@media(hover:hover)]:group-hover:scale-100">
                            <Play
                              className="w-5 h-5 ml-0.5 text-white"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                      )}

                      {item.status !== "ready" && (
                        <div
                          className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-micro font-medium text-white ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </div>
                      )}

                      {isCurrentTrack && (
                        <div
                          className="absolute bottom-1.5 left-1.5 px-1.5 py-1 rounded-md bg-black/75 flex items-center"
                          style={{ color: "var(--btn-primary-bg)" }}
                        >
                          <EqualizerBars
                            playing={isPlaying}
                            className="!w-3.5 !h-3.5"
                          />
                        </div>
                      )}

                      {item.duration && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-micro font-semibold tabular-nums">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="mt-2 sm:mt-2.5 flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-base font-semibold leading-snug line-clamp-2 ${
                            isCurrentTrack ? "" : "theme-text-primary"
                          }`}
                          style={
                            isCurrentTrack
                              ? { color: "var(--btn-primary-bg)" }
                              : undefined
                          }
                          title={item.filename}
                        >
                          {item.filename}
                        </h3>
                        {(playCount > 0 || tagNames) && (
                          <p className="mt-0.5 flex items-center gap-1 text-caption sm:text-sm theme-text-muted min-w-0">
                            {playCount > 0 && (
                              <span className="flex items-center gap-1 flex-shrink-0 tabular-nums">
                                <Play
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  aria-hidden="true"
                                />
                                {playCount}
                                <span className="sr-only"> plays</span>
                              </span>
                            )}
                            {playCount > 0 && tagNames && (
                              <span aria-hidden="true">·</span>
                            )}
                            {tagNames && (
                              <span className="truncate">{tagNames}</span>
                            )}
                          </p>
                        )}
                      </div>

                      <button
                        {...menuTriggerProps}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cardMenu.toggle(item.id, e.currentTarget);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={`-mr-2 -mt-1.5 flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition-opacity hover:bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] ${
                          isMenuOpen
                            ? "opacity-100"
                            : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                        }`}
                        aria-label={`More options for ${item.filename}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertical className="w-5 h-5 theme-text-muted" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--card-border)]">
              {sortedMedia.map((item, index) => {
                const isCurrentTrack = currentMedia?.id === item.id;
                return (
                  <div
                    key={item.id}
                    ref={(el) => el && mediaRefs.current.set(item.id, el)}
                    onClick={() => handleCardClick(item)}
                    onKeyDown={(e) => handleCardKeyDown(e, item)}
                    role="button"
                    tabIndex={item.status === "ready" ? 0 : -1}
                    aria-label={`Play ${item.filename}`}
                    className={`relative transition-colors ${
                      item.status === "ready"
                        ? "cursor-pointer active:bg-white/5 sm:hover:bg-white/5"
                        : "cursor-default"
                    }`}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      ...(isCurrentTrack
                        ? {
                            background:
                              "color-mix(in srgb, var(--btn-primary-bg) 10%, transparent)",
                          }
                        : {}),
                    }}
                  >
                    <div className="flex items-center gap-3 px-1 xs:px-1.5 py-2">
                      {/* Artwork */}
                      <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                        {item.thumbnail_path ? (
                          <img
                            src={item.thumbnail_path}
                            alt=""
                            loading={index < 12 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "var(--card-bg)" }}
                          >
                            {item.media_type === "video" ? (
                              <Play
                                className="w-5 h-5"
                                style={{ color: "var(--icon-video)" }}
                              />
                            ) : (
                              <Music
                                className="w-5 h-5"
                                style={{ color: "var(--icon-audio)" }}
                              />
                            )}
                          </div>
                        )}

                        {/* Video type badge */}
                        {item.media_type === "video" &&
                          item.thumbnail_path &&
                          !isCurrentTrack && (
                            <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/70">
                              <Play
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                              />
                            </div>
                          )}

                        {/* Now-playing overlay */}
                        {isCurrentTrack && (
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black/55"
                            style={{ color: "var(--btn-primary-bg)" }}
                          >
                            <EqualizerBars
                              playing={isPlaying}
                              className="!w-4 !h-4"
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold text-base truncate flex-1 ${
                              isCurrentTrack ? "" : "theme-text-primary"
                            }`}
                            style={
                              isCurrentTrack
                                ? { color: "var(--btn-primary-bg)" }
                                : undefined
                            }
                          >
                            {item.filename}
                          </h3>

                          {/* Status badge inline */}
                          {item.status !== "ready" && (
                            <div
                              className={`px-1.5 py-0.5 rounded-full text-micro font-medium text-white flex-shrink-0 ${getStatusColor(item.status)}`}
                            >
                              {item.status}
                            </div>
                          )}
                        </div>

                        {/* Tags on second line - capped to one line */}
                        {item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 overflow-hidden">
                            {item.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-[1px] bg-white/10 rounded text-caption sm:text-[11px] sm:leading-4 theme-text-muted whitespace-nowrap"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="text-caption sm:text-[11px] sm:leading-4 theme-text-muted whitespace-nowrap">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Duration and Play Count - Right aligned */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-caption sm:text-sm theme-text-muted">
                        {item.duration && (
                          <span>{formatDuration(item.duration)}</span>
                        )}
                        {(item.play_count ?? 0) > 0 && (
                          <span className="hidden sm:inline">
                            {item.play_count} plays
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {item.status === "ready" && (
                        <DownloadButton
                          media={item}
                          variant="icon"
                          hideWhenUnavailable
                          className="hidden sm:flex flex-shrink-0 p-2.5 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] items-center justify-center"
                          iconClassName="w-3.5 h-3.5 theme-text-muted"
                        />
                      )}
                      <button
                        onClick={(e) => handleViewDetails(e, item.id)}
                        className="flex-shrink-0 p-2.5 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="View details"
                        aria-label={`View details for ${item.filename}`}
                      >
                        <Info className="w-3.5 h-3.5 theme-text-muted" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Duration Display */}
          <div
            className="mt-4 pt-3 border-t flex items-center justify-center gap-1.5 text-caption sm:text-xs theme-text-muted"
            style={{ borderColor: "var(--card-border)" }}
          >
            <span>{sortedMedia.length} items</span>
            <span>•</span>
            <span>{formatLongDuration(totalDuration)}</span>
          </div>
        </>
      )}

      {/* Card menu: one portal at the page root, not inside the card — React
          events bubble through portals, so a click here would reach the
          card's onClick and start playback */}
      {cardMenuMedia &&
        cardMenu.pos &&
        createPortal(
          <div
            ref={cardMenu.dropdownRef}
            role="menu"
            className="fixed w-56 theme-dropdown rounded-lg py-1 z-[130] shadow-xl"
            style={{
              right: cardMenu.pos.right,
              top: cardMenu.pos.top,
              bottom: cardMenu.pos.bottom,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                cardMenu.close();
                handleViewDetails(e, cardMenuMedia.id);
              }}
              className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left"
            >
              <Info className="w-4 h-4" />
              View details
            </button>
            {cardMenuMedia.status === "ready" && (
              <DownloadButton
                media={cardMenuMedia}
                variant="menu"
                onDownloaded={cardMenu.close}
              />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
