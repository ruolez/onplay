# Duration Debug - Critical Issue

**Problem:** Duration shows 0:00, preventing progress bar and seeking from working.

## Quick Test

### Step 1: Hard Refresh Browser
**Chrome/Brave:** `Cmd + Shift + R` (Mac) or `Ctrl + Shift + F5` (Windows/Linux)
**Safari:** `Cmd + Option + R`

### Step 2: Open Console
Press `F12` → Click **Console** tab → Clear old messages (trash icon)

### Step 3: Click a Media Item
Click any **ready** media file in Gallery

### Step 4: Check These Logs (in order)

## Check 1: Did API Return Variants?

Look for this log:
```
[QueueMachine] Media loaded successfully: {
  id: "...",
  filename: "...",
  hasVariants: true,
  variantCount: 3,
  variants: [ ... ]
}
```

**Questions:**
- Do you see this log? YES / NO
- If yes, what is `hasVariants`? (should be `true`)
- If yes, what is `variantCount`? (should be > 0)
- If yes, copy the `variants` array here:

---

## Check 2: Is Player Source Valid?

Look for this log:
```
[PersistentPlayer] Media loaded: {
  filename: "...",
  hasVariants: true,
  variantCount: 3,
  bestVariant: { bitrate: ..., path: "..." },
  playerSrc: "/media/hls/abc123/playlist.m3u8",
  srcIsEmpty: false
}
```

**Questions:**
- Do you see this log? YES / NO
- If yes, what is `playerSrc`? (copy the full path)
- If yes, what is `srcIsEmpty`? (should be `false`)

---

## Check 3: Did Video Load?

Look for these logs **in this order**:
```
[DualPlayer] Initializing main player
[DualPlayer] Load started for source: /media/hls/...
[DualPlayer] Metadata loaded, duration: 180.5
[DualPlayer] Data loaded, duration: 180.5
[DualPlayer] Duration changed: 180.5 isFinite: true
```

**Questions:**
- Do you see "Initializing main player"? YES / NO
- Do you see "Load started"? YES / NO
- Do you see "Metadata loaded"? YES / NO (← **CRITICAL**)
- If yes to metadata, what is the duration value?
- Do you see "Duration changed"? YES / NO

---

## Check 4: Did State Machine Get Duration?

Look for this log:
```
[QueueMachine] UPDATE_DURATION: 180.5
```

**Questions:**
- Do you see this log? YES / NO
- If yes, what is the duration value?

---

## Check 5: Test Video Element Directly

In the console, paste this and press Enter:
```javascript
const video = document.querySelector('video');
console.log({
  src: video?.src,
  currentSrc: video?.currentSrc,
  duration: video?.duration,
  readyState: video?.readyState,
  error: video?.error
});
```

**Copy/paste the entire output here:**

---

## Check 6: Network Tab (HLS Loading)

1. Open **Network** tab (next to Console)
2. Filter by "hls" or "m3u8"
3. Look for requests to:
   - `playlist.m3u8` files
   - `*.ts` segment files

**Questions:**
- Do you see any HLS requests? YES / NO
- If yes, what is the status code? (should be 200)
- If no, are there any failed requests (red)?

---

## What to Report

**Copy/paste all console logs, then answer the questions above.**

This will tell us exactly where the duration is failing:
- **No variants** → Backend processing issue
- **Empty playerSrc** → Frontend variant selection issue
- **No metadata loaded** → Video loading issue (HLS proxy or file issue)
- **No UPDATE_DURATION** → Event handler issue
