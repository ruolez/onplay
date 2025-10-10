# OnPlay Project (onplay.site)

## Overview

OnPlay is a professional media streaming platform with HLS video/audio streaming, multiple quality variants, analytics tracking, and modern UI design. The platform is designed for creators, businesses, and developers who need reliable, high-quality media delivery.

## Architecture

- **Backend**: FastAPI (Python) with Celery workers for async media processing
- **Frontend**: React + TypeScript with Vite
- **Database**: PostgreSQL
- **Queue**: Redis (Celery broker)
- **Video Processing**: FFmpeg for HLS transcoding
- **Container**: Docker Compose orchestration

## Key Features

### Media Processing

- **HLS Streaming**: Adaptive bitrate streaming with multiple quality variants
  - Video: 1080p, 720p, 480p, 360p (auto-scaled based on source)
  - Audio: 320kbps, 128kbps, 64kbps
- **Thumbnail Generation**:
  - Video: Extracted from middle frame, user can select custom frame
  - Audio: Modern glassmorphism design with smooth waveform visualization
- **Metadata Extraction**: Duration, bitrate, codec, resolution via FFmpeg probe

### User Interface

- **8 Professional Themes**: Slate, Jade, Midnight, Charcoal, Graphite, Onyx, Steel, Eclipse
  - Minimal shadows, subtle borders (0.06 opacity)
  - True dark backgrounds with mesh gradients
  - Border-based focus effects
- **Theme Persistence**: LocalStorage with React Context
- **Gallery Filter Persistence**: All filter states preserved across navigation
  - Media type filter (all/video/audio)
  - Search query
  - Selected tags
  - View mode (grid/list)
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Mobile Navigation**: Optimized top bar for mobile devices
  - Logo + "On·Play" text always visible
  - Full-width search input (Gallery route only)
  - Compact theme selector with 2-column grid layout
  - Search state synced via URL params between mobile/desktop
- **Persistent Bottom Bar Player**: Spotify-style player that stays at bottom of screen
  - Click media cards to load into persistent player
  - Audio files play in background with controls always visible
  - Video files auto-fullscreen immediately on play
  - After exiting fullscreen, video continues in bottom bar
  - Works across all routes without interruption
  - 3-dot menu on cards for full detail page access
  - Analytics tracking preserved (play, pause, complete, progress)
  - Fullscreen toggle button for re-entering fullscreen
  - Seekable progress bar with hover feedback
  - Volume control with mute toggle (desktop only)
- **Autoplay Queue**: Continuous playback of media items
  - Auto-advances to next track when current finishes
  - Queue based on filtered Gallery view (respects search/tags/type filters)
  - Previous/next navigation buttons in bottom bar
  - Queue position indicator (e.g., "3 / 15")
  - Each track gets unique analytics session

### Analytics

- **Event Tracking**: Play, pause, complete, progress milestones (25%, 50%, 75%)
- **Completion Rates**: Per-media analytics
- **Session-based Tracking**: Unique session IDs
- **Play Count Tracking**:
  - Backend efficiently aggregates play events per media item
  - Displayed in Gallery list view when count > 0
  - Used for "Popular" sorting option
  - Batch query optimization prevents N+1 performance issues
- **Bandwidth Tracking**:
  - Calculated using average HLS variant size (not original file)
  - Aggregated by time period (7/30/90 days)
  - Breakdown by IP address with reverse DNS hostname resolution
  - Top sources display showing bandwidth consumers

### Media Management

- **Password-protected Deletion**: Hardcoded password "ddd"
- **Rename Functionality**: Update media filenames
- **Custom Thumbnails**: Pause video and set current frame as thumbnail
- **Cache-busting**: Timestamp query params for thumbnail updates
- **Tagging System**:
  - Create tags on-the-fly when tagging media
  - Case-insensitive tag matching (prevents duplicates)
  - Filter media by multiple tags with OR logic
  - Click tag to remove from media
  - Quick-select from existing tags
  - Tags displayed in both grid and list views
- **Sorting & Organization**:
  - Compact dropdown sort control with 4 options
  - Sort by: New (date added), Name (alphabetical), Popular (play count), Duration (length)
  - Ascending/descending toggle for each sort type
  - Sort preferences persist to localStorage
  - Total duration display at bottom of gallery (minimalistic design)
  - Item count shown alongside total duration

## Code Organization

```
media-player/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── media.py          # Media CRUD endpoints
│   │   │   ├── upload.py         # File upload handling
│   │   │   ├── analytics.py      # Analytics tracking
│   │   │   └── tags.py           # Tag management endpoints
│   │   ├── worker/
│   │   │   └── tasks.py          # Celery tasks (video/audio processing)
│   │   ├── models.py             # SQLAlchemy models (Media, Tag, MediaVariant, Analytics)
│   │   ├── database.py           # DB session management
│   │   └── celery_app.py         # Celery configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Upload interface
│   │   │   ├── Gallery.tsx       # Media grid/list with filters and tags
│   │   │   ├── Player.tsx        # Video player with analytics
│   │   │   └── Stats.tsx         # Dashboard with bandwidth tracking
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx         # Video.js wrapper with HLS + autoplay
│   │   │   ├── PersistentPlayer.tsx    # Bottom bar player component
│   │   │   ├── ThemeSelector.tsx       # Theme switcher UI
│   │   │   └── SegmentedControl.tsx    # iOS-style segmented control for filters
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx   # Theme management
│   │   │   ├── GalleryContext.tsx # Gallery state management (filters, search, tags, sort)
│   │   │   └── PlayerContext.tsx  # Persistent player state management + queue subscription
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios API client
│   │   │   ├── theme.ts          # Theme definitions
│   │   │   └── utils.ts          # Format helpers (duration, file size, dates)
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml
```

