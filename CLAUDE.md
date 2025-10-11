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
  - Sort type and order
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
  - Calculated using actual bytes from Nginx logs (not estimates)
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

- **Stream Separation**: Always separate video and audio streams before applying filters
- **Prevent Audio Loss**: Never apply video filters to combined stream (causes audio loss)

### Cache-busting Strategy

- **Problem**: Browser caches thumbnail images after update
- **Solution**: Append timestamp query param `?t=${timestamp}` to image URLs

### Theme System

- **CSS Variables**: Dynamic theming without page reload
- **Type Safety**: Union type for all theme names
- **Color Palette**: Each theme includes three button color systems:
  - `btnPrimary`: Primary actions (view toggles, important CTAs) - typically blue/teal
  - `btnSecondary`: Secondary actions (filters, less emphasis) - muted grays
  - `btnOrange`: Accent actions (segmented controls) - complementary orange tones
- **Orange Accent Strategy**: Each theme has a carefully chosen orange that complements its primary color

### VideoPlayer Ref Pattern

- **Expose Methods**: Use `forwardRef` + `useImperativeHandle` to expose player control methods
- Interface includes: `getCurrentTime()`, `getPlayer()`, `play()`, `pause()`, `seek()`, `setVolume()`

### HLS Memory Management

**Critical**: HLS.js default behavior keeps infinite back buffer, causing memory leaks and browser crashes in production.

- **Problem**: Default `backBufferLength: Infinity` keeps ALL played segments in memory
- **Symptoms**:
  - Memory grows to 1.5GB+ after 15-20 minutes of playback
  - Browser crashes with "Oops could not load page" error
  - Page auto-refreshes unexpectedly in production
- **Solution**: Set explicit back buffer limit in Video.js configuration: `backBufferLength: 30`
- **Recommended Values**:
  - **30 seconds**: Standard for VOD (allows backward seeking, stable memory)
  - **10 seconds**: Live streams without DVR (minimal memory footprint)
  - **60 seconds**: Better seeking UX (slightly higher memory usage)
- **Expected Results**:
  - Memory stays stable at ~200-300MB regardless of playback duration
  - No browser crashes or auto-refreshes
  - Smooth playback for hours

### Screen Wake Lock (Prevent Mobile Screen Sleep)

Keeps mobile device screen awake during media playback to prevent dimming/locking while browsing or playing audio.

**Implementation**: `useWakeLock` hook in `frontend/src/hooks/useWakeLock.ts`

**Browser Support**:
- iOS 16.4+: Native Wake Lock API
- Chrome/Edge (all platforms): Native Wake Lock API
- Older browsers: Feature disabled, clear error message shown

**User Control**:
- Toggle button in persistent player bottom bar (Monitor/MonitorOff icon)
- Located in first row, right side next to time display
- Preference persists to localStorage (`player-wake-lock`, default: enabled)
- When disabled: Immediately releases wake lock, saves battery
- When enabled: Requests wake lock on media playback

**Integration Points**:
- PlayerContext conditionally calls `requestWakeLock()` based on toggle state
- Wake lock requested at: `openPlayer()`, `togglePlayPause()`, `playNext()`, `playPrevious()`
- Auto-released when: player closed, tab switched, user disables toggle
- Auto-reacquired when: tab becomes visible again (if still enabled)

**Auto-Reacquisition**:
- Listens for browser `release` events (tab switch, battery saver, etc.)
- Automatically re-requests wake lock if user has it enabled
- 500ms delay before retry to prevent spam

### Audio Thumbnail Design Principles

- **Smooth Mesh Gradients**: Multi-point distance-based blending
- **Glassmorphism**: Semi-transparent layers with blur effects
- **Organic Waveforms**: Combined sine waves (3+ frequencies)
- **Soft Color Palettes**: Deep purple-blue (15-30 RGB range)
- **Multiple Blur Passes**: Background + elements + final sharpen

### Tagging System Architecture

- **Database Models**: `Tag` table with unique name constraint, `media_tags` junction table for many-to-many
- **Tag Creation**: Case-insensitive matching using SQL `func.lower()`
- **Filtering Logic**: OR operation - shows media with ANY selected tag
- **UI Pattern**: Modal-based tag addition with existing tag quick-select

### Gallery Filter Persistence

