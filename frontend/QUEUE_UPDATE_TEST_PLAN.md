# Queue Update Test Plan

## Implementation Status: ✅ COMPLETE

All code changes have been implemented and the application compiles successfully.

## What Was Implemented

### 1. **GalleryContext** (`frontend/src/contexts/GalleryContext.tsx`)
   - Centralized state management for all Gallery filters and media data
   - Exposes `filteredMedia` and `sortedMedia` as reactive computed values
   - Comprehensive logging for all state changes

### 2. **Queue Machine** (`frontend/src/machines/queueMachine.ts`)
   - Added `UPDATE_QUEUE` event to `QueueEvent` union type
   - Created `updateQueue` action that:
     - Updates queue array
     - Finds current media in new queue and preserves playback position
     - Clears preloaded tracks (they may no longer be valid)
     - Logs all transitions with detailed context
   - Added UPDATE_QUEUE handlers to all relevant states (ready, playing, paused, buffering)

### 3. **PlayerContext** (`frontend/src/contexts/PlayerContext.tsx`)
   - Subscribes to Gallery's `sortedMedia` changes via `useEffect`
   - Automatically sends UPDATE_QUEUE event when sortedMedia changes
   - Skips updates when no media is playing or sortedMedia is empty
   - Comprehensive logging for debugging

### 4. **Gallery Component** (`frontend/src/pages/Gallery.tsx`)
   - Fully refactored to use GalleryContext
   - Removed all duplicate local state
   - Uses `refreshMedia()` and `refreshTags()` from context

## Testing Instructions

### Prerequisites
1. Have multiple media files uploaded (at least 10 for better testing)
2. Have some videos and some audio files
3. Have tagged some files with various tags
4. Open browser developer console (F12)
5. Access application at http://localhost:5174/

---

## Test 1: Queue Updates with Filter Changes

### Steps:
1. **Start playback**:
   - Go to Gallery page
   - Click any media card to start playback
   - Verify persistent player appears at bottom

2. **Change filter to "Video"**:
   - Click "Video" segmented control button
   - Open console and look for these logs:

### Expected Console Logs:

```
[GalleryContext] Filter changed: video
[GalleryContext] Loading media with filter: video
[GalleryContext] Loaded X media items
[GalleryContext] Filtered media: X items (from X total)
[GalleryContext] Sorted media: X items (sortBy: name, order: asc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[GalleryContext] New queue would be: ["file1.mp4", "file2.mp4", ...]
[PlayerContext] 🔄 Gallery state changed, updating queue
[PlayerContext] Current media: current-file.mp4
[PlayerContext] Current queue size: 15
[PlayerContext] New sortedMedia size: 8
[PlayerContext] Current index: 3
[PlayerContext] ✅ UPDATE_QUEUE event sent
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] Old queue size: 15
[queueMachine] New queue size: 8
[queueMachine] Current media: current-file.mp4
[queueMachine] Old index: 3
[queueMachine] ✅ Current media found at new index: 2
```

3. **Verify behavior**:
   - Current track continues playing
   - Queue position updates (e.g., "3 / 8" instead of "4 / 15")
   - Next/Previous buttons enabled state updates
   - Auto-advance goes to next video (not audio)

4. **Change filter to "Audio"**:
   - Click "Audio" button
   - If current track is video, it continues playing even though not in new queue
   - Look for log: `[queueMachine] ⚠️ Current media NOT in new queue, keeping old index`

---

## Test 2: Queue Updates with Search Changes

### Steps:
1. **Start playback** of any track
2. **Enter search term** in search box (e.g., "test")
3. **Watch console logs**:

### Expected Console Logs:

```
[GalleryContext] Search query changed: test
[GalleryContext] Filtered media: X items (from Y total)
[GalleryContext] Sorted media: X items (sortBy: name, order: asc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] ✅ Current media found at new index: Z
```

4. **Verify behavior**:
   - If current track matches search, queue position updates
   - If current track doesn't match search, it continues playing
   - Auto-advance only goes to matching tracks

5. **Clear search**:
   - Clear search input
   - Queue rebuilds to full list
   - Look for updated queue size in logs

---

## Test 3: Queue Updates with Tag Selection

### Steps:
1. **Start playback** of a track with tag "music"
2. **Click a tag filter** (e.g., "rock")
3. **Watch console logs**:

### Expected Console Logs:

```
[GalleryContext] Selected tags changed: [3]
[GalleryContext] Filtered media: X items (from Y total)
[GalleryContext] Sorted media: X items (sortBy: name, order: asc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] ✅ Current media found at new index: Z
```

4. **Verify behavior**:
   - Queue only contains tracks with selected tag
   - Multiple tag selection uses OR logic (any matching tag)
   - Queue position updates correctly

---

## Test 4: Queue Updates with Sort Changes

### Steps:
1. **Start playback** of any track
2. **Click sort dropdown** and select "Duration"
3. **Watch console logs**:

### Expected Console Logs:

