# Duration Debug Guide

## Issue
Duration showing as 0:00, which prevents:
- Progress bar from updating
- Seeking from working
- Media Session API from working

## Root Cause Analysis

**Duration = 0 causes cascading failures:**
```typescript
// Progress calculation fails
const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
// If duration = 0, progress is always 0

// Media Session API rejects invalid duration
setPositionState({ duration: 0, position: 5 })
// Error: "position cannot be greater than duration"
```

## Debug Logging Added

### 1. API Response (QueueMachine)
When media loads from API, check console for:
```
[QueueMachine] Media loaded successfully: {
  id: "...",
  filename: "...",
  hasVariants: true/false,
  variantCount: 3,
  variants: [
    { quality: "1080p", path: "/media/hls/...", bitrate: 5000000 },
    ...
  ]
}
```

**What to check:**
- `hasVariants` should be `true`
- `variantCount` should be > 0
- `variants` array should have valid paths

### 2. Player Source (PersistentPlayer)
When player renders, check console for:
```
[PersistentPlayer] Media loaded: {
  filename: "...",
  hasVariants: true,
  variantCount: 3,
  bestVariant: {
    bitrate: 5000000,
    path: "/media/hls/abc123/playlist.m3u8"
  },
  playerSrc: "/media/hls/abc123/playlist.m3u8",
  srcIsEmpty: false
}
```

**What to check:**
- `playerSrc` should NOT be empty string
- `srcIsEmpty` should be `false`
- `bestVariant.path` should be a valid HLS path

### 3. Video Loading (DualVideoPlayer)
When video element loads, check console for:
```
[DualPlayer] Initializing main player
[DualPlayer] Load started for source: /media/hls/abc123/playlist.m3u8
[DualPlayer] Metadata loaded, duration: 180.5
[DualPlayer] Data loaded, duration: 180.5
[DualPlayer] Duration changed: 180.5 isFinite: true
```

**What to check:**
- All events should fire in order
- Duration should be > 0 and isFinite
- Source path should be valid

### 4. State Machine Update
After duration loads, check console for:
```
[QueueMachine] UPDATE_DURATION: 180.5
```

**What to check:**
- Duration value matches what Video.js reported
- Value is > 0

## Troubleshooting

### Scenario A: No variants in API response
**Symptoms:**
```
[QueueMachine] Media loaded successfully: {
  hasVariants: false,
  variantCount: 0,
  variants: []
}
```

**Possible causes:**
1. Media still processing (status not "ready")
2. Processing failed
3. Variants not returned by backend API

**Fix:** Check backend `/api/media/{id}` endpoint response

### Scenario B: Empty playerSrc
**Symptoms:**
```
[PersistentPlayer] Media loaded: {
  playerSrc: "",
  srcIsEmpty: true,
  bestVariant: null
}
```

**Possible causes:**
1. No variants available (see Scenario A)
2. Variants array exists but is empty
3. Frontend filtering issue

**Fix:** Verify API returns variants array

### Scenario C: Video fails to load
**Symptoms:**
```
[DualPlayer] Load started for source: /media/hls/abc123/playlist.m3u8
[DualPlayer] Error: ... (network error or 404)
```

**Possible causes:**
1. HLS file doesn't exist on disk
2. Nginx not serving `/media` path
3. Vite proxy not forwarding `/media` requests (dev only)

**Dev fix:** Check `vite.config.ts` has `/media` proxy
**Prod fix:** Check nginx configuration

### Scenario D: Metadata never loads
**Symptoms:**
```
[DualPlayer] Load started for source: /media/hls/abc123/playlist.m3u8
(no metadata/data/duration events)
```

**Possible causes:**
1. HLS playlist is invalid/corrupted
2. Video codec not supported by browser
3. Network error loading segments

**Fix:**
1. Check network tab for 404s on `.ts` segment files
2. Verify HLS playlist format
3. Check FFmpeg processing logs

## Quick Test Commands

### Check video element directly
```javascript
const video = document.querySelector('video');
console.log({
  src: video?.src,
  currentSrc: video?.currentSrc,
  duration: video?.duration,
  readyState: video?.readyState,
  networkState: video?.networkState,
  error: video?.error
});
```

### Check if HLS is loading
Open Network tab, filter by "hls", look for:
- `playlist.m3u8` (HLS master/media playlist)
- `*.ts` (Transport stream segments)

All should return 200 OK

## Expected Sequence

**Happy path:**
1. User clicks media card → `openPlayer(mediaId, queue)`
2. QueueMachine fetches media → API returns Media with variants array
3. PersistentPlayer selects best variant → Sets playerSrc
4. DualVideoPlayer initializes → Video.js loads HLS source
5. HLS downloads playlist → Parses segments
6. Video element fires `loadedmetadata` → Duration available
7. Video.js fires `durationchange` → Calls `onDurationChange(180.5)`
8. Handler sends `UPDATE_DURATION` → QueueMachine updates state
9. PlayerContext extracts duration → PersistentPlayer renders with duration
10. Progress bar works ✅

**Where it's failing:** Identify which step breaks the chain using the logs above.
