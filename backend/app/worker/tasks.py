from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import Media, MediaVariant, MediaStatus, MediaType
import ffmpeg
import os
from pathlib import Path
from PIL import Image
import mutagen

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "/media")

@celery_app.task(bind=True, name="app.worker.tasks.process_media")
def process_media(self, media_id: str, original_path: str):
    db = SessionLocal()
    try:
        media = db.query(Media).filter(Media.id == media_id).first()
        if not media:
            raise Exception(f"Media {media_id} not found")

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
            process_video(media_id, original_path, db)
        elif media.media_type == MediaType.AUDIO:
            process_audio(media_id, original_path, db)

        # Update status to ready
        media.status = MediaStatus.READY
        db.commit()

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

def process_video(media_id: str, input_path: str, db):
    """Process video into multiple HLS variants"""
    media = db.query(Media).filter(Media.id == media_id).first()

    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    hls_dir.mkdir(parents=True, exist_ok=True)

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
        segment_pattern = str(variant_dir / "segment_%03d.ts")

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
                    'hls_time': 6,
                    'hls_playlist_type': 'vod',
                    'hls_segment_filename': segment_pattern,
                    'preset': 'fast',
                    'movflags': '+faststart'
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

    # Generate thumbnail
    try:
        thumbnail_path = generate_thumbnail(input_path, media_id)
        media.thumbnail_path = thumbnail_path
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")

    db.commit()

def process_audio(media_id: str, input_path: str, db):
    """Process audio into multiple HLS variants"""
    media = db.query(Media).filter(Media.id == media_id).first()

    hls_dir = Path(MEDIA_ROOT) / "hls" / media_id
    hls_dir.mkdir(parents=True, exist_ok=True)

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
        segment_pattern = str(variant_dir / "segment_%03d.ts")

        try:
            stream = ffmpeg.input(input_path)
            stream = ffmpeg.output(
                stream,
                str(playlist_path),
                **{
                    'c:a': 'aac',
                    'b:a': variant["bitrate"],
                    'hls_time': 6,
                    'hls_playlist_type': 'vod',
                    'hls_segment_filename': segment_pattern
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

    # Generate waveform thumbnail for audio
    try:
        thumbnail_path = generate_audio_thumbnail(media_id)
        media.thumbnail_path = thumbnail_path
    except Exception as e:
        print(f"Audio thumbnail generation failed: {e}")

    db.commit()

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

        # Resize to reasonable size
        img = Image.open(thumbnail_path)
        img.thumbnail((640, 360))
        img.save(thumbnail_path, quality=85)

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

        # Resize to reasonable size
        img = Image.open(thumbnail_path)
        img.thumbnail((640, 360))
        img.save(thumbnail_path, quality=85)

        return f"/media/thumbnails/{media_id}.jpg"
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return None

def generate_audio_thumbnail(media_id: str) -> str:
    """Use static colorful space image for audio thumbnails"""
    import shutil

    thumbnail_dir = Path(MEDIA_ROOT) / "thumbnails"
    thumbnail_dir.mkdir(parents=True, exist_ok=True)
    thumbnail_path = thumbnail_dir / f"{media_id}.jpg"

    # Path to static audio thumbnail image
    static_thumbnail = Path(__file__).parent.parent / "assets" / "audio-default.jpg"

    # Copy static image to media thumbnail location
    shutil.copy(static_thumbnail, thumbnail_path)

    return f"/media/thumbnails/{media_id}.jpg"


# Bandwidth tracking state (stores last log file position)
_last_log_position = 0


@celery_app.task(bind=True, name="app.worker.tasks.process_bandwidth_logs")
def process_bandwidth_logs_task(self):
    """
    Celery task to process nginx bandwidth logs.
    Runs periodically to track actual bandwidth usage.
    """
    global _last_log_position

    from .bandwidth_tracker import process_bandwidth_logs, cleanup_old_logs
    from ..database import SessionLocal

    try:
        # Process logs from last position
        _last_log_position = process_bandwidth_logs(
            log_file_path="/var/log/nginx/bandwidth.log",
            last_position=_last_log_position
        )

        # Cleanup old logs (keep last 90 days)
        db = SessionLocal()
        try:
            cleanup_old_logs(db, days=90)
        finally:
            db.close()

        return {"status": "success", "last_position": _last_log_position}

    except Exception as e:
        print(f"Error in bandwidth tracking task: {e}")
        return {"status": "error", "error": str(e)}
