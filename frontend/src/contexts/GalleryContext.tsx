import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { mediaApi, Media, Tag } from "../lib/api";

interface GalleryContextType {
  // Raw media list
  media: Media[];
  loading: boolean;

  // Filters
  filter: "all" | "video" | "audio";
  searchQuery: string;
  selectedTags: number[];
  sortBy: "name" | "duration" | "popular" | "new";
  sortOrder: "asc" | "desc";

  // Derived data
  filteredMedia: Media[];
  sortedMedia: Media[];

  // Actions
  setFilter: (filter: "all" | "video" | "audio") => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: number[] | ((prev: number[]) => number[])) => void;
  setSortBy: (sort: "name" | "duration" | "popular" | "new") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  refreshMedia: () => Promise<void>;

  // Tags
  allTags: Tag[];
  refreshTags: () => Promise<void>;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Filter states
  const [filter, setFilter] = useState<"all" | "video" | "audio">(
    () =>
      (localStorage.getItem("gallery-filter") as "all" | "video" | "audio") ||
      "all",
  );

  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem("gallery-search") || "";
  });

  const [selectedTags, setSelectedTags] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("gallery-tags");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sortBy, setSortBy] = useState<"name" | "duration" | "popular" | "new">(
    () =>
      (localStorage.getItem("gallery-sort") as
        | "name"
        | "duration"
        | "popular"
        | "new") || "name",
  );

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    () => (localStorage.getItem("gallery-sort-order") as "asc" | "desc") || "asc",
  );

  // Persist filter changes
  useEffect(() => {
    console.log("[GalleryContext] Filter changed:", filter);
    localStorage.setItem("gallery-filter", filter);
  }, [filter]);

  useEffect(() => {
    console.log("[GalleryContext] Search query changed:", searchQuery);
    localStorage.setItem("gallery-search", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    console.log("[GalleryContext] Selected tags changed:", selectedTags);
    localStorage.setItem("gallery-tags", JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    console.log("[GalleryContext] Sort by changed:", sortBy);
    localStorage.setItem("gallery-sort", sortBy);
  }, [sortBy]);

  useEffect(() => {
    console.log("[GalleryContext] Sort order changed:", sortOrder);
    localStorage.setItem("gallery-sort-order", sortOrder);
  }, [sortOrder]);

  // Load media when filter changes
  useEffect(() => {
    loadMedia();
  }, [filter]);

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      console.log("[GalleryContext] Loading media with filter:", filter);
      const response = await mediaApi.getMedia(
        0,
        100,
        filter === "all" ? undefined : filter,
      );
      console.log("[GalleryContext] Loaded", response.data.items.length, "media items");
      setMedia(response.data.items);
    } catch (error) {
      console.error("[GalleryContext] Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      console.log("[GalleryContext] Loading tags");
      const response = await mediaApi.getAllTags();
      console.log("[GalleryContext] Loaded", response.data.length, "tags");
      setAllTags(response.data);
    } catch (error) {
      console.error("[GalleryContext] Failed to load tags:", error);
    }
  };

  const refreshMedia = async () => {
    console.log("[GalleryContext] Refreshing media");
    await loadMedia();
  };

  const refreshTags = async () => {
    console.log("[GalleryContext] Refreshing tags");
    await loadTags();
  };

  // Filtered media (search + tags)
  const filteredMedia = useMemo(() => {
    const filtered = media.filter((item) => {
      const matchesSearch = item.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        item.tags.some((tag) => selectedTags.includes(tag.id));
      return matchesSearch && matchesTags;
    });

    console.log(
      "[GalleryContext] Filtered media:",
      filtered.length,
      "items (from",
      media.length,
      "total)"
    );
    return filtered;
  }, [media, searchQuery, selectedTags]);

  // Sorted media
  const sortedMedia = useMemo(() => {
    const sorted = [...filteredMedia].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.filename
            .toLowerCase()
            .localeCompare(b.filename.toLowerCase());
          break;
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case "popular":
          comparison = (a.play_count || 0) - (b.play_count || 0);
          break;
        case "new":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    console.log(
      "[GalleryContext] Sorted media:",
      sorted.length,
      "items (sortBy:",
      sortBy,
      ", order:",
      sortOrder,
      ")"
    );
    return sorted;
  }, [filteredMedia, sortBy, sortOrder]);

  // Log queue-relevant changes
  useEffect(() => {
    console.log("[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed");
    console.log("[GalleryContext] New queue would be:", sortedMedia.map(m => m.filename));
  }, [sortedMedia]);

  return (
    <GalleryContext.Provider
      value={{
        media,
        loading,
        filter,
        searchQuery,
        selectedTags,
        sortBy,
        sortOrder,
        filteredMedia,
        sortedMedia,
        setFilter,
        setSearchQuery,
        setSelectedTags,
        setSortBy,
        setSortOrder,
        refreshMedia,
        allTags,
        refreshTags,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error("useGallery must be used within a GalleryProvider");
  }
  return context;
}