## Important Implementation Details

### FFmpeg Video Processing

- **Stream Separation**: Always separate video and audio streams
  ```python
  input_stream = ffmpeg.input(input_path)
  video = input_stream.video.filter('scale', -2, variant["height"])
  audio = input_stream.audio
  stream = ffmpeg.output(video, audio, str(playlist_path), ...)
  ```
- **Prevent Audio Loss**: Never apply video filters to combined stream

### Cache-busting Strategy

- **Problem**: Browser caches thumbnail images after update
- **Solution**: Append timestamp query param `?t=${timestamp}`
  ```tsx
  src={`http://localhost:9090${item.thumbnail_path}?t=${loadTime}`}
  ```

### Theme System

- **CSS Variables**: Dynamic theming without page reload
- **Type Safety**: Union type for all theme names
  ```typescript
  export type ThemeType = "slate" | "jade" | "midnight" | ...
  ```
- **Color Palette**: Each theme includes three button color systems:
  - `btnPrimary`: Primary actions (view toggles, important CTAs) - typically blue/teal
  - `btnSecondary`: Secondary actions (filters, less emphasis) - muted grays
  - `btnOrange`: Accent actions (segmented controls) - complementary orange tones
- **Orange Accent Strategy**: Each theme has a carefully chosen orange that complements its primary color
  - Jade (teal): `#ff7849` coral orange for warm contrast
  - Midnight (blue): `#ff8c42` warm orange for classic complementary pairing
  - Charcoal (Vercel blue): `#ff8800` pure orange for high contrast
  - Graphite (cyan): `#ffb86c` peachy orange for cool palette warmth
  - Onyx (white): `#ff8c00` dark orange for monochrome accent
  - Steel (sky blue): `#ff8c5a` coral for warm/cool contrast
  - Eclipse (grayscale): `#ff9f1c` amber gold for grayscale warmth

### VideoPlayer Ref Pattern

- **Expose Methods**: Use `forwardRef` + `useImperativeHandle`
  ```typescript
  export interface VideoPlayerRef {
    getCurrentTime: () => number;
    getPlayer: () => Player | null;
  }
  ```

### HLS Memory Management

**Critical**: HLS.js default behavior keeps infinite back buffer, causing memory leaks and browser crashes in production.

- **Problem**: Default `backBufferLength: Infinity` keeps ALL played segments in memory
- **Symptoms**:
  - Memory grows to 1.5GB+ after 15-20 minutes of playback
  - Browser crashes with "Oops could not load page" error
  - Page auto-refreshes unexpectedly in production
- **Solution**: Set explicit back buffer limit in Video.js configuration
  ```typescript
  html5: {
    vhs: {
      overrideNative: true,
      bandwidth: 4194304,
      backBufferLength: 30, // Keep 30 seconds (YouTube standard)
    },
  }
  ```
- **Recommended Values**:
  - **30 seconds**: Standard for VOD (allows backward seeking, stable memory)
  - **10 seconds**: Live streams without DVR (minimal memory footprint)
  - **60 seconds**: Better seeking UX (slightly higher memory usage)
- **Expected Results**:
  - Memory stays stable at ~200-300MB regardless of playback duration
  - No browser crashes or auto-refreshes
  - Smooth playback for hours
- **References**: Mux blog "An HLS.js cautionary tale", hls.js GitHub issues #5402, #1220, #939

### Screen Wake Lock (Prevent Mobile Screen Sleep)

**Purpose**: Keep mobile device screen awake during media playback to prevent dimming/locking while browsing or playing audio.

- **Implementation**: `useWakeLock` hook in `frontend/src/hooks/useWakeLock.ts`
- **Browser Support**:
  - Chrome/Edge Android: Native Wake Lock API
  - Safari iOS 16.4+: Native Wake Lock API
  - Brave iOS: Native Wake Lock API (uses WebKit)
  - Older browsers: Silent video fallback (iOS only)

**Critical Timing Requirement:**

iOS Safari requires wake lock to be requested **synchronously during user gesture handler**, not in `useEffect`:

```typescript
// ✅ CORRECT - Request immediately in click handler
const togglePlayPause = useCallback(() => {
  if (player.paused()) {
    requestWakeLock(); // Still within user gesture
    player.play();
  }
}, [requestWakeLock]);

// ❌ WRONG - Too late, user gesture expired
useEffect(() => {
  if (isPlaying) {
    requestWakeLock(); // Fails on iOS Safari
  }
}, [isPlaying]);
```

**Wake Lock Activation Points:**
- `openPlayer()`: When user clicks media card
- `togglePlayPause()`: When user clicks play button
- `playNext()` / `playPrevious()`: When navigating queue

**Fallback Strategy for iOS:**
1. Try native Wake Lock API first (works on iOS 16.4+)
2. If fails, play invisible 10x10px looping video at bottom-right corner
3. Video must be **visible** (not off-screen) for iOS to count it

**Video Fallback Details:**
```typescript
// Must be on-screen (iOS ignores off-screen videos)
video.style.position = "fixed";
video.style.bottom = "0";
video.style.right = "0";
video.style.width = "10px";
video.style.height = "10px";
video.style.opacity = "0.01";
video.setAttribute("playsinline", "");
video.setAttribute("muted", "");
video.setAttribute("loop", "");
```

