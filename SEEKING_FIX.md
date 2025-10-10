# Seeking & Progress Bar Fix

**Date**: 2025-10-10
**Issue**: Progress bar not updating, seeking not working
**Status**: ✅ **FIXED**

## Problem

**Symptoms:**
1. Progress bar doesn't move during playback
2. Clicking progress bar doesn't seek
3. Playhead stays at 0:00

**Root Cause:**

The XState queue machine had **missing event handlers** that prevented time updates from being processed:

### Issue 1: Autoplay State Transition Missing

```typescript
// BEFORE - ready state
ready: {
  on: {
    PLAY: "playing",         // ✅ Handled manual play
    // ❌ PLAYBACK_STARTED missing - autoplay ignored!
    NEXT: { ... },
    PREVIOUS: { ... },
    CLOSE: "idle",
  },
}
```

**What happened:**
1. Track loaded → state machine in "ready"
2. Autoplay started → DualVideoPlayer called `onPlay()`
3. `onPlay()` sent `PLAYBACK_STARTED` event
4. **"ready" state didn't handle PLAYBACK_STARTED** → event ignored
5. Machine stayed in "ready" state (should be "playing")
6. `UPDATE_TIME` events only handled in "playing" state
7. **Result:** Progress bar frozen at 0%

### Issue 2: UPDATE_TIME Not Handled in Paused State

```typescript
// BEFORE - paused state
paused: {
  on: {
    PLAY: "playing",
    SEEK: { actions: ["updateTime"] },  // ✅ SEEK worked
    // ❌ UPDATE_TIME missing - time updates ignored when paused!
    SET_VOLUME: { ... },
    CLOSE: "idle",
  },
}
```

**What happened:**
- Video.js still fires `timeupdate` events when paused
- These UPDATE_TIME events were ignored
- **Result:** Seeking while paused didn't update UI

### Issue 3: UPDATE_TIME Not Handled in Buffering State

```typescript
// BEFORE - buffering state
buffering: {
  on: {
    BUFFER_END: "playing",
    // ❌ UPDATE_TIME missing - progress frozen during buffering!
    ERROR: { ... },
    PAUSE: "paused",
  },
}
```

**What happened:**
- During buffering, UPDATE_TIME events ignored
- **Result:** Progress bar frozen when buffering

---

## Solution

Added missing event handlers to all relevant states:

### Fix 1: Handle Autoplay in Ready State

```typescript
ready: {
  on: {
    PLAY: "playing",
    PLAYBACK_STARTED: "playing",  // ← ADDED: Handle autoplay
    NEXT: { ... },
    PREVIOUS: { ... },
    CLOSE: "idle",
  },
}
```

### Fix 2: Handle Time Updates in Paused State

```typescript
paused: {
  on: {
    PLAY: "playing",
    PLAYBACK_STARTED: "playing",
    NEXT: { ... },
    PREVIOUS: { ... },
    SEEK: { actions: ["updateTime"] },
    UPDATE_TIME: { actions: ["updateTime"] },  // ← ADDED
    SET_VOLUME: { ... },
    CLOSE: { ... },
  },
}
```

### Fix 3: Handle Time Updates in Buffering State

```typescript
buffering: {
  on: {
    BUFFER_END: "playing",
    UPDATE_TIME: { actions: ["updateTime"] },  // ← ADDED
    ERROR: { ... },
    PAUSE: "paused",
  },
}
```

---

## State Flow (Fixed)

**Before Fix:**
```
idle → LOAD_TRACK → loading → ready → [AUTOPLAY STARTS]
  → PLAYBACK_STARTED (ignored!) → stays in "ready"
  → UPDATE_TIME events ignored → progress bar frozen ❌
```

**After Fix:**
```
idle → LOAD_TRACK → loading → ready → [AUTOPLAY STARTS]
  → PLAYBACK_STARTED → playing ✅
  → UPDATE_TIME events processed → progress bar updates ✅
```

---

## Files Changed

**Modified:**
- ✅ `src/machines/queueMachine.ts` - Added PLAYBACK_STARTED and UPDATE_TIME handlers

**Lines Changed:**
```diff
ready: {
  on: {
    PLAY: "playing",
+   PLAYBACK_STARTED: "playing",
    ...
  }
}

paused: {
  on: {
    ...
    SEEK: { actions: ["updateTime"] },
+   UPDATE_TIME: { actions: ["updateTime"] },
    ...
  }
}

buffering: {
  on: {
    BUFFER_END: "playing",
+   UPDATE_TIME: { actions: ["updateTime"] },
    ...
  }
}
```

---

## Verification

**Test Progress Bar:**
1. Go to http://localhost:5177
2. Click a media file
3. Observe progress bar → should move with playback ✅
4. Click anywhere on progress bar → should seek ✅

**Test Paused Seeking:**
1. Play a track
2. Press pause
3. Click progress bar to seek → should update position ✅
4. Press play → should resume from new position ✅

**Test Buffering:**
1. Play a track
2. If buffering occurs → progress bar should still update ✅

---

## Console Logs to Verify

Open browser console and look for:

```
[QueueMachine] Loading media: track-123
[QueueMachine] Media loaded successfully
[PlayerContext] Machine state: ready
[DualPlayer] Initializing main player
[PlayerContext] Playback started event
[PlayerContext] Machine state: playing ← Should transition to playing!
[PlayerContext] Machine state: playing Context: { isPlaying: true, ... }
```

**Before fix:** Machine stayed in "ready", never transitioned to "playing"
**After fix:** Machine transitions to "playing" when autoplay starts

---

## Why This Happened

XState requires **explicit event handlers** for every state. Events not listed are silently ignored (by design).

When we implemented the queue system, we focused on manual play/pause but forgot about:
1. **Autoplay** triggering PLAYBACK_STARTED (not PLAY)
2. **Time updates** during paused/buffering states
3. **Edge cases** where Video.js behavior differs from manual controls

This is a classic XState pitfall: **missing event handlers in specific states**.

---

## Production Impact

**Before Deploy:**
- All queue implementations had this bug
- Progress bars were non-functional
- Seeking was broken

**After Deploy:**
- ✅ Progress bars work correctly
- ✅ Seeking works in all states
- ✅ Autoplay properly transitions state machine
- ✅ No functionality lost

---

## Lessons Learned

1. **Test autoplay separately** - behavior differs from manual play
2. **Check all states** - events must be handled in every relevant state
3. **XState console** - use XState DevTools to visualize state transitions
4. **Edge cases matter** - buffering, paused, loading states need time updates too

---

## Status: ✅ FIXED

**Development:** Working on http://localhost:5177
**Production:** Ready to deploy (included in queue implementation)
**Regression Risk:** None - purely additive fixes

The fix is minimal, safe, and resolves all seeking/progress bar issues.
