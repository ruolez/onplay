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
- **Modal Player**: Click media cards to open instant-play modal overlay
  - Darkened/blurred background
  - Autoplay with Video.js HLS streaming
  - 3-dot menu on cards for full detail page access
  - Analytics tracking preserved (play, pause, complete, progress)

### Analytics
- **Event Tracking**: Play, pause, complete, progress milestones (25%, 50%, 75%)
- **Completion Rates**: Per-media analytics
- **Session-based Tracking**: Unique session IDs
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
│   │   │   ├── VideoPlayer.tsx   # Video.js wrapper with HLS + autoplay
│   │   │   ├── MiniPlayer.tsx    # Modal overlay player component
│   │   │   └── ThemeSelector.tsx # Theme switcher UI
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx  # Theme management
│   │   │   └── PlayerContext.tsx # Modal player state management
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios API client
│   │   │   ├── theme.ts          # Theme definitions
│   │   │   └── utils.ts          # Format helpers
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

### VideoPlayer Ref Pattern
- **Expose Methods**: Use `forwardRef` + `useImperativeHandle`
  ```typescript
  export interface VideoPlayerRef {
    getCurrentTime: () => number
    getPlayer: () => Player | null
  }
  ```

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
  item.tags.some((tag) => selectedTags.includes(tag.id))
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

#### Implementation Pattern

```typescript
// Lazy initialization (runs once on mount)
const [filter, setFilter] = useState<"all" | "video" | "audio">(
  () => (localStorage.getItem("gallery-filter") as "all" | "video" | "audio") || "all"
);

const [searchQuery, setSearchQuery] = useState(
  () => localStorage.getItem("gallery-search") || ""
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

### Modal Player Architecture

**Navigation UX Pattern**: Users click media cards to instantly play in a modal overlay without page navigation.

#### Why Modal Instead of Page Navigation

- **Instant Playback**: Start playing immediately without route transitions
- **Context Preservation**: Stay on Gallery page while watching
- **Quick Browsing**: Close and open different media rapidly
- **Detail Page Available**: 3-dot menu on cards for full Player page access

#### Implementation

**1. PlayerContext** (`contexts/PlayerContext.tsx`)
- Global state management following ThemeContext pattern
- Manages current media, modal open state, session ID
- `openPlayer(mediaId)`: Fetches full media details + variants via API
- `closePlayer()`: Closes modal with 300ms delay for smooth animation
- **Important**: Fetch media by ID, don't accept partial Media objects (Gallery list lacks variants)

```typescript
const openPlayer = useCallback(async (mediaId: string) => {
  try {
    const response = await mediaApi.getMediaById(mediaId);
    setCurrentMedia(response.data);  // Full data with variants
    setSessionId(Math.random().toString(36).substring(7));
    setIsModalOpen(true);
  } catch (error) {
    console.error("Failed to load media:", error);
  }
}, []);
```

**2. MiniPlayer Component** (`components/MiniPlayer.tsx`)
- Modal overlay with backdrop blur (`bg-black/60 backdrop-blur-sm`)
- Fixed position (`fixed inset-0`) with high z-index (`z-[100]`)
- Reuses existing VideoPlayer component with autoplay
- Preserves all analytics tracking (play, pause, complete, progress milestones)
- Click backdrop or X button to close
- "View Full Details" button navigates to Player page and closes modal
- Body scroll lock when modal is open (`document.body.style.overflow = "hidden"`)
- Selects highest bitrate variant for playback

```typescript
const bestVariant = currentMedia.variants
  ? currentMedia.variants.sort((a, b) => b.bitrate - a.bitrate)[0]
  : null;
```

**3. Gallery Updates** (`pages/Gallery.tsx`)
- Card click opens modal: `onClick={() => handleCardClick(item)}`
- **Before**: `navigate(/player/${item.id})`
- **After**: `openPlayer(item.id)`
- Added 3-dot menu (`MoreVertical` icon) with "View Details" option
- Menu click stops propagation to prevent card click
- Menu positioned absolute, closes on backdrop click
- Desktop only (grid view), also available in list view

**4. VideoPlayer Autoplay** (`components/VideoPlayer.tsx`)
- Added `autoplay?: boolean` prop
- **Browser Requirement**: Start muted for autoplay to work
- Unmute after playback begins to restore audio
```typescript
autoplay: autoplay || false,
muted: autoplay ? true : false,  // Required by browsers

if (autoplay) {
  player.one("play", () => {
    player.muted(false);  // Unmute after start
  });
}
```

**5. Provider Setup** (`main.tsx`)
```typescript
<ThemeProvider>
  <PlayerProvider>
    <App />
  </PlayerProvider>
</ThemeProvider>
```

**6. App Integration** (`App.tsx`)
- Add `<MiniPlayer />` at root level (outside Router, inside providers)
- Renders only when `isModalOpen === true`

#### Common Issues

1. **Undefined Variants Error**: Always fetch full media via API, don't use Gallery list data
2. **Autoplay Blocked**: Must start muted, then unmute after play event
3. **Scroll Behind Modal**: Set `document.body.style.overflow = "hidden"` and restore on unmount
4. **Analytics Lost**: Preserve session ID and all event tracking in MiniPlayer

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

| Aspect | Old (Estimates) | New (Actual) |
|--------|----------------|--------------|
| **Data Source** | Media variant sizes | Nginx access logs |
| **Accuracy** | ~50-70% accurate | 100% accurate |
| **Method** | Median variant × completions | Sum of actual bytes served |
| **Partial Plays** | Ignored | Counted accurately |
| **Quality Switching** | Assumed one quality | Tracks all switches |
| **Buffering/Seeking** | Not accounted for | Fully accounted for |

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
  nginx_logs:  # Shared between nginx, worker, and beat

nginx:
  volumes:
    - nginx_logs:/var/log/nginx

worker:
  volumes:
    - nginx_logs:/var/log/nginx:ro  # Read-only

beat:
  volumes:
    - nginx_logs:/var/log/nginx:ro  # Read-only
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
9. **Modal Player Data**: Always fetch full media via `mediaApi.getMediaById()`, Gallery list lacks variants
10. **Autoplay Requirements**: Must start muted (`muted: true`) then unmute after play event to bypass browser restrictions
11. **Filter Persistence**: Use lazy initialization `useState(() => localStorage.getItem(...))` to avoid reading on every render; wrap JSON.parse in try/catch for safety

## Future Enhancements

- [ ] Subtitle/caption support
- [ ] Playlist creation
- [ ] Social sharing with embedded players
- [ ] Advanced analytics dashboard
- [ ] User authentication and authorization
- [ ] CDN integration for static media
- [ ] Automated thumbnail selection (ML-based)
- [ ] Live streaming support
