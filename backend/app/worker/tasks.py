from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import Media, MediaVariant, MediaStatus, MediaType
from sqlalchemy import or_, and_
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import ffmpeg
import os
import redis
import uuid
from pathlib import Path
from PIL import Image
import mutagen

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "/media")
DOWNLOAD_DIR = "download"

# Shared Redis connection for cross-worker state.
# Bandwidth tracking uses this to persist the nginx log file offset between
# task runs — the previous module-level global was per-process, causing every
# worker to re-parse the entire log from byte 0 when it picked up the task.
_redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
_BANDWIDTH_POSITION_KEY = "onplay:bandwidth:last_position"
_DOWNLOAD_BACKFILL_LOCK_KEY = "onplay:downloads:backfill_lock"

@celery_app.task(bind=True, name="app.worker.tasks.process_media")
def process_media(self, media_id: str, original_path: str, regenerate_thumbnail: bool = True):
    db = SessionLocal()
    try:
        media = db.query(Media).filter(Media.id == media_id).first()
        if not media:
            raise Exception(f"Media {media_id} not found")

        # A (re)processed file gets a fresh download artifact - never expose
        # a download built from a previous original
        media.download_path = None
        media.download_size = None
        media.download_status = None

        # Extract metadata
        try:
            probe = ffmpeg.probe(original_path)
            video_stream = next((s for s in probe['streams'] if s['codec_type'] == 'video'), None)
            audio_stream = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)

            if video_stream:
                media.width = int(video_stream.get('width', 0))
                media.height = int(video_stream.get('height', 0))
                media.codec = video_stream.get('codec_name')

            if 'format' in probe:
                media.duration = float(probe['format'].get('duration', 0))
                media.bitrate = int(probe['format'].get('bit_rate', 0))

            db.commit()
        except Exception as e:
            print(f"Metadata extraction failed: {e}")

        # Process based on media type
        if media.media_type == MediaType.VIDEO:
            process_video(media_id, original_path, db, regenerate_thumbnail)
        elif media.media_type == MediaType.AUDIO:
            process_audio(media_id, original_path, db, regenerate_thumbnail)

        # Update status to ready
        media.status = MediaStatus.READY
        db.commit()

        # Download file is built in its own task so playback is available as
        # soon as HLS is done and a slow transcode can't push this task past
        # its time limit
        generate_download.delay(media_id)

        return {"status": "success", "media_id": media_id}

    except Exception as e:
        # Update status to failed
        media = db.query(Media).filter(Media.id == media_id).first()
        if media:
            media.status = MediaStatus.FAILED
            media.error_message = str(e)
            db.commit()
        raise e
    finally:
        db.close()

