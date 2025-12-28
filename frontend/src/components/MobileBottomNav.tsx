/**
 * MobileBottomNav - Bottom filter controls for mobile devices
 *
 * Glassmorphism-styled bottom bar with unified button design.
 * Only visible on mobile (hidden on md+ breakpoints).
 */

import { useState, useEffect } from "react";
import {
  Music,
  Play,
  ChevronUp,
  Check,
  Tag as TagIcon,
  Grid3x3,
  List,
} from "lucide-react";
import { useGallery } from "../contexts/GalleryContext";
import { useLocation } from "react-router-dom";

type FilterType = "all" | "video" | "audio";
type SortType = "new" | "name" | "popular" | "duration";

export default function MobileBottomNav() {
  const location = useLocation();
  const {
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedTags,
    setSelectedTags,
    allTags,
  } = useGallery();

  const [mediaTypeMenuOpen, setMediaTypeMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("gallery-view") as "grid" | "list";
    if (saved) return saved;
    return window.innerWidth <= 768 ? "list" : "grid";
  });

  // Close menus when clicking outside
  // IMPORTANT: This useEffect must be BEFORE any early returns to follow React's rules of hooks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mediaTypeMenuOpen &&
        !(e.target as Element).closest(".mobile-media-type-menu")
      ) {
        setMediaTypeMenuOpen(false);
      }
      if (sortMenuOpen && !(e.target as Element).closest(".mobile-sort-menu")) {
        setSortMenuOpen(false);
      }
      if (
        tagFilterOpen &&
        !(e.target as Element).closest(".mobile-tag-filter")
      ) {
        setTagFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mediaTypeMenuOpen, sortMenuOpen, tagFilterOpen]);

  // Only show on Gallery page (must be AFTER all hooks)
  if (location.pathname !== "/") {
    return null;
  }

  // Position dropdowns just above the bottom nav bar
  const dropdownBottom = "62px";

  const toggleTagFilter = (tagId: number) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId],
    );
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    localStorage.setItem("gallery-view", newMode);
    window.dispatchEvent(
      new CustomEvent("viewModeChange", { detail: newMode }),
    );
  };

  // Unified button base style - ghost style with subtle hover
  const buttonBase =
    "rounded-xl transition-all min-h-[48px] flex items-center justify-center gap-2 active:scale-95";
  const buttonInactive = "bg-white/5 hover:bg-white/10";
  const buttonActive = "bg-white/15";

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 z-[95]"
      style={{
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-2.5 xs:py-3">
        {/* Media Type Dropdown */}
        <div className="relative mobile-media-type-menu w-[80px] xs:w-[90px]">
          <button
            onClick={() => {
              setMediaTypeMenuOpen(!mediaTypeMenuOpen);
              setSortMenuOpen(false);
              setTagFilterOpen(false);
            }}
            className={`w-full px-2 ${buttonBase} ${filter !== "all" ? buttonActive : buttonInactive}`}
          >
            {filter === "all" ? (
              <span className="text-sm font-medium theme-text-primary">
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
            <ChevronUp
              className={`w-4 h-4 theme-text-muted transition-transform ${mediaTypeMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {mediaTypeMenuOpen && (
            <div
              className="fixed left-2 right-2 xs:left-3 xs:right-3 rounded-xl shadow-2xl z-[200] overflow-hidden"
              style={{
                bottom: dropdownBottom,
                background: "rgba(30, 30, 30, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {[
                { value: "all" as FilterType, label: "All", icon: null },
                {
                  value: "video" as FilterType,
                  label: "Video",
                  icon: (
                    <Play
                      className="w-5 h-5"
                      style={{ color: "var(--icon-video)" }}
                    />
                  ),
                },
                {
                  value: "audio" as FilterType,
                  label: "Audio",
                  icon: (
                    <Music
                      className="w-5 h-5"
                      style={{ color: "var(--icon-audio)" }}
                    />
                  ),
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value);
                    setMediaTypeMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3.5 transition-colors flex items-center justify-between ${
                    filter === option.value ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {option.icon || <span className="w-5" />}
                    <span className="text-sm font-medium theme-text-primary">
                      {option.label}
                    </span>
                  </span>
                  {filter === option.value && (
                    <Check className="w-4 h-4 theme-text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tag Filter Dropdown */}
        <div className="relative mobile-tag-filter">
          <button
            onClick={() => {
              setTagFilterOpen(!tagFilterOpen);
              setMediaTypeMenuOpen(false);
              setSortMenuOpen(false);
            }}
            className={`w-[80px] xs:w-[90px] ${buttonBase} ${selectedTags.length > 0 ? buttonActive : buttonInactive}`}
          >
            <div className="relative">
              <TagIcon
                className="w-5 h-5"
                style={{ color: "var(--icon-tag)" }}
              />
              {selectedTags.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                  }}
                >
                  {selectedTags.length}
                </span>
              )}
            </div>
          </button>

          {tagFilterOpen && (
            <div
              className="fixed left-2 right-2 xs:left-3 xs:right-3 rounded-xl shadow-2xl z-[200] max-h-[50vh] overflow-y-auto"
              style={{
                bottom: dropdownBottom,
                background: "rgba(30, 30, 30, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* All option */}
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setTagFilterOpen(false);
                }}
                className={`w-full px-4 py-3.5 transition-colors flex items-center justify-between ${
                  selectedTags.length === 0 ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-medium theme-text-primary">
                  All Tags
                </span>
                {selectedTags.length === 0 && (
                  <Check className="w-4 h-4 theme-text-primary" />
                )}
              </button>
              {/* Divider */}
              <div className="h-px bg-white/10 mx-3" />
              {/* Tag options */}
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`w-full px-4 py-3.5 transition-colors flex items-center justify-between ${
                      isSelected ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-sm font-medium theme-text-primary">
                      {tag.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 theme-text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative mobile-sort-menu">
          <button
            onClick={() => {
              setSortMenuOpen(!sortMenuOpen);
              setMediaTypeMenuOpen(false);
              setTagFilterOpen(false);
            }}
            className={`px-3 xs:px-5 ${buttonBase} ${buttonInactive}`}
          >
            <span className="text-sm font-medium theme-text-primary capitalize">
              {sortBy}
            </span>
            <span className="text-xs theme-text-muted">
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          </button>

          {sortMenuOpen && (
            <div
              className="fixed left-2 right-2 xs:left-3 xs:right-3 rounded-xl shadow-2xl z-[200] overflow-hidden"
              style={{
                bottom: dropdownBottom,
                background: "rgba(30, 30, 30, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {[
                { value: "new" as SortType, label: "Newest" },
                { value: "name" as SortType, label: "Name" },
                { value: "popular" as SortType, label: "Popular" },
                { value: "duration" as SortType, label: "Duration" },
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
                  className={`w-full px-4 py-3.5 transition-colors flex items-center justify-between ${
                    sortBy === option.value ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm font-medium theme-text-primary">
                    {option.label}
                  </span>
                  {sortBy === option.value && (
                    <span className="text-xs theme-text-muted">
                      {sortOrder === "asc" ? "Ascending" : "Descending"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <button
          onClick={toggleViewMode}
          className={`w-[44px] xs:w-[48px] ${buttonBase} ${buttonInactive}`}
          aria-label={
            viewMode === "grid" ? "Switch to list view" : "Switch to grid view"
          }
        >
          {viewMode === "grid" ? (
            <List className="w-5 h-5 theme-text-primary" />
          ) : (
            <Grid3x3 className="w-5 h-5 theme-text-primary" />
          )}
        </button>
      </div>
    </nav>
  );
}
