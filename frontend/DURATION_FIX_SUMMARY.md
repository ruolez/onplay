# Duration Issue - Debug Logging Added

## Problem Identified
You noticed: **"duration of track is showing 0:00"**

This is the root cause of ALL seeking/progress issues:
- **Progress bar frozen**: `(currentTime / 0) * 100 = NaN` or `Infinity`
- **Seeking broken**: No duration reference for position calculation
- **Media Session API errors**: "position cannot be greater than duration" (because duration is 0)

## What I Added

### 1. Debug Logging in DualVideoPlayer.tsx
**Lines 120-149:** Added detailed logging for video loading events:

```typescript
// Logs when duration changes
[DualPlayer] Duration changed: 180.5 isFinite: true

// Logs video loading lifecycle
[DualPlayer] Load started for source: /media/hls/abc123/playlist.m3u8
[DualPlayer] Metadata loaded, duration: 180.5
[DualPlayer] Data loaded, duration: 180.5
```

**Why:** Traces if Video.js is receiving and reporting valid duration

### 2. Debug Logging in PersistentPlayer.tsx
**Lines 197-210:** Added logging for source selection:

```typescript
[PersistentPlayer] Media loaded: {
  filename: "song.mp3",
  hasVariants: true,
  variantCount: 3,
  bestVariant: { bitrate: 320000, path: "/media/hls/abc123/playlist.m3u8" },
  playerSrc: "/media/hls/abc123/playlist.m3u8",
  srcIsEmpty: false
}
```

**Why:** Verifies that media has variants and valid source path

### 3. Debug Logging in queueMachine.ts
**Lines 209-219:** Added logging for API response:

```typescript
[QueueMachine] Media loaded successfully: {
  id: "abc123",
  filename: "song.mp3",
  hasVariants: true,
  variantCount: 3,
  variants: [
    { quality: "320kbps", path: "/media/hls/abc123/playlist.m3u8", bitrate: 320000 },
    { quality: "128kbps", path: "/media/hls/abc123/128/playlist.m3u8", bitrate: 128000 },
    { quality: "64kbps", path: "/media/hls/abc123/64/playlist.m3u8", bitrate: 64000 }
  ]
}
```

**Why:** Verifies that backend API returns media with variants array

## Documentation Created

### TEST_SEEKING.md
**Step-by-step checklist** to identify where duration fails:
1. ✅ Check if API returns variants
2. ✅ Check if playerSrc is valid
3. ✅ Check if video loads metadata
4. ✅ Check if state machine receives UPDATE_DURATION
5. ✅ Test video element directly
6. ✅ Check network tab for HLS requests

### DURATION_DEBUG.md
**Comprehensive troubleshooting guide** with:
- Root cause analysis
- All debug logging explained
- Troubleshooting scenarios (A through D)
- Quick test commands
- Expected happy path sequence

## What to Do Next

### Step 1: Hard Refresh Browser
**Chrome/Brave:** `Cmd + Shift + R`
**Safari:** `Cmd + Option + R`

This ensures you're running the new code with debug logging.

### Step 2: Follow TEST_SEEKING.md
Open `TEST_SEEKING.md` and follow the checklist to:
1. Click a media item
2. Check console logs
3. Answer the questions
4. Copy/paste console output

### Step 3: Report Findings
Based on the logs, we'll identify exactly where duration fails:

**Possible Issues:**
- **No variants** → Backend processing issue (media not fully processed)
- **Empty playerSrc** → Frontend variant selection bug
- **No metadata loaded** → HLS file doesn't exist or can't load
- **HLS requests fail** → Vite proxy issue (dev) or nginx config (prod)
- **No UPDATE_DURATION event** → Event handler not firing

## Expected Happy Path

When everything works correctly, you should see this sequence:

1. Click media card
2. `[QueueMachine] Media loaded successfully:` with variants
3. `[PersistentPlayer] Media loaded:` with valid playerSrc
4. `[DualPlayer] Initializing main player`
5. `[DualPlayer] Load started for source: /media/hls/...`
6. `[DualPlayer] Metadata loaded, duration: 180.5`
7. `[DualPlayer] Duration changed: 180.5 isFinite: true`
8. `[QueueMachine] UPDATE_DURATION: 180.5`
9. Duration displays correctly (e.g., "0:00 / 3:00")
10. Progress bar updates as playback continues ✅

## Files Modified

```
frontend/src/components/DualVideoPlayer.tsx (lines 120-149)
frontend/src/components/PersistentPlayer.tsx (lines 197-210)
frontend/src/machines/queueMachine.ts (lines 209-219)
frontend/TEST_SEEKING.md (rewritten)
frontend/DURATION_DEBUG.md (new)
frontend/DURATION_FIX_SUMMARY.md (this file)
```

## Next Steps After Diagnosis

Once we identify where the chain breaks, we'll implement the appropriate fix:

- **Backend fix**: Ensure media processing completes and variants are created
- **API fix**: Ensure `/api/media/{id}` includes variants array
- **Frontend fix**: Adjust variant selection or source handling
- **HLS proxy fix**: Ensure `/media` requests are proxied correctly
- **Video.js fix**: Adjust player configuration if metadata isn't loading

**First priority:** Get the console logs so we know where to focus the fix!