def process_video(media_id: str, input_path: str, db, regenerate_thumbnail: bool = True):
    """Process video into multiple HLS variants"""
    media = db.query(Media).filter(Media.id == media_id).first()

    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    hls_dir.mkdir(parents=True, exist_ok=True)

    # Unique per-encode segment names: nginx serves *.ts as immutable for a
    # year, so re-encodes (file replacement) must never reuse segment URLs
    seg_prefix = f"seg_{uuid.uuid4().hex[:8]}"

    # Define quality variants
    variants = [
        {"name": "1080p", "height": 1080, "video_bitrate": "5000k", "audio_bitrate": "192k"},
        {"name": "720p", "height": 720, "video_bitrate": "2800k", "audio_bitrate": "128k"},
        {"name": "480p", "height": 480, "video_bitrate": "1400k", "audio_bitrate": "128k"},
        {"name": "360p", "height": 360, "video_bitrate": "800k", "audio_bitrate": "96k"},
    ]

    # Only create variants that are smaller or equal to original
    original_height = media.height or 1080
    variants = [v for v in variants if v["height"] <= original_height]

    for variant in variants:
        variant_dir = hls_dir / variant["name"]
        variant_dir.mkdir(exist_ok=True)

        playlist_path = variant_dir / "playlist.m3u8"
        segment_pattern = str(variant_dir / f"{seg_prefix}_%03d.ts")

        try:
            input_stream = ffmpeg.input(input_path)
            video = input_stream.video.filter('scale', -2, variant["height"])
            audio = input_stream.audio
            stream = ffmpeg.output(
                video,
                audio,
                str(playlist_path),
                **{
                    'c:v': 'libx264',
                    'b:v': variant["video_bitrate"],
                    'c:a': 'aac',
                    'b:a': variant["audio_bitrate"],
                    'hls_time': 4,
                    'hls_playlist_type': 'vod',
                    'hls_segment_filename': segment_pattern,
                    'hls_segment_type': 'mpegts',
                    'hls_flags': 'independent_segments',
                    'force_key_frames': 'expr:gte(t,n_forced*4)',
                    'g': 80,  # GOP size: 2x segment duration at 20fps
                    'keyint_min': 80,  # Consistent keyframe interval
                    'preset': 'fast'
                }
            )
            ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)

            # Calculate variant file size
            variant_size = sum(f.stat().st_size for f in variant_dir.glob("*"))

            # Save variant to database
            db_variant = MediaVariant(
                media_id=media_id,
                quality=variant["name"],
                path=f"/media/hls/{media_id}/{variant['name']}/playlist.m3u8",
                bitrate=int(variant["video_bitrate"].rstrip('k')) * 1000,
                file_size=variant_size,
                width=int(variant["height"] * 16 / 9),  # Assume 16:9 aspect ratio
                height=variant["height"]
            )
            db.add(db_variant)

        except Exception as e:
            print(f"Error processing {variant['name']}: {e}")
            continue

    # Flush variants to database so they're queryable (but not yet committed)
    db.flush()

    # Generate master playlist for adaptive bitrate streaming
    try:
        create_master_playlist_video(media_id, variants, db)
    except Exception as e:
        print(f"Master playlist generation failed: {e}")

    # Generate thumbnail (skipped on file replacement so a custom/original
    # thumbnail survives, unless the media has none yet)
    if regenerate_thumbnail or not media.thumbnail_path:
        try:
            thumbnail_path = generate_thumbnail(input_path, media_id)
            media.thumbnail_path = thumbnail_path
        except Exception as e:
            print(f"Thumbnail generation failed: {e}")

    db.commit()

def process_audio(media_id: str, input_path: str, db, regenerate_thumbnail: bool = True):
    """Process audio into multiple HLS variants"""
    media = db.query(Media).filter(Media.id == media_id).first()

    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    hls_dir.mkdir(parents=True, exist_ok=True)

    # Unique per-encode segment names: nginx serves *.ts as immutable for a
    # year, so re-encodes (file replacement) must never reuse segment URLs
    seg_prefix = f"seg_{uuid.uuid4().hex[:8]}"

    # Define audio quality variants
    variants = [
        {"name": "320kbps", "bitrate": "320k"},
        {"name": "128kbps", "bitrate": "128k"},
        {"name": "64kbps", "bitrate": "64k"},
    ]

    for variant in variants:
        variant_dir = hls_dir / variant["name"]
        variant_dir.mkdir(exist_ok=True)

        playlist_path = variant_dir / "playlist.m3u8"
        segment_pattern = str(variant_dir / f"{seg_prefix}_%03d.ts")

        try:
            stream = ffmpeg.input(input_path)
            stream = ffmpeg.output(
                stream,
                str(playlist_path),
                **{
                    'c:a': 'aac',
                    'b:a': variant["bitrate"],
                    'hls_time': 4,
                    'hls_playlist_type': 'vod',
                    'hls_segment_filename': segment_pattern,
                    'hls_segment_type': 'mpegts',
                    'hls_flags': 'independent_segments'
                }
            )
            ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)

            # Calculate variant file size
            variant_size = sum(f.stat().st_size for f in variant_dir.glob("*"))

            # Save variant to database
            db_variant = MediaVariant(
                media_id=media_id,
                quality=variant["name"],
                path=f"/media/hls/{media_id}/{variant['name']}/playlist.m3u8",
                bitrate=int(variant["bitrate"].rstrip('k')) * 1000,
                file_size=variant_size
            )
            db.add(db_variant)

        except Exception as e:
            print(f"Error processing {variant['name']}: {e}")
            continue

    # Flush variants to database so they're queryable (but not yet committed)
    db.flush()

    # Generate master playlist for adaptive bitrate streaming
    try:
        create_master_playlist_audio(media_id, variants, db)
    except Exception as e:
        print(f"Master playlist generation failed: {e}")

    # Generate waveform thumbnail for audio (skipped on file replacement so a
    # custom thumbnail survives, unless the media has none yet)
    if regenerate_thumbnail or not media.thumbnail_path:
        try:
            thumbnail_path = generate_audio_thumbnail(media_id)
            media.thumbnail_path = thumbnail_path
        except Exception as e:
            print(f"Audio thumbnail generation failed: {e}")

    db.commit()