**Logging:**
- All logs prefixed with `[WakeLock]` for easy debugging
- Success: `✅ Wake lock activated (native API)` or `✅ Wake lock activated (video fallback for iOS)`
- Failure: `⚠️ Native API failed: [error]` or `❌ Fallback video failed: [error]`

**Wake Lock Release:**
- Auto-released when player closed or tab switched
- Re-acquired when returning to tab (if media still playing)

### Audio Thumbnail Design Principles

- **Smooth Mesh Gradients**: Multi-point distance-based blending
- **Glassmorphism**: Semi-transparent layers with blur effects
- **Organic Waveforms**: Combined sine waves (3+ frequencies)
- **Soft Color Palettes**: Deep purple-blue (15-30 RGB range)
- **Multiple Blur Passes**: Background + elements + final sharpen

### Tagging System Architecture

- **Database Models** (models.py):
  - `Tag` table with unique name constraint and index
  - `media_tags` junction table for many-to-many relationship
  - Cascade deletion when media or tag is removed
- **Tag Creation**: Case-insensitive matching using SQL `func.lower()`
  ```python
  tag = db.query(Tag).filter(func.lower(Tag.name) == func.lower(tag_data.name)).first()
  ```
- **Filtering Logic**: OR operation - shows media with ANY selected tag
  ```typescript
  item.tags.some((tag) => selectedTags.includes(tag.id));
  ```
- **UI Pattern**: Modal-based tag addition with existing tag quick-select

### Gallery Filter Persistence

**User Experience**: All gallery filter settings are preserved when users navigate away and return, maintaining their exact view state.

#### Persisted State

All filter states are stored in `localStorage` and restored on component mount:

1. **Media Type Filter** (`gallery-filter`)
   - Values: "all" | "video" | "audio"
   - Lazy initialization from localStorage with default "all"

2. **Search Query** (`gallery-search`)
   - String value of current search input
   - Restored exactly as typed

3. **Selected Tags** (`gallery-tags`)
   - Array of tag IDs (JSON serialized)
   - Graceful error handling for parse failures

4. **View Mode** (`gallery-view`)
   - Values: "grid" | "list"
   - Previously implemented

5. **Sort Type** (`gallery-sort`)
   - Values: "new" | "name" | "popular" | "duration"
   - Default: "name"

6. **Sort Order** (`gallery-sort-order`)
   - Values: "asc" | "desc"
   - Default: "asc"

#### Implementation Pattern

```typescript
// Lazy initialization (runs once on mount)
const [filter, setFilter] = useState<"all" | "video" | "audio">(
  () =>
    (localStorage.getItem("gallery-filter") as "all" | "video" | "audio") ||
    "all",
);

const [searchQuery, setSearchQuery] = useState(
  () => localStorage.getItem("gallery-search") || "",
);

const [selectedTags, setSelectedTags] = useState<number[]>(() => {
  try {
    const saved = localStorage.getItem("gallery-tags");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
});

// Sync to localStorage on state changes
useEffect(() => {
  localStorage.setItem("gallery-filter", filter);
}, [filter]);

useEffect(() => {
  localStorage.setItem("gallery-search", searchQuery);
}, [searchQuery]);

useEffect(() => {
  localStorage.setItem("gallery-tags", JSON.stringify(selectedTags));
}, [selectedTags]);
```

**Key Points:** Use lazy initialization with `useState(() => ...)`, wrap JSON.parse in try/catch, separate `useEffect` per state for performance.

### Persistent Player Architecture

**UX Pattern**: Spotify-style persistent player that stays at the bottom of the screen across all routes, providing uninterrupted playback.

**Why:** Industry-standard pattern (Spotify, YouTube) enabling continuous playback across all routes with always-accessible controls.

#### Implementation

**1. PlayerContext** (`contexts/PlayerContext.tsx`)

- Global state management with playback controls
- Manages: current media, session ID, playback state (isPlaying, currentTime, duration, volume)
- `openPlayer(mediaId, queueItems)`: Fetches full media details + variants via API
- `closePlayer()`: Stops playback and hides bottom bar
- `togglePlayPause()`, `seek()`, `setVolume()`: Playback control methods
- Exposes `playerRef` for direct VideoPlayer access
- **Important**: Fetch media by ID, don't accept partial Media objects (Gallery list lacks variants)

```typescript
interface PlayerContextType {
  currentMedia: Media | null;
  sessionId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  openPlayer: (mediaId: string, queueItems?: Media[]) => Promise<void>;
  closePlayer: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  // ... queue methods
}
```

**2. PersistentPlayer Component** (`components/PersistentPlayer.tsx`)

- Fixed bottom bar (`fixed bottom-0`) with 85px height
- VideoPlayer positioned off-screen (not hidden) for fullscreen to work properly
  - `className="fixed -top-[9999px] -left-[9999px] pointer-events-none"`
  - Prevents fullscreen from showing empty wrapper
- Smooth slide-up animation on media load
- **Layout sections**:
  - **Left**: Thumbnail (56x56) + Title + Time display
  - **Center**: Previous/Play-Pause/Next controls + Seekable progress bar
  - **Right**: Volume slider (desktop) + Fullscreen button (video only) + Queue position + Close button
- Auto-fullscreen for video files on first play event
- Fullscreen state tracking across browser vendors (fullscreenchange events)
- Preserves all analytics tracking (play, pause, complete, progress milestones)

