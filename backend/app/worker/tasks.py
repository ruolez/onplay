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
    """Generate modern smooth audio thumbnail with glassmorphism design"""
    from PIL import ImageDraw, ImageFilter
    import math

    thumbnail_dir = Path(MEDIA_ROOT) / "thumbnails"
    thumbnail_dir.mkdir(parents=True, exist_ok=True)
    thumbnail_path = thumbnail_dir / f"{media_id}.jpg"

    width, height = 640, 360

    # Create base image with smooth mesh gradient background
    img = Image.new('RGB', (width, height))
    pixels = img.load()

    # Multi-point gradient for smooth modern look
    gradient_points = [
        {'x': 0, 'y': 0, 'color': (15, 10, 35)},           # Top-left: deep purple-blue
        {'x': width, 'y': 0, 'color': (25, 15, 45)},       # Top-right: slightly lighter
        {'x': 0, 'y': height, 'color': (10, 8, 25)},       # Bottom-left: darker
        {'x': width, 'y': height, 'color': (20, 12, 40)},  # Bottom-right: medium
        {'x': width//2, 'y': height//2, 'color': (30, 20, 55)} # Center: accent
    ]

    # Smooth gradient calculation
    for y in range(height):
        for x in range(width):
            r_total, g_total, b_total, weight_total = 0, 0, 0, 0

            for point in gradient_points:
                # Distance-based weighting for smooth blend
                dist = math.sqrt((x - point['x'])**2 + (y - point['y'])**2) + 1
                weight = 1 / (dist ** 0.8)

                r_total += point['color'][0] * weight
                g_total += point['color'][1] * weight
                b_total += point['color'][2] * weight
                weight_total += weight

            pixels[x, y] = (
                int(r_total / weight_total),
                int(g_total / weight_total),
                int(b_total / weight_total)
            )

    # Apply subtle blur for ultra-smooth gradient
    img = img.filter(ImageFilter.GaussianBlur(radius=2))

    # Create alpha layer for glassmorphism effects
    alpha_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    alpha_draw = ImageDraw.Draw(alpha_layer)

    # Add soft ambient glow circles in background
    center_x, center_y = width // 2, height // 2

    # Large soft glow orbs
    for i, (offset_x, offset_y, size, color) in enumerate([
        (-80, -40, 150, (100, 60, 200, 15)),
        (90, 50, 180, (120, 80, 220, 12)),
        (-50, 80, 120, (80, 50, 180, 18)),
    ]):
        for radius_step in range(size, 0, -10):
            alpha_val = int((radius_step / size) * color[3])
            alpha_draw.ellipse([
                center_x + offset_x - radius_step,
                center_y + offset_y - radius_step,
                center_x + offset_x + radius_step,
                center_y + offset_y + radius_step
            ], fill=(*color[:3], alpha_val))

    # Composite alpha effects
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, alpha_layer)
    img = img.convert('RGB')

    # Draw smooth flowing waveform
    wave_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    wave_draw = ImageDraw.Draw(wave_layer)

    num_bars = 60
    bar_width = 4
    bar_spacing = (width - num_bars * bar_width) / (num_bars + 1)

    for i in range(num_bars):
        # Smooth wave using multiple sine waves for organic feel
        t = i / num_bars * math.pi * 2
        wave1 = math.sin(t * 2.5) * 0.4
        wave2 = math.sin(t * 1.3 + 0.5) * 0.35
        wave3 = math.sin(t * 3.7 + 1.2) * 0.25

        height_factor = abs(wave1 + wave2 + wave3)
        bar_height = int(height_factor * 100) + 10

        x = bar_spacing + i * (bar_width + bar_spacing)
        y_top = center_y - bar_height // 2
        y_bottom = center_y + bar_height // 2

        # Smooth gradient from center to edges of each bar
        for bar_y in range(y_top, y_bottom):
            progress = abs(bar_y - center_y) / (bar_height / 2) if bar_height > 0 else 0

            # Glassmorphic color - brighter in center, transparent at edges
            base_intensity = 1 - progress * 0.4
            alpha = int((1 - progress * 0.6) * 180)

            # Soft purple-pink gradient
            r = int(140 * base_intensity + progress * 20)
            g = int(100 * base_intensity + progress * 40)
            b = int(255 * base_intensity)

            wave_draw.rectangle([
                int(x), bar_y,
                int(x + bar_width), bar_y + 1
            ], fill=(r, g, b, alpha))

    # Apply blur to waveform for ultra-smooth appearance
    wave_layer = wave_layer.filter(ImageFilter.GaussianBlur(radius=1.5))

    # Composite waveform
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, wave_layer)

    # Add subtle frosted glass effect overlay
    glass_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    glass_draw = ImageDraw.Draw(glass_layer)

    # Frosted rounded rectangle behind waveform
    padding = 60
    glass_draw.rounded_rectangle([
        padding, center_y - 80,
        width - padding, center_y + 80
    ], radius=20, fill=(255, 255, 255, 8))

    img = Image.alpha_composite(img, glass_layer)
    img = img.convert('RGB')

    # Final subtle sharpening for crisp edges on smooth background
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=80, threshold=3))

    img.save(thumbnail_path, quality=95)
    return f"/media/thumbnails/{media_id}.jpg"