**User Experience**: All gallery filter settings are preserved when users navigate away and return, maintaining their exact view state.

**Persisted State**: All filter states stored in `localStorage` and restored on component mount:
1. Media Type Filter (`gallery-filter`): "all" | "video" | "audio"
2. Search Query (`gallery-search`)
3. Selected Tags (`gallery-tags`): Array of tag IDs (JSON serialized)
4. View Mode (`gallery-view`): "grid" | "list"
5. Sort Type (`gallery-sort`): "new" | "name" | "popular" | "duration"
6. Sort Order (`gallery-sort-order`): "asc" | "desc"

**Implementation**: Use lazy initialization with `useState(() => localStorage.getItem(...))`, wrap JSON.parse in try/catch, separate `useEffect` per state for performance.

### Persistent Player Architecture

**UX Pattern**: Spotify-style persistent player that stays at the bottom of the screen across all routes, providing uninterrupted playback.

**Why**: Industry-standard pattern (Spotify, YouTube) enabling continuous playback across all routes with always-accessible controls.

**Architecture Components**:
1. **PlayerContext**: Global state management with playback controls and queue management
2. **PersistentPlayer Component**: Fixed bottom bar (85px height) with controls
3. **VideoPlayer**: Positioned off-screen (`fixed -top-[9999px]`) for fullscreen to work properly
4. **Gallery Integration**: Card click loads into persistent player with filtered media as queue
5. **App Layout**: `pb-24` padding to main container for bottom bar clearance

**Key Behaviors**:
- **Audio Files**: Play in background, controls always visible, never fullscreen
- **Video Files**: Auto-fullscreen on play, continue in bar after exit, manual fullscreen toggle
- **Auto-fullscreen**: Triggered on first play event (not timer - ensures user gesture is fresh)
- **Fullscreen State**: Tracks across browser vendors using fullscreenchange events
- **Data Loading**: Fetch media by ID via API, don't accept partial Media objects (Gallery list lacks variants)

### Live Queue Updates Architecture

**Critical Feature**: Queue automatically rebuilds when user changes filters, search, tags, or sort order while media is playing.

**Why**: Industry-standard pattern (Spotify, YouTube Music) - changing filters shouldn't require stopping playback. Queue adapts to match what user sees in Gallery.

**Implementation**:
1. **GalleryContext**: Centralized state management for all Gallery filters and media data
   - Computes `filteredMedia` (search + tag filtering) and `sortedMedia` (sorting) via `useMemo`
   - All filter states persisted to `localStorage`
2. **Queue Machine**: XState machine with `UPDATE_QUEUE` event
   - Replaces entire queue when Gallery state changes
   - Preserves currentIndex by finding current media in new queue
   - Clears preloaded tracks (may no longer be valid)
3. **PlayerContext Subscription**: Automatically updates queue when `sortedMedia` changes
   - Only updates if player is open and media list is not empty
4. **Gallery Component**: Fully refactored to use `useGallery()` hook

**Provider Hierarchy** (Critical):
```
<ThemeProvider>
  <GalleryProvider>  {/* Must be outside Router */}
    <PlayerProvider>
      <App />  {/* Router is inside App */}
    </PlayerProvider>
  </GalleryProvider>
</ThemeProvider>
```

**Why GalleryContext doesn't use `useSearchParams`**:
- GalleryProvider is mounted outside Router
- Search param syncing handled by Gallery.tsx (inside Router)
- GalleryContext only manages state via localStorage

**Logging Strategy**: All logs use prefixes for easy filtering:
- `[GalleryContext]` - Filter/search/sort state changes
- `[PlayerContext]` - Queue update triggers
- `[queueMachine]` - Queue rebuilding and index updates

### Autoplay Queue Architecture

**User Experience**: When a user clicks a media card in Gallery, the filtered list becomes a playback queue. After the current track finishes, the next item automatically plays. Queue automatically updates when filters/search/tags/sort change (see Live Queue Updates Architecture).

**Why This Pattern**: Filtered media list becomes the queue - simple, intuitive, and matches what user sees in Gallery. Queue stays synchronized with Gallery view.

**Implementation**: Queue management handled by XState state machine (queueMachine.ts) with queue stored in machine context.