```typescript
// Auto-fullscreen on play event (not timer - ensures user gesture is fresh)
onPlay={() => {
  setIsPlaying(true);
  trackEvent("play");

  if (currentMedia?.media_type === "video" && !hasTriggeredFullscreen) {
    const player = playerRef.current.getPlayer();
    player?.requestFullscreen();
    setHasTriggeredFullscreen(true);
  }
}}
```

**3. VideoPlayer Enhancements** (`components/VideoPlayer.tsx`)

- Added `play()`, `pause()`, `seek()`, `setVolume()` methods to ref
- Added `onDurationChange` callback prop
- **Autoplay Requirement**: Start muted for browser autoplay policy
- Unmute after playback begins to restore audio

```typescript
export interface VideoPlayerRef {
  getCurrentTime: () => number;
  getPlayer: () => Player | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}
```

**4. Gallery Integration** (`pages/Gallery.tsx`)

- Card click loads into persistent player: `openPlayer(item.id, filteredMedia)`
- Passes filtered media list as queue for autoplay
- 3-dot menu (`MoreVertical` icon) with "View Details" option for full Player page
- Desktop only (grid view), also available in list view

**5. App Layout** (`App.tsx`)

- Add `pb-24` (96px padding) to main container for bottom bar clearance
- Add `<PersistentPlayer />` at root level (outside Router, inside providers)
- Always rendered, visibility controlled by PlayerContext state

```typescript
<div className="min-h-screen theme-bg pb-24">
  <Routes>...</Routes>
  <PersistentPlayer />
</div>
```

**6. Fullscreen Behavior**

- **Auto-fullscreen**: Videos trigger fullscreen on first play event
- **Manual Toggle**: Fullscreen button (Maximize/Minimize icon) for re-entering
- **Exit Fullscreen**: Press ESC or click Minimize button
- **After Exit**: Video continues in bottom bar as small preview
- **State Tracking**: Listens to fullscreenchange events across browsers

```typescript
// Fullscreen toggle
const toggleFullscreen = () => {
  const player = playerRef.current?.getPlayer();
  if (isFullscreen) {
    document.exitFullscreen();
  } else {
    player?.requestFullscreen();
  }
};

// Track fullscreen state
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  // ... other vendor prefixes
}, []);
```

#### Key Features

- **Audio Files**: Play in background, controls always visible, never fullscreen
- **Video Files**: Auto-fullscreen on play, continue in bar after exit, manual fullscreen toggle
- **Seekable Progress**: Click progress bar to jump to any position, hover shows dot indicator
- **Volume Control**: Slider with mute toggle (desktop only, hidden on mobile)
- **Queue Position**: Shows "3 / 15" indicator when queue is active
- **Cross-Route**: Works seamlessly across Gallery, Upload, Stats pages

### Live Queue Updates Architecture

**Critical Feature**: Queue automatically rebuilds when user changes filters, search, tags, or sort order while media is playing.

**Why:** Industry-standard pattern (Spotify, YouTube Music) - changing filters shouldn't require stopping playback. Queue adapts to match what user sees in Gallery.

#### Implementation

**1. GalleryContext** (`contexts/GalleryContext.tsx`)

Centralized state management for all Gallery filters and media data:

```typescript
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

  // Derived data (computed with useMemo)
  filteredMedia: Media[];  // After search + tag filtering
  sortedMedia: Media[];    // After sorting filteredMedia

  // Actions
  setFilter: (filter: "all" | "video" | "audio") => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: number[] | ((prev: number[]) => number[])) => void;
  setSortBy: (sort: "name" | "duration" | "popular" | "new") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  refreshMedia: () => Promise<void>;
  refreshTags: () => Promise<void>;

  // Tags
  allTags: Tag[];
}
```

**Key Features:**
- `filteredMedia` computed via `useMemo` (search + tag filtering)
- `sortedMedia` computed via `useMemo` (sorting filteredMedia)
- All filter states persisted to `localStorage`
- Comprehensive logging: `[GalleryContext]` prefix

**2. Queue Machine Updates** (`machines/queueMachine.ts`)

Added `UPDATE_QUEUE` event and action:

```typescript
export type QueueEvent =
  | { type: "LOAD_TRACK"; mediaId: string; queueItems?: Media[] }
  | { type: "UPDATE_QUEUE"; queueItems: Media[] }  // NEW
  | { type: "PLAY" }
  | { type: "PAUSE" }
  // ... other events

// Action: updateQueue
updateQueue: assign({
  queue: ({ event, context }) => {
    if (event.type !== "UPDATE_QUEUE") return context.queue;
    return event.queueItems;  // Replace entire queue
  },
  currentIndex: ({ event, context }) => {
    if (event.type !== "UPDATE_QUEUE") return context.currentIndex;

    const newQueue = event.queueItems;
    const currentMedia = context.currentMedia;

    if (!currentMedia) return -1;

    // Find current media in new queue
    const newIndex = newQueue.findIndex((item) => item.id === currentMedia.id);

    if (newIndex >= 0) {
      console.log("[queueMachine] ✅ Current media found at new index:", newIndex);
      return newIndex;
    } else {
      console.log("[queueMachine] ⚠️ Current media NOT in new queue");
      // Keep playing current track even if filtered out
      return context.currentIndex;
    }
  },
  // Clear preloaded tracks (may no longer be valid)
  nextMedia: null,
  nextTrackPreloaded: false,
}),
```

**UPDATE_QUEUE handlers added to states:**
- `ready`: Allows queue updates while paused
- `playing`: Allows queue updates during playback
- `paused`: Allows queue updates while paused
- `buffering`: Allows queue updates while buffering

