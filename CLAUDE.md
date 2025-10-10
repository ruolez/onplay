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
│   │   │   ├── ThemeContext.tsx  # Theme management
│   │   │   └── PlayerContext.tsx # Persistent player state management
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
- Automatically released when player is closed
- Automatically released when page visibility changes (tab switch)
- Re-acquired when user returns to tab (if media still playing)

**Common Issues:**
1. **User gesture expired**: Must call `requestWakeLock()` directly in click handler, not `useEffect`
2. **Video off-screen**: iOS Safari ignores videos positioned with `left: -9999px` - must be on-screen
3. **Autoplay blocked**: Video fallback won't work until user interacts with page

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

#### Key Considerations

- **Lazy Initialization**: Use function form of `useState` to read localStorage only once
- **JSON Serialization**: Arrays (tags) must be stringified/parsed
- **Error Handling**: Catch JSON parse errors for corrupted localStorage data
- **Performance**: Each state has its own `useEffect` hook (avoids unnecessary updates)
- **Type Safety**: Cast localStorage values to proper union types

### Persistent Player Architecture

**UX Pattern**: Spotify-style persistent player that stays at the bottom of the screen across all routes, providing uninterrupted playback.

#### Why Persistent Bottom Bar

- **Continuous Playback**: Audio and video continue playing while browsing
- **Always Accessible**: Controls visible at all times without modal overlay
- **Natural UX**: Industry-standard pattern (Spotify, YouTube Music, Apple Music)
- **Video Fullscreen**: Auto-enters browser fullscreen for videos, with manual toggle
- **Route Independence**: Works across all pages (Gallery, Upload, Stats)

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

#### Common Issues

1. **Fullscreen Timing**: Use play event trigger (not timer) to avoid expired user gesture
2. **Hidden Element**: VideoPlayer must be positioned off-screen (not `display: none`) for fullscreen to work
3. **Autoplay Policy**: Must start muted, then unmute after play event
4. **Undefined Variants**: Always fetch full media via API, don't use Gallery list data
5. **Analytics Preserved**: All tracking events work identically to modal player

### Autoplay Queue Architecture

**User Experience**: When a user clicks a media card in Gallery, the filtered list becomes a playback queue. After the current track finishes, the next item automatically plays.

#### Why Queue Snapshot Pattern

- **Simple**: Filtered media list becomes the queue when user clicks any item
- **Intuitive**: Queue matches exactly what user sees in Gallery
- **No Staleness**: Modal blocks the Gallery, so filters can't change mid-playback
- **Minimal Code**: Extends existing PlayerContext without new contexts

#### Implementation

**1. PlayerContext State** (`contexts/PlayerContext.tsx`)

```typescript
const [queue, setQueue] = useState<Media[]>([]);
const [currentIndex, setCurrentIndex] = useState<number>(-1);

// Updated openPlayer signature
const openPlayer = useCallback(
  async (mediaId: string, queueItems?: Media[]) => {
    // Store queue and find current position
    if (queueItems && queueItems.length > 0) {
      const index = queueItems.findIndex((item) => item.id === mediaId);
      setQueue(queueItems);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }

    // Fetch full media details
    const response = await mediaApi.getMediaById(mediaId);
    setCurrentMedia(response.data);
    setSessionId(Math.random().toString(36).substring(7));
    setIsModalOpen(true);
  },
  [],
);

// Navigation methods
const playNext = useCallback(async () => {
  if (currentIndex < queue.length - 1) {
    const nextItem = queue[currentIndex + 1];
    const response = await mediaApi.getMediaById(nextItem.id);
    setCurrentMedia(response.data);
    setSessionId(Math.random().toString(36).substring(7));
    setCurrentIndex((prev) => prev + 1);
  }
}, [currentIndex, queue]);

const playPrevious = useCallback(async () => {
  if (currentIndex > 0) {
    const prevItem = queue[currentIndex - 1];
    const response = await mediaApi.getMediaById(prevItem.id);
    setCurrentMedia(response.data);
    setSessionId(Math.random().toString(36).substring(7));
    setCurrentIndex((prev) => prev - 1);
  }
}, [currentIndex, queue]);

// Computed values
const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
const hasPrevious = currentIndex > 0;
const queuePosition =
  queue.length > 0
    ? { current: currentIndex + 1, total: queue.length }
    : undefined;
```

**2. Gallery Integration** (`pages/Gallery.tsx`)