```
[GalleryContext] Sort by changed: duration
[GalleryContext] Sorted media: X items (sortBy: duration, order: asc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] ✅ Current media found at new index: Z
```

4. **Toggle sort order** (click Duration again):

```
[GalleryContext] Sort order changed: desc
[GalleryContext] Sorted media: X items (sortBy: duration, order: desc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
[queueMachine] 🔄 UPDATE_QUEUE triggered
[queueMachine] ✅ Current media found at new index: Z
```

5. **Verify behavior**:
   - Current track continues playing
   - Queue order changes based on sort
   - Queue position updates to new index

---

## Test 5: Combined Filter Changes

### Steps:
1. **Start playback**
2. **Apply multiple filters**:
   - Filter: Video
   - Search: "test"
   - Tag: "demo"
   - Sort: Popular (descending)

3. **Watch console for cascading updates**:

```
[GalleryContext] Filter changed: video
[GalleryContext] Filtered media: X items
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue

[GalleryContext] Search query changed: test
[GalleryContext] Filtered media: Y items
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue

[GalleryContext] Selected tags changed: [5]
[GalleryContext] Filtered media: Z items
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue

[GalleryContext] Sort by changed: popular
[GalleryContext] Sorted media: Z items (sortBy: popular, order: desc)
[GalleryContext] 🔄 QUEUE UPDATE TRIGGER - sortedMedia changed
[PlayerContext] 🔄 Gallery state changed, updating queue
```

4. **Verify behavior**:
   - Each change triggers queue update
   - Queue progressively narrows down
   - Current track continues playing (if still in filtered list)

---

## Test 6: Navigation After Queue Update

### Steps:
1. **Start playback** (e.g., track 5 of 20)
2. **Filter to videos only** (reduces queue to 10)
3. **Click Next button**:
   - Verify next track is from new filtered queue
   - Not from old full queue

4. **Click Previous button**:
   - Verify previous track is from new filtered queue

### Expected Behavior:
- Next/Previous navigation uses updated queue
- Queue position indicator shows correct numbers (e.g., "3 / 10")
- Auto-advance on track end goes to next in new queue

---

## Test 7: Edge Cases

### Test 7A: Current Track Filtered Out
1. **Start playing video**
2. **Filter to "Audio" only**
3. **Expected**:
   - Video continues playing
   - Queue contains only audio
   - Log shows: `[queueMachine] ⚠️ Current media NOT in new queue`
   - When video ends, auto-advance to first audio track

### Test 7B: Empty Queue
1. **Start playback**
2. **Enter search with no matches**
3. **Expected**:
   - Current track continues
   - Queue is empty (0 items)
   - Next/Previous buttons disabled
   - When track ends, playback stops

### Test 7C: Clear All Filters
1. **Apply multiple filters** (narrow queue to 3 items)
2. **Clear all filters**:
   - Clear search
   - Select "All" media type
   - Remove all tag filters
3. **Expected**:
   - Queue rebuilds to full list
   - Current track position updates
   - Logs show full queue restoration

---

## Success Criteria

✅ **All tests pass if**:
1. Console logs appear as documented above
2. Queue position indicator updates correctly
3. Current track continues playing during queue updates
4. Next/Previous navigation uses updated queue
5. Auto-advance respects new queue order
6. No console errors or warnings (except HMR Fast Refresh notice)
7. Performance is smooth (no lag when changing filters)

---

## Troubleshooting

### If logs don't appear:
- Make sure dev server is running (http://localhost:5174/)
- Open browser DevTools console
- Refresh page to clear cached state

### If queue doesn't update:
- Check GalleryProvider is wrapping PlayerProvider in main.tsx
- Verify sortedMedia dependency in PlayerContext useEffect
- Look for any console errors

### If playback stops unexpectedly:
- Check machine state transitions in console
- Verify current media is handled correctly when filtered out

---

## Next Steps (Not Yet Implemented)

1. **Add validation before playback**:
   - Check if media status === "ready" before openPlayer
   - Show error message if status is "processing" or "failed"

2. **Implement auto-skip for unavailable tracks**:
   - If current track removed from queue, auto-skip to next valid track
   - Add TRACK_REMOVED event to queue machine

3. **Performance optimization**:
   - Debounce search input to reduce queue update frequency
   - Consider memoization for expensive filter operations

---

## Logging Reference

All logs are prefixed for easy filtering in console:

- `[GalleryContext]` - Gallery state changes
- `[PlayerContext]` - Player state and queue updates
- `[queueMachine]` - State machine transitions
- `[PreloadService]` - Track preloading
- `[WakeLock]` - Screen wake lock

**Pro tip**: Filter console by prefix, e.g., type `[queueMachine]` in filter box to see only queue machine logs.

---

## Summary

✅ **Implementation is complete**
✅ **Dev server compiles without errors**
✅ **All logging in place**
📋 **Ready for manual testing**

Follow the test plan above and verify all console logs appear as documented. Report any discrepancies or unexpected behavior.