**3. PlayerContext Subscription** (`contexts/PlayerContext.tsx`)

Automatically updates queue when Gallery state changes:

```typescript
import { useGallery } from "./GalleryContext";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(queueMachine);
  const { sortedMedia } = useGallery();  // Subscribe to Gallery

  const { currentMedia, queue, currentIndex } = state.context;

  // Subscribe to Gallery state changes (live queue updates)
  useEffect(() => {
    // Only update if player is open
    if (!currentMedia) {
      console.log("[PlayerContext] Skipping queue update - no media playing");
      return;
    }

    // Only update if we have media
    if (sortedMedia.length === 0) {
      console.log("[PlayerContext] Skipping queue update - sortedMedia is empty");
      return;
    }

    console.log("[PlayerContext] 🔄 Gallery state changed, updating queue");
    console.log("[PlayerContext] Current media:", currentMedia.filename);
    console.log("[PlayerContext] Current queue size:", queue.length);
    console.log("[PlayerContext] New sortedMedia size:", sortedMedia.length);
    console.log("[PlayerContext] Current index:", currentIndex);

    // Send UPDATE_QUEUE event to state machine
    send({ type: "UPDATE_QUEUE", queueItems: sortedMedia });

    console.log("[PlayerContext] ✅ UPDATE_QUEUE event sent");
  }, [sortedMedia, currentMedia, send]);

  // ... rest of provider
}
```

**4. Gallery Component Updates** (`pages/Gallery.tsx`)

- Fully refactored to use `useGallery()` hook
- Removed all local filter/search/sort state
- Removed local `filteredMedia` and `sortedMedia` calculations
- Uses `refreshMedia()` and `refreshTags()` from context

```typescript
export default function Gallery() {
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
    filteredMedia,  // From context
    sortedMedia,    // From context
    allTags,
    refreshMedia,
    refreshTags,
  } = useGallery();

  // ... UI renders sortedMedia
}
```

#### Behavior Examples

**Example 1: Filter Change**
1. User is playing track 5 of 20 (all media)
2. User clicks "Video" filter
3. Queue rebuilds to 12 videos
4. Current track (if video) continues playing
5. Queue position updates: "3 / 12" (track found at new index)
6. Next/Previous navigation uses new queue

**Example 2: Search**
1. User is playing "song.mp3" (track 10 of 50)
2. User searches "song"
3. Queue rebuilds to 5 matching items
4. "song.mp3" continues playing
5. Queue position updates: "1 / 5"

**Example 3: Current Track Filtered Out**
1. User is playing video.mp4 (track 8 of 30)
2. User filters to "Audio" only
3. Queue rebuilds to 18 audio files
4. video.mp4 continues playing (not in new queue)
5. Queue position shows but navigation disabled
6. When video ends, auto-advances to first audio track

#### Logging Strategy

All logs use prefixes for easy console filtering:

- `[GalleryContext]` - Filter/search/sort state changes
- `[PlayerContext]` - Queue update triggers
- `[queueMachine]` - Queue rebuilding and index updates

**Example Console Output:**
```
[GalleryContext] Filter changed: video
[GalleryContext] Filtered media: 12 items (from 20 total)
[GalleryContext] Sorted media: 12 items (sortBy: name, order: asc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
[PlayerContext] Current media: video5.mp4
[PlayerContext] Current queue size: 20
[PlayerContext] New sortedMedia size: 12
[PlayerContext] Current index: 4
[PlayerContext] ✅ UPDATE_QUEUE event sent
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] Old queue size: 20
[queueMachine] New queue size: 12
[queueMachine] Current media: video5.mp4
[queueMachine] Old index: 4
[queueMachine] ✅ Current media found at new index: 2
```

#### Provider Hierarchy

**Critical**: GalleryProvider must wrap PlayerProvider (which needs `useGallery` hook):

```typescript
// main.tsx
<ThemeProvider>
  <GalleryProvider>  {/* Must be outside Router */}
    <PlayerProvider>
      <App />  {/* Router is inside App */}
    </PlayerProvider>
  </GalleryProvider>
</ThemeProvider>
```

**Why GalleryContext doesn't use `useSearchParams`:**
- GalleryProvider is mounted outside Router
- Search param syncing handled by Gallery.tsx (inside Router)
- GalleryContext only manages state via localStorage

### Autoplay Queue Architecture

**User Experience**: When a user clicks a media card in Gallery, the filtered list becomes a playback queue. After the current track finishes, the next item automatically plays. **Queue automatically updates when filters/search/tags/sort change** (see Live Queue Updates Architecture above).

**Why This Pattern:** Filtered media list becomes the queue - simple, intuitive, and matches what user sees in Gallery. Queue stays synchronized with Gallery view.

#### Implementation

Queue management is handled by **XState state machine** (queueMachine.ts) with queue stored in machine context.

**1. Queue Initialization** (`contexts/PlayerContext.tsx`)

When user clicks media card, `openPlayer()` is called with initial queue:

```typescript
const openPlayer = useCallback(
  (mediaId: string, queueItems?: Media[]) => {
    requestWakeLock();
    send({ type: "LOAD_TRACK", mediaId, queueItems });
  },
  [send, requestWakeLock],
);
```

**2. Gallery Integration** (`pages/Gallery.tsx`)

```typescript
const { sortedMedia } = useGallery();  // Reactive filtered/sorted list
const { openPlayer } = usePlayer();

const handleCardClick = (item: Media) => {
  if (item.status === "ready") {
    openPlayer(item.id, sortedMedia);  // Pass current filtered list as queue
  }
};
```