```typescript
const handleCardClick = (item: Media) => {
  if (item.status === "ready") {
    openPlayer(item.id, filteredMedia); // Pass filtered list as queue
  }
};
```

**3. PersistentPlayer Auto-Advance** (`components/PersistentPlayer.tsx`)

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

#### Key Features

- **Respects Filters**: Queue = exactly what user sees (search + tags + type filter)
- **New Session Per Track**: Each track gets unique session ID for analytics
- **Works in Both Views**: Grid and list view use same code path
- **Graceful Handling**: Last item doesn't auto-advance, single item shows no queue UI

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

#### Mobile UI Optimizations

- **Compact Theme Selector**: 2-column grid on mobile vs single column on desktop
- **Tighter Spacing**: Reduced top padding in Gallery (12px vs 24px on mobile)
- **Smaller Touch Targets**: 36px min-height on mobile vs 44px on desktop for dropdowns
- **Responsive Text**: `text-sm` on mobile, `text-base` on desktop

### Segmented Control Architecture

**Design Pattern**: iOS-style segmented control for mutually exclusive filter options, providing superior visual hierarchy over individual buttons.

#### Why Segmented Control

- **Visual Hierarchy**: Clear distinction between primary filters (media type) and secondary filters (tags)
- **Space Efficiency**: 30% less horizontal space than separate buttons
- **Professional Pattern**: Industry standard (Apple Music, Spotify, Figma) for exclusive choices
- **Mobile Optimized**: Touch-friendly but visually compact
- **Accessibility**: Single tab stop with arrow key navigation

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

#### Visual Hierarchy Strategy

**Gallery Filter Layout:**

1. **Primary Filter** (Segmented Control): Orange accent, single-unit design
2. **Secondary Filter** (Tag Pills): Same blue as view toggles, separate rounded pills
3. **View Toggle**: Blue accent, icon-only buttons

This creates clear visual distinction between:

- **What you're filtering** (media type - orange segmented control)
- **How you're filtering** (tags - blue pills)
- **How you're viewing** (grid/list - blue icon buttons)

### Gallery Card Actions Architecture

**Design Pattern**: Consolidated three-dots dropdown menu for all media card actions, providing cleaner UI with better mobile UX.

#### Why Consolidate into Three-Dots Menu

- **Space Efficiency**: ~70% less horizontal space than individual action buttons
- **Cleaner Design**: Reduces visual clutter on media cards
- **Better Mobile UX**: Fewer cramped touch targets, prevents accidental taps
- **Professional Standard**: Industry pattern (YouTube, Gmail, Google Drive)
- **Focus on Content**: More space for thumbnails and metadata

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

#### Common Issues

1. **Dropdown Hidden**: Must remove `overflow-hidden` from card, only apply to thumbnail
2. **Z-Index Stacking**: List items need conditional `z-[110]` when menu is active
3. **Menu Stays Open**: Add click-outside listener with proper container class
4. **Mobile Tap Flash**: Disable WebKit tap highlight color
5. **Text Size Hierarchy**: Dropdown text (`text-xs`) must be smaller than card title (`text-xs sm:text-sm`)

### Sorting UI Architecture

**Design Pattern**: Compact dropdown control for sorting options, minimizing UI footprint while providing clear state indication.

#### Why Dropdown Over Buttons

- **Space Efficiency**: ~70% less horizontal space than separate buttons
- **Scalability**: Easy to add more sort options without cluttering UI
- **Professional Standard**: Used by Linear, GitHub, Notion for data tables
- **State Clarity**: Always shows current sort field and direction

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

**Sort Options (in order):**
1. **New** - Sort by date added (created_at field)
2. **Name** - Alphabetical sort (case-insensitive)
3. **Popular** - Sort by play count
4. **Duration** - Sort by media length

**Click Behavior:**
- Click different option: Switch to that field, reset to ascending
- Click same option: Toggle between ascending/descending

**UI Components:**
- Compact button showing: Icon + Field name (desktop) + Arrow direction
- Dropdown menu with all 4 options
- Active option shows current arrow direction (↑/↓)
- Click-outside listener to close dropdown

**Total Duration Display:**
- Shows at bottom of filtered gallery
- Format: "X items • Xh Xm Xs"
- Minimalistic design (text-xs, theme-text-muted)
- Uses `formatLongDuration()` utility for human-readable format

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

**Alignment Considerations:**

