# OnPlay - Professional Media Streaming Platform

**onplay.site** - A professional media streaming platform with adaptive HLS playback, analytics, and a modern UI.

## Features

- 🎥 **Video & Audio Support** - Upload and play MP4, MP3, and more
- 🔄 **Adaptive Streaming** - HLS with multiple quality variants (360p, 720p, 1080p)
- 📊 **Analytics Dashboard** - Track plays, completion rates, device/browser stats
- 🎨 **Modern UI** - Built with React, Tailwind CSS, and Framer Motion
- 🐳 **Docker-Based** - Easy deployment with Docker Compose
- ⚡ **Background Processing** - Celery workers handle FFmpeg transcoding

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database for metadata and analytics
- **Redis** - Task queue and caching
- **Celery** - Background job processing
- **FFmpeg** - Media transcoding

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Video.js** - HLS video player

### Infrastructure
- **Docker Compose** - Container orchestration
- **Nginx** - Reverse proxy and static file serving

## Quick Start

### Prerequisites
- Docker and Docker Compose
- 8GB+ RAM recommended for media processing

### Production Installation (Ubuntu 24.04 Server)

For production deployment on Ubuntu 24.04 with automatic SSL setup:

1. Clone the repository to your server
```bash
git clone <repository-url> /tmp/onplay
cd /tmp/onplay
```

2. Run the automated installation script
```bash
sudo chmod +x install.sh
sudo ./install.sh
```

The script will:
- Install Docker and dependencies
- Set up production Docker Compose configuration
- Configure Nginx reverse proxy
- Obtain Let's Encrypt SSL certificate
- Set up automatic certificate renewal
- Configure CORS for your domain
- Start all services

**See [INSTALLATION.md](INSTALLATION.md) for detailed production installation guide.**

### Development Installation (Local)

1. Clone the repository
```bash
git clone <repository-url>
cd media-player
```

2. Start all services with Docker Compose
```bash
docker-compose up -d
```

3. Access OnPlay
- **OnPlay Web App**: http://localhost:9090
- **API Documentation**: http://localhost:8002/docs
- **Direct API Access**: http://localhost:8002

### Service Ports (Development)

- **Nginx**: 9090 (main entry point)
- **Frontend**: 5173 (internal)
- **API**: 8002
- **PostgreSQL**: 5434
- **Redis**: 6380

## Usage

### Upload Media

1. Navigate to http://localhost:9090/upload
2. Drag and drop video/audio files
3. Wait for processing to complete
4. Files are automatically transcoded to multiple bitrates

### View Media

1. Browse the gallery at http://localhost:9090
2. Click on any media to open the player
3. Playback analytics are automatically tracked

### View Statistics

1. Navigate to http://localhost:9090/stats
2. View overview stats (total media, storage, etc.)
3. Check playback analytics (plays, completion rates)
4. See top performing media

## Architecture

```
┌─────────────────────────────────────┐
│  Nginx (Port 8080)                  │
│  - Reverse proxy                    │
│  - Serve HLS segments               │
└─────────────────────────────────────┘
            ↓
┌──────────────────┬──────────────────┐
│  React Frontend  │  FastAPI Backend │
│  (Vite Dev)      │  (Uvicorn)       │
└──────────────────┴──────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Celery Workers                     │
│  - FFmpeg transcoding               │
│  - Thumbnail generation             │
└─────────────────────────────────────┘
            ↓
┌──────────────────┬──────────────────┐
│  PostgreSQL      │  Redis           │
│  (Metadata)      │  (Queue)         │
└──────────────────┴──────────────────┘
```

## Development

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f frontend
```

### Scale Workers

```bash
docker-compose up -d --scale worker=4
```

### Rebuild Containers

```bash
docker-compose up -d --build
```

### Stop All Services

```bash
docker-compose down
```

## Supported Formats

### Video
- MP4, AVI, MOV, MKV, WebM

### Audio
- MP3, WAV, OGG, M4A, FLAC

## Processing Pipeline

1. **Upload** - File is saved to `/media/original/`
2. **Queue** - Celery task is created
3. **Transcode** - FFmpeg creates HLS variants
   - Video: 360p, 480p, 720p, 1080p (adaptive)
   - Audio: 64kbps, 128kbps, 320kbps
4. **Store** - Segments saved to `/media/hls/{id}/`
5. **Ready** - Media status updated, available for playback

## About OnPlay

OnPlay (onplay.site) is a professional-grade media streaming platform designed for creators, businesses, and developers who need reliable, high-quality video and audio delivery with detailed analytics. Built with modern technologies and optimized for performance, OnPlay makes it easy to upload, transcode, and stream media content with adaptive bitrate playback.

## License

MIT