**Note:** Queue automatically updates when `sortedMedia` changes (see Live Queue Updates Architecture).

**3. Queue Navigation** (`contexts/PlayerContext.tsx`)

```typescript
const playNext = useCallback(() => {
  requestWakeLock();

  // Check if we have a preloaded next track
  if (state.context.nextTrackPreloaded && playerRef.current) {
    playerRef.current.swapToPreloaded();
  }

  send({ type: "NEXT" });
}, [send, requestWakeLock, state.context.nextTrackPreloaded]);

const playPrevious = useCallback(() => {
  requestWakeLock();
  send({ type: "PREVIOUS" });
}, [send, requestWakeLock]);
```

**4. PersistentPlayer Auto-Advance** (`components/PersistentPlayer.tsx`)

```typescript
const { playNext, hasNext, hasPrevious, queuePosition } = usePlayer();

// Auto-play next track when current ends
onEnded={async () => {
  await trackEvent("complete");
  if (hasNext) {
    playNext();
  }
}}

// UI: Previous/Next buttons and position indicator
<button onClick={playPrevious} disabled={!hasPrevious}>
  <SkipBack />
</button>
<button onClick={togglePlayPause}>
  {isPlaying ? <Pause /> : <Play />}
</button>
<button onClick={playNext} disabled={!hasNext}>
  <SkipForward />
</button>
<span>{queuePosition.current} / {queuePosition.total}</span>
```

**Key Points:**
- Queue respects active filters (search + tags + type filter)
- Each track gets unique session ID for analytics
- Works in both grid and list view

### Mobile Navigation Architecture

**Mobile-First Search**: Full-width search input integrated into top navigation bar for instant access.

#### State Management via URL Params

- **Mobile**: Search input in top bar (App.tsx) - only visible on Gallery route
- **Desktop**: Search input in Gallery controls (Gallery.tsx)
- **Shared State**: Both use URL query parameter `?q=...` for synchronization

**App.tsx (Mobile Navigation)**

```typescript
const [mobileSearchQuery, setMobileSearchQuery] = useState(
  searchParams.get("q") || ""
);

const handleMobileSearchChange = (value: string) => {
  setMobileSearchQuery(value);
  const params = new URLSearchParams(searchParams);
  if (value) {
    params.set("q", value);
  } else {
    params.delete("q");
  }
  navigate(`?${params.toString()}`, { replace: true });
};

// Mobile search input (Gallery route only)
{location.pathname === "/" && (
  <div className="md:hidden flex-1 mx-2 relative">
    <input
      value={mobileSearchQuery}
      onChange={(e) => handleMobileSearchChange(e.target.value)}
      placeholder="Search..."
    />
  </div>
)}
```

**Gallery.tsx (Desktop + State Sync)**

```typescript
const urlSearchQuery = searchParams.get("q") || "";

// Sync URL query to local state
useEffect(() => {
  setSearchQuery(urlSearchQuery);
}, [urlSearchQuery]);

// Desktop search input (hidden on mobile)
<div className="hidden md:block">
  <input
    value={searchQuery}
    onChange={(e) => handleSearchChange(e.target.value)}
  />
</div>
```

**Mobile UI Optimizations:**
- Compact theme selector with 2-column grid
- Reduced spacing (12px top padding)
- Smaller touch targets (36px min-height)
- Responsive text sizing

### Segmented Control Architecture

**Design Pattern**: iOS-style segmented control for mutually exclusive filter options, providing superior visual hierarchy over individual buttons.

**Why:** Industry-standard pattern (Apple Music, Spotify) providing superior visual hierarchy, 30% space savings, and better accessibility than separate buttons.

#### Implementation

**Component** (`components/SegmentedControl.tsx`)

```typescript
interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}
```

**Key Features:**

- **TypeScript Generics**: Type-safe values for any string union type
- **Keyboard Navigation**: Arrow keys (Left/Right/Up/Down), Home/End keys
- **ARIA Attributes**: `role="radiogroup"`, `role="radio"`, `aria-checked`
- **Theme Integration**: Uses `--btn-orange-bg` CSS variables for active state
- **Responsive**: `min-h-[38px]` consistent height, full width on mobile
- **Visual Design**: Single-unit container with 1px padding, rounded-md internal segments

**Usage Pattern:**

```typescript
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
```

**Visual Hierarchy:** Orange for primary filter (media type), blue for secondary filters (tags) and view toggles - creates clear distinction between filter types.

### Gallery Card Actions Architecture

**Design Pattern**: Consolidated three-dots dropdown menu for all media card actions, providing cleaner UI with better mobile UX.

**Why:** Industry pattern (YouTube, Gmail) saving ~70% space, reducing clutter, and improving mobile UX by eliminating cramped touch targets.

#### Implementation

**Grid View Layout:**
- **Line 1**: Filename
- **Line 2**: Duration (left) + Three-dots menu (right)
- **Line 3**: Tags (if any)

**List View Layout:**
- **Row**: Media icon | Filename + Tags | Duration + Play count | Three-dots menu
- All metadata right-aligned for efficient use of horizontal space

**Three-Dots Menu Items (both views):**
1. **View Details** - Play icon, opens full player page
2. **Add Tag** - Tag icon, opens tag modal
3. **Rename** - Edit icon, opens rename modal
4. **Delete** - Trash icon (styled in red with `text-red-500 hover:bg-red-500/10`)