- Use `items-center` for container alignment with view toggle buttons
- Consistent height (`min-h-[38px]`) ensures perfect baseline alignment
- Padding `p-1` (4px) creates visual separation between segments
- Active state gets subtle shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`

#### Common Issues

1. **Height Misalignment**: Ensure segmented control and adjacent buttons have matching `min-h` values
2. **Orange Color Clash**: Each theme's orange is chosen to complement (not clash with) primary blue/teal
3. **Keyboard Focus**: Container needs `onKeyDown` handler, buttons need `role="radio"` for screen readers
4. **TypeScript Generics**: Use `<T extends string>` to preserve union type narrowing

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

1. **FFmpeg Audio Loss**: Always separate video/audio streams before filtering
2. **Thumbnail Caching**: Use cache-busting query params
3. **Worker Updates**: Restart Celery workers after task.py changes
4. **File Deletion**: Use glob patterns for original files (extension unknown)
5. **Theme Consistency**: Update both theme.ts and ThemeContext.tsx
6. **Tag Creation**: Backend uses case-insensitive matching to prevent duplicates
7. **Bandwidth Calculation**: Uses HLS variant sizes, not original file sizes (more accurate)
8. **Hostname Resolution**: May be slow with many IPs; done at query time to avoid delays during tracking
9. **Persistent Player Data**: Always fetch full media via `mediaApi.getMediaById()`, Gallery list lacks variants
10. **Autoplay Requirements**: Must start muted (`muted: true`) then unmute after play event to bypass browser restrictions
11. **Fullscreen Timing**: Trigger fullscreen on play event (not timer) to ensure user gesture is still fresh and hasn't expired
12. **VideoPlayer Positioning**: VideoPlayer must be positioned off-screen (not `display: none`) for fullscreen API to work properly; use `fixed -top-[9999px] -left-[9999px]`
13. **Filter Persistence**: Use lazy initialization `useState(() => localStorage.getItem(...))` to avoid reading on every render; wrap JSON.parse in try/catch for safety
14. **Autoplay Queue**: Always pass `filteredMedia` (not `media`) to `openPlayer()` to respect active filters; each track needs new session ID
15. **Mobile Search State**: Use URL params (`?q=...`) for search state, not localStorage, to sync between mobile top bar and desktop Gallery input
16. **Theme Selector Mobile**: Use 2-column grid with `grid-cols-2 sm:grid-cols-1` and handle odd-numbered items with `col-span-2` on last item
17. **Segmented Control Alignment**: Use consistent `min-h-[38px]` height and `items-center` alignment; each theme needs orange color that complements (not clashes with) primary button color
18. **Filter Visual Hierarchy**: Primary filters (media type) use orange segmented control; secondary filters (tags) and view toggles use blue to create clear distinction
19. **Three-Dots Menu Overflow**: Remove `overflow-hidden` from card container, apply only to thumbnail; prevents dropdown clipping while keeping rounded corners
20. **Three-Dots Menu Z-Index**: Use `z-[100]` for dropdown and conditional `z-[110]` on active card to prevent stacking issues in list view
21. **Click-Outside Handler**: Add `media-menu-container` class to menu wrapper for proper click-outside detection without interfering with menu clicks
22. **Mobile Tap Highlight**: Disable with `style={{ WebkitTapHighlightColor: 'transparent' }}` to prevent purple flash on mobile browsers
23. **List View Layout**: Right-align duration/play count metadata to efficiently use horizontal space; keep tags under filename for better visual grouping
24. **HLS Memory Leaks**: MUST set `backBufferLength: 30` in Video.js VHS config; default infinite buffer causes 1.5GB+ memory growth after 15-20 minutes, leading to browser crashes and production auto-refreshes. See HLS Memory Management section for details.
25. **Wake Lock Timing**: iOS Safari requires wake lock to be requested **synchronously in user gesture handler** (e.g., `onClick`), NOT in `useEffect` - user gesture permission expires after ~100ms; call `requestWakeLock()` directly in `togglePlayPause`, `openPlayer`, etc.; see Screen Wake Lock section for details.
26. **Wake Lock Video Fallback**: Fallback video element must be **visible on-screen** for iOS Safari to count it; positioning with `left: -9999px` (off-screen) fails; use `bottom: 0; right: 0; width: 10px; opacity: 0.01` instead.

## Future Enhancements

- [ ] Subtitle/caption support
- [ ] Playlist creation
- [ ] Social sharing with embedded players
- [ ] Advanced analytics dashboard
- [ ] User authentication and authorization
- [ ] CDN integration for static media
- [ ] Automated thumbnail selection (ML-based)
- [ ] Live streaming support
