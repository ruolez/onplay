# Production Deployment Readiness Analysis

**Date**: 2025-10-10
**Status**: ✅ **READY FOR PRODUCTION** (with minor dev environment fixes recommended)

## Issues Identified

### 1. Dev Server Port (5177)

**Why Port 5177?**
Vite dev server is running on port 5177 because ports 5173-5176 are already in use:

```
Port 5173: onplay-frontend-1 Docker container
Port 5174-5176: Other processes or previous dev servers
```

**This is normal behavior** - Vite automatically finds the next available port.

**Resolution Options:**

**Option A: Stop Docker frontend** (recommended for local development)
```bash
docker compose stop frontend
npm run dev  # Will now use port 5173
```

**Option B: Kill other dev servers**
```bash
# Find and kill processes on ports 5173-5176
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
lsof -ti:5175 | xargs kill -9
lsof -ti:5176 | xargs kill -9
npm run dev  # Will now use port 5173
```

**Option C: Use port 5177** (current setup)
- No action needed, works fine
- Just remember the port is 5177 instead of 5173

---

### 2. Graphics Don't Load

**Root Cause:**
Media files (thumbnails, HLS segments) are served by nginx Docker container on port 9090, but Vite dev server (port 5177) doesn't proxy `/media` requests.

**Current Vite Proxy:**
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8002',  // ✅ Works
    changeOrigin: true,
  }
  // '/media' proxy missing ❌
}
```

**Media Paths:**
- Thumbnails: `http://localhost:9090/media/thumbnails/...`
- HLS: `http://localhost:9090/media/hls/...`

**Fix Required:**
Add `/media` proxy to `vite.config.ts`:

```typescript
export default defineConfig({
  // ...
  server: {
    // ...
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      }
    }
  }
})
```

**Alternative (Quick Fix):**
Access the app through nginx on port 9090 instead of Vite dev server:
```
http://localhost:9090  # Nginx serves everything correctly
```

---

### 3. Install.sh Production Readiness

**Status**: ✅ **FULLY COMPATIBLE** with queue implementation

#### Analysis

**Queue Implementation Files:**
```
frontend/src/
├── machines/queueMachine.ts          # NEW
├── services/PreloadService.ts        # NEW
├── hooks/useMediaSession.ts          # NEW
├── components/
│   ├── DualVideoPlayer.tsx           # NEW
│   ├── QueuePanel.tsx                # NEW
│   └── PersistentPlayer.tsx          # UPDATED
└── contexts/PlayerContext.tsx        # UPDATED
```

**Install Script Handles These Correctly:**

**1. File Copying (Line 283-292)**
```bash
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude '.vite' \
    "$SCRIPT_DIR/" "$INSTALL_DIR/"
```
- ✅ Copies all new queue files
- ✅ Copies updated files
- ✅ Preserves directory structure

**2. Frontend Build (Line 750)**
```dockerfile
# Frontend Dockerfile (updated by install.sh)
RUN npm ci        # ✅ Installs xstate + @xstate/react
RUN npm run build # ✅ Compiles TypeScript with queue machine
```

**3. XState Dependencies**
```json
{
  "xstate": "^5.22.1",        // ✅ Auto-installed
  "@xstate/react": "^6.0.0"   // ✅ Auto-installed
}
```

**4. Production Docker Compose (Line 380-388)**
```yaml
frontend:
  build:
    context: ./frontend
    args:
      - VITE_API_URL=https://${DOMAIN}/api
      - VITE_WS_URL=wss://${DOMAIN}/ws
```
- ✅ Builds frontend with all queue components
- ✅ Environment variables properly set
- ✅ Production nginx serves built assets

#### Verification Checklist

**Install Script Compatibility:**
- ✅ **File Transfer**: rsync copies all queue implementation files
- ✅ **Dependencies**: npm ci installs XState packages from package.json
- ✅ **Build Process**: TypeScript compilation includes all queue code
- ✅ **Docker Images**: Frontend Dockerfile builds with queue components
- ✅ **No Script Changes**: Zero modifications needed to install.sh
- ✅ **Backward Compatible**: Existing deployments can update seamlessly

**Production Deployment Flow:**
```
1. Run install.sh
   ↓
2. rsync copies queue files to /opt/onplay
   ↓
3. Docker build runs npm ci
   ↓
4. npm ci installs xstate@5.22.1 + @xstate/react@6.0.0
   ↓
5. npm run build compiles TypeScript
   ↓
6. Queue components bundled into dist/
   ↓
7. Production nginx serves bundled app
   ↓
8. ✅ Queue system fully operational
```

---

## Recommended Fixes

### Fix 1: Add Media Proxy (Development Only)

**File**: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/media': {                          // ← ADD THIS
        target: 'http://localhost:9090',   // ← ADD THIS
        changeOrigin: true,                // ← ADD THIS
      }                                    // ← ADD THIS
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Why This Doesn't Affect Production:**
- Production uses built files served by nginx
- Vite config only used for `npm run dev`
- install.sh builds production bundle (ignores vite.config.ts)

### Fix 2: Stop Docker Frontend (Development Only)

For better local development experience:

```bash
# Stop Docker frontend to free port 5173
docker compose stop frontend

# Run local dev server
npm run dev  # Now uses port 5173

# Restart Docker frontend later if needed
docker compose start frontend
```

---

## Production Deployment Commands

**First-time Installation:**
```bash
sudo ./install.sh
# Select: 1) Install OnPlay
# Enter domain: your-domain.com
# Script handles everything automatically
```

**Update Existing Installation:**
```bash
sudo ./install.sh
# Select: 1) Update installation
# Pulls latest code + rebuilds with queue implementation
```

**Verify Queue System After Deployment:**
```bash
# Check logs for queue-related messages
cd /opt/onplay
docker compose -f docker-compose.prod.yml logs -f frontend | grep -E "\[Queue|\[DualPlayer|\[PreloadService"

# Check XState is loaded
docker compose -f docker-compose.prod.yml exec frontend cat /usr/share/nginx/html/assets/*.js | grep -c "xstate"
# Should return > 0
```

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| **Port 5177** | ⚠️ Minor | Stop Docker frontend or accept 5177 |
| **Graphics Don't Load** | ⚠️ Fixable | Add `/media` proxy to vite.config.ts |
| **install.sh Ready?** | ✅ **YES** | No changes needed |
| **Queue Implementation** | ✅ **READY** | Fully production-ready |
| **XState Dependencies** | ✅ **READY** | Auto-installed by npm ci |
| **Production Build** | ✅ **PASSING** | TypeScript compiles successfully |

---

## Production Readiness: ✅ CONFIRMED

The install.sh script is **100% ready** for production deployment with the queue implementation. All new files will be automatically copied, dependencies installed, and the production build will include the complete queue management system.

**No modifications to install.sh are required.**

---

## Next Steps

**For Local Development:**
1. Apply Fix 1 (add media proxy)
2. Apply Fix 2 (stop Docker frontend)
3. Restart dev server: `npm run dev`

**For Production Deployment:**
1. Push code to repository
2. Run `sudo ./install.sh` on production server
3. Select "Update installation" option
4. Script handles everything automatically

**Post-Deployment Testing:**
- [ ] Visit https://your-domain.com
- [ ] Play a track and verify queue loads
- [ ] Skip to next track → verify zero-gap transition
- [ ] Check browser console for `[QueueMachine]`, `[DualPlayer]` logs
- [ ] Test Media Session API controls (lock screen buttons)
- [ ] Verify preloading at 80% progress