**Dropdown Styling:**
```typescript
// Grid and list view dropdown
<div className="absolute right-0 mt-1 w-40 rounded-lg shadow-xl theme-dropdown z-[100]">
  <button className="text-xs flex items-center gap-2">
    <Icon className="w-3.5 h-3.5" />
    Action Label
  </button>
</div>
```

**Key Technical Details:**

1. **Z-Index Management:**
   - Dropdown: `z-[100]`
   - Active card gets `z-[110]` when menu is open (prevents overlap in list view)
   - Conditional class: `${menuOpen === item.id ? "z-[110]" : ""}`

2. **Click-Outside Handler:**
   ```typescript
   useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
       if (menuOpen && !(e.target as Element).closest('.media-menu-container')) {
         setMenuOpen(null);
       }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [menuOpen]);
   ```

3. **Grid View Overflow:**
   - Remove `overflow-hidden` from card container
   - Add `overflow-hidden rounded-t-lg` to thumbnail container only
   - Allows dropdown to overflow while keeping image corners rounded

4. **Mobile Tap Highlight:**
   - Disable with `style={{ WebkitTapHighlightColor: 'transparent' }}`
   - Prevents purple flash on mobile when tapping menu

5. **List View Tag Spacing:**
   - Tight tag borders: `px-1 py-[1px]` instead of `px-1.5 py-0.5`
   - More space from title: `mt-1.5` instead of `mt-0.5`
   - Reduced gap between tags: `gap-1` instead of `gap-1.5`

6. **Container Class Pattern:**
   - Add `media-menu-container` class to menu wrapper
   - Enables click-outside detection without interfering with clicks inside menu

### Sorting UI Architecture

**Design Pattern**: Compact dropdown control for sorting options, minimizing UI footprint while providing clear state indication.

**Why:** Professional pattern (Linear, GitHub, Notion) saving ~70% space while clearly showing current sort field and direction.

#### Implementation

**Sort State Management:**

```typescript
const [sortBy, setSortBy] = useState<"name" | "duration" | "popular" | "new">(
  () =>
    (localStorage.getItem("gallery-sort") as "name" | "duration" | "popular" | "new") ||
    "name",
);
const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
  () => (localStorage.getItem("gallery-sort-order") as "asc" | "desc") || "asc",
);
```

**Sort Options:** New (date), Name (alphabetical), Popular (play count), Duration (length)

**Behavior:** Click different option to switch, click same to toggle asc/desc. Total duration shown at bottom in minimalistic format.

#### Styling

**CSS Classes** (`index.css`):

```css
.theme-segmented-control {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
}

.theme-segmented-option {
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.theme-segmented-option:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.02);
}

.theme-segmented-option-active {
  background: var(--btn-orange-bg);
  color: var(--btn-orange-text);
}
```

**Styling:** Consistent `min-h-[38px]` height, `p-1` padding, subtle shadow on active state.

### Bandwidth Tracking Architecture

OnPlay tracks **actual bandwidth** consumed by parsing Nginx access logs, providing precise real-world usage data instead of estimates.

#### How It Works

**1. Nginx Logging**

- Custom log format captures every HLS segment (.ts file) request
- Log format: `IP|Timestamp|URI|Bytes|Status|RequestTime`
- Separate bandwidth log: `/var/log/nginx/bandwidth.log`
- Shared Docker volume allows worker containers to read logs

**2. Celery Beat Scheduler**

- Runs `process_bandwidth_logs_task` every 60 seconds
- Incremental processing (tracks file position between runs)
- Parses logs and extracts: IP, media_id, bytes_sent, timestamp

**3. Database Storage**
Two-tier storage strategy:

```python
# Raw logs (detailed, cleaned up after 90 days)
class BandwidthLog(Base):
    ip_address: str
    bytes_sent: int
    request_uri: str
    media_id: str (extracted from URI)
    timestamp: datetime

# Aggregated stats (hourly buckets, kept forever)
class BandwidthStats(Base):
    media_id: str
    ip_address: str
    date: datetime  # Hourly bucket
    total_bytes: int
    request_count: int
```

**4. Analytics API**

- Queries `BandwidthStats` for dashboard
- Real-time accurate bandwidth per IP
- No estimation - actual bytes served
- Groups by hour for performance

#### Advantages Over Previous System

| Aspect                | Old (Estimates)              | New (Actual)               |
| --------------------- | ---------------------------- | -------------------------- |
| **Data Source**       | Media variant sizes          | Nginx access logs          |
| **Accuracy**          | ~50-70% accurate             | 100% accurate              |
| **Method**            | Median variant × completions | Sum of actual bytes served |
| **Partial Plays**     | Ignored                      | Counted accurately         |
| **Quality Switching** | Assumed one quality          | Tracks all switches        |
| **Buffering/Seeking** | Not accounted for            | Fully accounted for        |

#### Architecture

```
User watches video
    ↓
Nginx serves HLS segments (.ts files)
    ↓
Nginx writes to bandwidth.log
    ↓
Celery Beat (every 60s)
    ↓
Parse new log entries
    ↓
Store in BandwidthLog + BandwidthStats
    ↓
Analytics API queries BandwidthStats
    ↓
Dashboard shows real bandwidth
```

#### Performance Optimizations

- **Incremental Processing**: Only reads new log entries since last position
- **Hourly Aggregation**: BandwidthStats reduces database size
- **Log Cleanup**: Raw logs deleted after 90 days (aggregates kept)
- **Read-only Mounts**: Workers have read-only access to logs
- **Indexed Queries**: IP, media_id, and date columns indexed

