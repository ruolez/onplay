# Seeking & Progress Bar Debugging Guide

**Status**: Debugging in progress
**Date**: 2025-10-10

## Changes Made

### 1. Fixed Media Session API Error ✅

**Error**: `TypeError: Failed to execute 'setPositionState' on 'MediaSession': The provided position cannot be greater than the duration.`

**Fix**: Added validation to `useMediaSession.ts:updateMediaSessionPosition()`

```typescript
// Validate values before setting position state
if (
  !duration ||
  duration <= 0 ||
  !isFinite(duration) ||
  !isFinite(currentTime) ||
  currentTime < 0
) {
  return;
}

// Clamp currentTime to duration to prevent API errors
const validPosition = Math.min(currentTime, duration);
```

**Result**: Media Session errors should stop ✅

### 2. Added Debug Logging

Added console logs to trace the flow:

**QueueMachine (`queueMachine.ts`):**
- `[QueueMachine] Setting playing state` - When transitioning to playing
- `[QueueMachine] UPDATE_DURATION: <number>` - When duration is set
- `[QueueMachine] UPDATE_TIME: <time> Duration: <dur>` - Every 5 seconds of playback

**Expected Console Output:**
```
[QueueMachine] Loading media: track-123
[QueueMachine] Media loaded successfully
[PlayerContext] Machine state: ready
[DualPlayer] Initializing main player
[QueueMachine] Setting playing state          ← State transition
[QueueMachine] UPDATE_DURATION: 180.5         ← Duration set
[PlayerContext] Machine state: playing
[QueueMachine] UPDATE_TIME: 5.0 Duration: 180.5  ← Time updates
[QueueMachine] UPDATE_TIME: 10.0 Duration: 180.5
[QueueMachine] UPDATE_TIME: 15.0 Duration: 180.5
```

---

## Debugging Steps

### Step 1: Check Browser Console

1. Open http://localhost:5177
2. Open browser console (F12 → Console tab)
3. Click a media file to play
4. Watch for console logs

### Step 2: Verify State Transition

**Look for:**
```
[QueueMachine] Setting playing state
```

**If you DON'T see this:**
- Machine is not transitioning to "playing" state
- Time updates won't be processed
- **Problem**: PLAYBACK_STARTED event not handled correctly

**If you DO see this:**
- Continue to Step 3

### Step 3: Verify Duration is Set

**Look for:**
```
[QueueMachine] UPDATE_DURATION: <number>
```

**If duration is 0 or you don't see this:**
- Video.js not firing `durationchange` event
- **Problem**: Video player initialization issue

**If duration is set correctly:**
- Continue to Step 4

### Step 4: Verify Time Updates

**Look for (every 5 seconds):**
```
[QueueMachine] UPDATE_TIME: 5.0 Duration: 180.5
[QueueMachine] UPDATE_TIME: 10.0 Duration: 180.5
```

**If you DON'T see time updates:**
- State machine not receiving UPDATE_TIME events
- **Possible causes:**
  - Video.js not firing `timeupdate` events
  - DualVideoPlayer not calling `onTimeUpdate`
  - PersistentPlayer `isDragging` blocking updates
  - State machine not in correct state

**If you DO see time updates:**
- **Problem**: UI not re-rendering with new values

### Step 5: Check Progress Bar Calculation

Open browser console and type:
```javascript
// Check current state
window.debugPlayer = true;
```

Then in `PersistentPlayer.tsx`, the progress calculation should show:
```typescript
const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
console.log("Progress:", progress, "currentTime:", currentTime, "duration:", duration);
```

---

## Common Issues & Solutions

### Issue 1: No State Transition to "playing"

**Symptom:**
- No `[QueueMachine] Setting playing state` log
- Machine stuck in "ready" state

**Solution:**
Already fixed by adding `PLAYBACK_STARTED: "playing"` to ready state

### Issue 2: Duration Never Set

**Symptom:**
- No `[QueueMachine] UPDATE_DURATION` log
- Duration shows as 0

**Possible Causes:**
1. Video not loading
2. DualVideoPlayer not calling `onDurationChange`
3. Media Session API blocking duration
4. HLS media proxy issue (check `/media` proxy in vite.config.ts)

**Debug:**
```javascript
// In browser console, check if video element exists
document.querySelector('video')?.duration
```

### Issue 3: Time Updates Not Fired

**Symptom:**
- No `[QueueMachine] UPDATE_TIME` logs
- Progress bar frozen

**Possible Causes:**
1. Video not actually playing
2. `isDragging` always true (bug in mouse handlers)
3. Video.js not firing timeupdate events
4. State machine not in "playing" state

**Debug:**
```javascript
// Check if video is actually playing
const video = document.querySelector('video');
console.log('Paused:', video?.paused, 'Current Time:', video?.currentTime);
```

### Issue 4: UI Not Re-rendering

**Symptom:**
- Console shows correct time updates
- Progress bar still frozen

**Possible Causes:**
1. React not re-rendering
2. Progress calculation wrong
3. CSS issue hiding progress bar
4. State not being extracted from machine context correctly

**Debug:**
Add to `PersistentPlayer.tsx` before return:
```typescript
console.log("Render - currentTime:", currentTime, "duration:", duration, "progress:", progress);
```

---

## Quick Test Commands

### Test 1: Check Video Element
```javascript
const video = document.querySelector('video');
console.log({
  exists: !!video,
  src: video?.src,
  duration: video?.duration,
  currentTime: video?.currentTime,
  paused: video?.paused,
  readyState: video?.readyState
});
```

### Test 2: Check Player Context
```javascript
// This won't work directly, but you can add a window.debugPlayer in PlayerContext:
// In PlayerContext.tsx, add:
// useEffect(() => { window.debugPlayerState = state.context; }, [state.context]);

// Then in console:
console.log(window.debugPlayerState);
```

### Test 3: Force Time Update
```javascript
// Manually trigger time update
const video = document.querySelector('video');
video?.dispatchEvent(new Event('timeupdate'));
```

---

## Next Steps

**After checking console logs, report:**

1. **State transition:** Did you see `[QueueMachine] Setting playing state`?
2. **Duration:** Did you see `[QueueMachine] UPDATE_DURATION: <number>`? What was the number?
3. **Time updates:** Did you see `[QueueMachine] UPDATE_TIME: <time>`? How often?
4. **Any errors:** Copy any error messages from console

With this information, I can pinpoint the exact issue!

---

## Temporary Debug Code

All debug logs added to `queueMachine.ts` are temporary and should be removed after fixing:

```typescript
// REMOVE AFTER FIXING:
console.log("[QueueMachine] Setting playing state");
console.log("[QueueMachine] UPDATE_DURATION:", newDuration);
if (event.type === "UPDATE_TIME" && Math.floor(newTime) % 5 === 0 && newTime > 0) {
  console.log("[QueueMachine] UPDATE_TIME:", newTime.toFixed(1), "Duration:", context.playbackState.duration);
}
```