def _find_original(media_id: str) -> Optional[Path]:
    """The preserved upload (extension unknown), or None."""
    return next((Path(MEDIA_ROOT) / "original").glob(f"{media_id}.*"), None)


def _remux_eligible(probe: dict) -> bool:
    """True when the source can be copied into MP4 without re-encoding and
    still play everywhere (H.264 yuv420p video, AAC or no audio)."""
    video = next((s for s in probe["streams"] if s["codec_type"] == "video"), None)
    audio = next((s for s in probe["streams"] if s["codec_type"] == "audio"), None)
    return (
        video is not None
        and video.get("codec_name") == "h264"
        and video.get("pix_fmt") == "yuv420p"
        and (audio is None or audio.get("codec_name") == "aac")
    )


def generate_download_file(media: Media, original: Path) -> Tuple[str, int]:
    """Build the downloadable file for a media item.

    Video -> MP4 (original served as-is when it already is one, stream-copy
    remux when codecs allow, high-quality libx264 otherwise).
    Audio -> 320 kbps MP3 (original served as-is when it already is one).

    Returns (path relative to MEDIA_ROOT, size in bytes). Raises on failure.
    """
    is_video = media.media_type == MediaType.VIDEO
    target_ext = ".mp4" if is_video else ".mp3"

    if original.suffix.lower() == target_ext:
        return f"original/{original.name}", original.stat().st_size

    out_dir = Path(MEDIA_ROOT) / DOWNLOAD_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    final_path = out_dir / f"{media.id}{target_ext}"
    # Written under a temp name and renamed so a half-written file is never
    # served; format= is required because ffmpeg can't infer it from ".tmp"
    tmp_path = out_dir / f"{media.id}{target_ext}.tmp"

    probe = ffmpeg.probe(str(original))
    has_audio = any(s["codec_type"] == "audio" for s in probe["streams"])
    title = Path(media.original_filename).stem or media.id
    source = ffmpeg.input(str(original))

    if is_video:
        # Only the first video/audio stream: drops subtitles, attachments and
        # extra tracks that the MP4 muxer would choke on
        streams = [source["v:0"]] + ([source["a:0"]] if has_audio else [])
        if _remux_eligible(probe):
            codec_args = {"c": "copy"}
        else:
            codec_args = {
                "c:v": "libx264",
                "crf": 18,
                "preset": "medium",
                "pix_fmt": "yuv420p",
                "c:a": "aac",
                "b:a": "320k",
            }
        output = ffmpeg.output(
            *streams,
            str(tmp_path),
            format="mp4",
            movflags="+faststart",
            metadata=f"title={title}",
            **codec_args,
        )
    else:
        # a:0 only: embedded cover art (m4a/flac) would otherwise be muxed as
        # a video stream and fail
        output = ffmpeg.output(
            source["a:0"],
            str(tmp_path),
            format="mp3",
            metadata=f"title={title}",
            **{"c:a": "libmp3lame", "b:a": "320k", "id3v2_version": 3},
        )

    try:
        ffmpeg.run(output, overwrite_output=True, capture_stdout=True, capture_stderr=True)
    except ffmpeg.Error as e:
        tmp_path.unlink(missing_ok=True)
        stderr = e.stderr.decode(errors="replace")[-2000:] if e.stderr else ""
        raise RuntimeError(f"ffmpeg failed: {stderr}") from e

    tmp_path.rename(final_path)
    return f"{DOWNLOAD_DIR}/{final_path.name}", final_path.stat().st_size