#### Configuration

```yaml
# docker-compose.yml
volumes:
  nginx_logs: # Shared between nginx, worker, and beat

nginx:
  volumes:
    - nginx_logs:/var/log/nginx

worker:
  volumes:
    - nginx_logs:/var/log/nginx:ro # Read-only

beat:
  volumes:
    - nginx_logs:/var/log/nginx:ro # Read-only
```

#### Monitoring

```bash
# Check if logs are being processed
docker compose logs beat | grep "Processed"

# View recent bandwidth logs
docker compose exec nginx tail -f /var/log/nginx/bandwidth.log

# Check database stats
docker compose exec api python -c "from app.database import SessionLocal; from app.models import BandwidthStats; from sqlalchemy import func; db = SessionLocal(); print(f'Total bandwidth: {db.query(func.sum(BandwidthStats.total_bytes)).scalar()} bytes')"
```

## API Endpoints

### Media

- `POST /api/upload` - Upload media file
- `GET /api/media` - List media (filterable by type, status) - includes tags array
- `GET /api/media/{id}` - Get single media with variants and tags
- `DELETE /api/media/{id}` - Delete media (requires password)
- `PATCH /api/media/{id}` - Rename media
- `POST /api/media/{id}/thumbnail` - Set custom thumbnail from timestamp

### Tags

- `GET /api/tags` - List all tags
- `POST /api/media/{id}/tags` - Add tag to media (creates tag if doesn't exist)
- `DELETE /api/media/{id}/tags/{tag_id}` - Remove tag from media

### Analytics

- `POST /api/analytics/track` - Track playback event
- `GET /api/analytics/media/{id}` - Get media analytics
- `GET /api/analytics/overview` - Dashboard overview (includes bandwidth tracking)
  - Returns: total_plays, total_completes, total_bandwidth_bytes, bandwidth_by_ip (top 10), top_media

## Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@db:5432/mediadb
REDIS_URL=redis://redis:6379/0
MEDIA_ROOT=/media
DELETE_PASSWORD=ddd

# Frontend
VITE_API_URL=http://localhost:8080/api
```

## Development Workflow

1. **Start Services**: `docker-compose up -d`
2. **Frontend Dev**: `cd frontend && npm run dev`
3. **Backend Dev**: Auto-reload enabled in Docker
4. **Worker Logs**: `docker-compose logs -f worker`
5. **Restart Workers**: `docker-compose restart worker` (after code changes)

## Design Philosophy

- **Modern Professional Aesthetic**: Inspired by Linear, Vercel, GitHub
- **No Cartoon Elements**: Avoid bright colors, heavy gradients, playful icons
- **Subtle Elegance**: Minimal shadows, border-based focus, true dark backgrounds
- **Smooth Transitions**: Blur effects, soft gradients, gentle animations
- **Accessibility**: High contrast ratios, keyboard navigation support

## Common Pitfalls

**Media Processing:**
1. **FFmpeg Audio Loss**: Always separate video/audio streams before filtering
2. **Worker Updates**: Restart Celery workers after task.py changes
3. **File Deletion**: Use glob patterns for original files (extension unknown)

**UI & State:**
4. **Thumbnail Caching**: Use cache-busting query params with timestamps
5. **Filter Persistence**: Use lazy `useState(() => localStorage.getItem(...))` with try/catch for JSON parsing
6. **Mobile Search State**: Sync via URL params (`?q=...`) in Gallery.tsx, not GalleryContext
7. **Provider Hierarchy**: GalleryProvider must wrap PlayerProvider (PlayerContext needs `useGallery`)
8. **GalleryContext Router**: GalleryContext cannot use `useSearchParams` (mounted outside Router)

**Player:**
9. **HLS Memory**: Set `backBufferLength: 30` to prevent memory leaks (see HLS Memory Management)
10. **Wake Lock Timing**: Request in click handler, not `useEffect` (see Screen Wake Lock)
11. **VideoPlayer Positioning**: Off-screen (`fixed -top-[9999px]`), not `display: none`
12. **Autoplay Requirements**: Start muted, unmute after play event
13. **Fullscreen Maintenance**: Keep same Video.js player instance, use `player.src()` to change tracks (recreating player exits fullscreen)
14. **Persistent Player Data**: Fetch via `mediaApi.getMediaById()`, not Gallery list data
15. **Event Listeners**: Separate listener attachment from player initialization to avoid stale closures
16. **Auto-Advance**: Add PLAYBACK_ENDED handler to paused state (video.js pauses before ending)

**Queue Management:**
17. **Live Updates**: Queue automatically rebuilds when filters/search/tags/sort change (via GalleryContext subscription)
18. **State Machine**: Use XState `send()` for queue operations, don't manipulate queue directly
19. **Index Preservation**: Queue updates preserve currentIndex by finding current media in new queue

**Layout & Styling:**
20. **Three-Dots Menu**: Remove `overflow-hidden` from card, apply to thumbnail only
21. **Z-Index**: Dropdown `z-[100]`, active card `z-[110]`
22. **Mobile Tap Highlight**: Disable with `WebkitTapHighlightColor: 'transparent'`

## Future Enhancements

- [ ] Subtitle/caption support
- [ ] Playlist creation
- [ ] Social sharing with embedded players
- [ ] Advanced analytics dashboard
- [ ] User authentication and authorization
- [ ] CDN integration for static media
- [ ] Automated thumbnail selection (ML-based)
- [ ] Live streaming support