**Key Points**:
- Queue respects active filters (search + tags + type filter)
- Each track gets unique session ID for analytics
- Works in both grid and list view
- Auto-advance triggered in `onEnded` event handler

### Mobile Navigation Architecture

**Mobile-First Search**: Full-width search input integrated into top navigation bar for instant access.

**State Management via URL Params**:
- **Mobile**: Search input in top bar (App.tsx) - only visible on Gallery route
- **Desktop**: Search input in Gallery controls (Gallery.tsx)
- **Shared State**: Both use URL query parameter `?q=...` for synchronization

**Mobile UI Optimizations**:
- Compact theme selector with 2-column grid
- Reduced spacing (12px top padding)
- Smaller touch targets (36px min-height)
- Responsive text sizing

### Segmented Control Architecture

**Design Pattern**: iOS-style segmented control for mutually exclusive filter options, providing superior visual hierarchy over individual buttons.

**Why**: Industry-standard pattern (Apple Music, Spotify) providing superior visual hierarchy, 30% space savings, and better accessibility than separate buttons.

**Key Features**:
- TypeScript Generics for type-safe values
- Keyboard Navigation: Arrow keys, Home/End keys
- ARIA Attributes: `role="radiogroup"`, `role="radio"`, `aria-checked`
- Theme Integration: Uses `--btn-orange-bg` CSS variables for active state
- Visual Design: Single-unit container with 1px padding, rounded-md internal segments

**Visual Hierarchy**: Orange for primary filter (media type), blue for secondary filters (tags) and view toggles - creates clear distinction between filter types.

### Gallery Card Actions Architecture

**Design Pattern**: Consolidated three-dots dropdown menu for all media card actions, providing cleaner UI with better mobile UX.

**Why**: Industry pattern (YouTube, Gmail) saving ~70% space, reducing clutter, and improving mobile UX by eliminating cramped touch targets.

**Layout**:
- **Grid View**: Filename → Duration + Three-dots → Tags
- **List View**: Media icon | Filename + Tags | Duration + Play count | Three-dots

**Menu Items**: View Details, Add Tag, Rename, Delete (styled in red)

**Key Technical Details**:
- **Z-Index Management**: Dropdown `z-[100]`, active card `z-[110]` when menu open
- **Click-Outside Handler**: Uses `media-menu-container` class for detection
- **Grid View Overflow**: Remove `overflow-hidden` from card, apply to thumbnail only
- **Mobile Tap Highlight**: Disable with `WebkitTapHighlightColor: 'transparent'`

### Sorting UI Architecture

**Design Pattern**: Compact dropdown control for sorting options, minimizing UI footprint while providing clear state indication.

**Why**: Professional pattern (Linear, GitHub, Notion) saving ~70% space while clearly showing current sort field and direction.

**Sort Options**: New (date), Name (alphabetical), Popular (play count), Duration (length)

**Behavior**: Click different option to switch, click same to toggle asc/desc. Total duration shown at bottom in minimalistic format.

### Bandwidth Tracking Architecture

OnPlay tracks **actual bandwidth** consumed by parsing Nginx access logs, providing precise real-world usage data instead of estimates.

**How It Works**:
1. **Nginx Logging**: Custom log format captures every HLS segment (.ts file) request
2. **Celery Beat Scheduler**: Runs task every 60 seconds, incremental processing
3. **Database Storage**: Two-tier strategy - raw logs (90 days) + aggregated stats (hourly buckets, kept forever)
4. **Analytics API**: Queries `BandwidthStats` for dashboard, real-time accurate bandwidth per IP

**Advantages Over Estimates**: 100% accurate (vs ~50-70%), counts partial plays, tracks quality switching, accounts for buffering/seeking

**Architecture Flow**:
```
User watches video → Nginx serves HLS segments → Nginx writes to bandwidth.log
→ Celery Beat (every 60s) → Parse new log entries → Store in BandwidthLog + BandwidthStats
→ Analytics API queries BandwidthStats → Dashboard shows real bandwidth
```

**Performance Optimizations**:
- Incremental processing (only new log entries)
- Hourly aggregation reduces database size
- Log cleanup after 90 days
- Read-only mounts for workers
- Indexed queries

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
10. **Wake Lock**: Requires iOS 16.4+ or Chrome/Edge - older browsers show error message (see Screen Wake Lock)
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