@celery_app.task(
    bind=True,
    name="app.worker.tasks.generate_download",
    time_limit=7200,
    soft_time_limit=7000,
)
def generate_download(self, media_id: str):
    """Create (or record) the download file for one media item. Failure never
    affects playback: the media stays READY and download_status becomes
    'failed'."""
    db = SessionLocal()
    try:
        media = db.query(Media).filter(Media.id == media_id).first()
        if not media or media.status != MediaStatus.READY:
            return {"status": "skipped", "media_id": media_id}

        original = _find_original(media_id)
        if original is None:
            media.download_status = "failed"
            db.commit()
            return {"status": "no_original", "media_id": media_id}

        media.download_status = "pending"
        db.commit()

        try:
            rel_path, size = generate_download_file(media, original)
        except Exception as e:
            print(f"Download generation failed for {media_id}: {e}")
            db.rollback()
            media = db.query(Media).filter(Media.id == media_id).first()
            if media:
                media.download_status = "failed"
                db.commit()
            return {"status": "failed", "media_id": media_id}

        # The file may have been replaced while we were encoding; only record
        # the result if the original we encoded is still the current one
        db.expire_all()
        media = db.query(Media).filter(Media.id == media_id).first()
        if (
            not media
            or media.status != MediaStatus.READY
            or _find_original(media_id) != original
        ):
            if rel_path.startswith(f"{DOWNLOAD_DIR}/"):
                (Path(MEDIA_ROOT) / rel_path).unlink(missing_ok=True)
            return {"status": "stale", "media_id": media_id}

        media.download_path = rel_path
        media.download_size = size
        media.download_status = "ready"
        db.commit()
        return {"status": "success", "media_id": media_id, "path": rel_path}
    finally:
        db.close()


@celery_app.task(name="app.worker.tasks.backfill_downloads")
def backfill_downloads(batch: int = 25):
    """Queue download generation for READY media that has no download file
    (library items processed before this feature existed, or whose task was
    lost). 'failed' rows are not retried automatically. Runs from beat; the
    Redis lock keeps overlapping runs from double-queueing."""
    if not _redis_client.set(_DOWNLOAD_BACKFILL_LOCK_KEY, "1", nx=True, ex=240):
        return {"status": "locked"}

    db = SessionLocal()
    try:
        stale_before = datetime.now(timezone.utc) - timedelta(hours=3)
        rows = (
            db.query(Media.id)
            .filter(
                Media.status == MediaStatus.READY,
                Media.download_path.is_(None),
                or_(
                    Media.download_status.is_(None),
                    and_(
                        Media.download_status == "pending",
                        Media.updated_at < stale_before,
                    ),
                ),
            )
            .order_by(Media.created_at.desc())
            .limit(batch)
            .all()
        )
        media_ids = [row[0] for row in rows]
        if media_ids:
            db.query(Media).filter(Media.id.in_(media_ids)).update(
                {"download_status": "pending"}, synchronize_session=False
            )
            db.commit()
        for media_id in media_ids:
            generate_download.delay(media_id)
        return {"status": "success", "queued": len(media_ids)}
    finally:
        db.close()


def create_master_playlist_video(media_id: str, variants: list, db):
    """
    Generate HLS master playlist for adaptive bitrate streaming.
    The master playlist references all quality variants and allows Video.js
    to automatically switch between them based on network conditions.
    """
    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    master_playlist_path = hls_dir / "master.m3u8"

    # Get all successfully created variants from database
    db_variants = db.query(MediaVariant).filter(MediaVariant.media_id == media_id).all()

    if not db_variants:
        print(f"No variants found for media {media_id}, skipping master playlist")
        return

    # Build master playlist content
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3"
    ]

    for db_variant in sorted(db_variants, key=lambda v: v.bitrate, reverse=True):
        # EXT-X-STREAM-INF tag with bandwidth and resolution
        stream_info = f"#EXT-X-STREAM-INF:BANDWIDTH={db_variant.bitrate}"

        if db_variant.width and db_variant.height:
            stream_info += f",RESOLUTION={db_variant.width}x{db_variant.height}"

        lines.append(stream_info)
        # Relative path to variant playlist
        lines.append(f"{db_variant.quality}/playlist.m3u8")

    # Write master playlist
    with open(master_playlist_path, 'w') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Master playlist created at {master_playlist_path}")

def create_master_playlist_audio(media_id: str, variants: list, db):
    """
    Generate HLS master playlist for audio adaptive bitrate streaming.
    """
    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    master_playlist_path = hls_dir / "master.m3u8"

    # Get all successfully created variants from database
    db_variants = db.query(MediaVariant).filter(MediaVariant.media_id == media_id).all()

    if not db_variants:
        print(f"No variants found for media {media_id}, skipping master playlist")
        return

    # Build master playlist content
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3"
    ]

    for db_variant in sorted(db_variants, key=lambda v: v.bitrate, reverse=True):
        # EXT-X-STREAM-INF tag with bandwidth only (audio has no resolution)
        lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={db_variant.bitrate}")
        # Relative path to variant playlist
        lines.append(f"{db_variant.quality}/playlist.m3u8")

    # Write master playlist
    with open(master_playlist_path, 'w') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Master playlist created at {master_playlist_path}")

def generate_thumbnail(input_path: str, media_id: str) -> str:
    """Generate video thumbnail from middle of video"""
    thumbnail_dir = Path(MEDIA_ROOT) / "thumbnails"
    thumbnail_dir.mkdir(parents=True, exist_ok=True)

    thumbnail_path = thumbnail_dir / f"{media_id}.jpg"

    try:
        # Get video duration to find middle frame
        probe = ffmpeg.probe(input_path)
        duration = float(probe['format']['duration'])

        # Extract frame from middle of video (or 3 seconds in if video is very short)
        timestamp = min(duration / 2, max(3, duration / 2))

        stream = ffmpeg.input(input_path, ss=timestamp)
        stream = ffmpeg.output(stream, str(thumbnail_path), vframes=1, format='image2', vcodec='mjpeg')
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)

        # Resize to reasonable size; progressive JPEG renders incrementally
        # on slow connections and optimize shrinks the file
        img = Image.open(thumbnail_path)
        img.thumbnail((640, 360))
        img.save(thumbnail_path, quality=82, optimize=True, progressive=True)

        return f"/media/thumbnails/{media_id}.jpg"
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return None

def generate_thumbnail_at_timestamp(input_path: str, media_id: str, timestamp: float) -> str:
    """Generate video thumbnail at specific timestamp"""
    thumbnail_dir = Path(MEDIA_ROOT) / "thumbnails"
    thumbnail_dir.mkdir(parents=True, exist_ok=True)

    thumbnail_path = thumbnail_dir / f"{media_id}.jpg"

    try:
        stream = ffmpeg.input(input_path, ss=timestamp)
        stream = ffmpeg.output(stream, str(thumbnail_path), vframes=1, format='image2', vcodec='mjpeg')
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)

        # Resize to reasonable size; progressive JPEG renders incrementally
        img = Image.open(thumbnail_path)
        img.thumbnail((640, 360))
        img.save(thumbnail_path, quality=82, optimize=True, progressive=True)

        return f"/media/thumbnails/{media_id}.jpg"
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return None

def generate_audio_thumbnail(media_id: str) -> str:
    """Return static shared audio thumbnail path, ensuring file exists"""
    import shutil

    thumbnail_dir = Path(MEDIA_ROOT) / "thumbnails"
    thumbnail_dir.mkdir(parents=True, exist_ok=True)

    destination = thumbnail_dir / "audio-default.jpg"

    # Copy from assets if not already present
    if not destination.exists():
        assets_dir = Path(__file__).parent.parent / "assets"
        source = assets_dir / "audio-default.jpg"

        if source.exists():
            shutil.copy2(source, destination)
            print(f"Copied audio-default.jpg from assets to {destination}")
        else:
            print(f"Warning: Source audio thumbnail not found at {source}")
            return None

    # All audio files share the same optimized thumbnail for browser caching
    return "/media/thumbnails/audio-default.jpg"


@celery_app.task(bind=True, name="app.worker.tasks.process_bandwidth_logs")
def process_bandwidth_logs_task(self):
    """
    Celery task to process nginx bandwidth logs.
    Runs periodically to track actual bandwidth usage.

    The read position is persisted in Redis so it is shared across all worker
    processes (prefork workers each have their own Python globals — using a
    module-level variable caused every run to re-parse the entire log).
    """
    from .bandwidth_tracker import process_bandwidth_logs, cleanup_old_logs
    from ..database import SessionLocal

    try:
        raw_position = _redis_client.get(_BANDWIDTH_POSITION_KEY)
        last_position = int(raw_position) if raw_position else 0

        new_position = process_bandwidth_logs(
            log_file_path="/var/log/nginx/bandwidth.log",
            last_position=last_position,
        )

        _redis_client.set(_BANDWIDTH_POSITION_KEY, new_position)

        # Cleanup old logs (keep last 90 days)
        db = SessionLocal()
        try:
            cleanup_old_logs(db, days=90)
        finally:
            db.close()

        return {"status": "success", "last_position": new_position}

    except Exception as e:
        print(f"Error in bandwidth tracking task: {e}")
        return {"status": "error", "error": str(e)}
