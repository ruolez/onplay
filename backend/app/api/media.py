from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from ..database import get_db
from ..models import Media, MediaStatus, MediaType, MediaVariant, Analytics
from typing import Optional, List
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from PIL import Image
import io

router = APIRouter()

class MediaResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    media_type: str
    status: str
    file_size: Optional[int]
    duration: Optional[float]
    width: Optional[int]
    height: Optional[int]
    thumbnail_path: Optional[str]
    created_at: str
    variants: List[dict]

    class Config:
        from_attributes = True

@router.get("/media")
async def list_media(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    media_type: Optional[MediaType] = None,
    status: Optional[MediaStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Media)

    if media_type:
        query = query.filter(Media.media_type == media_type)
    if status:
        query = query.filter(Media.status == status)

    total = query.count()
    media_list = query.order_by(desc(Media.created_at)).offset(skip).limit(limit).all()

    # Build play count subquery for efficient aggregation
    play_counts = {}
    if media_list:
        media_ids = [m.id for m in media_list]
        play_count_results = db.query(
            Analytics.media_id,
            func.count(Analytics.id).label('play_count')
        ).filter(
            Analytics.media_id.in_(media_ids),
            Analytics.event_type == "play"
        ).group_by(Analytics.media_id).all()

        play_counts = {media_id: count for media_id, count in play_count_results}

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": m.id,
                "filename": m.original_filename,
                "media_type": m.media_type,
                "status": m.status,
                "duration": m.duration,
                "thumbnail_path": m.thumbnail_path,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "file_size": m.file_size,
                "play_count": play_counts.get(m.id, 0),
                "tags": [{"id": t.id, "name": t.name} for t in m.tags]
            }
            for m in media_list
        ]
    }

@router.get("/media/{media_id}")
async def get_media(media_id: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return {
        "id": media.id,
        "filename": media.original_filename,
        "media_type": media.media_type,
        "status": media.status,
        "file_size": media.file_size,
        "duration": media.duration,
        "width": media.width,
        "height": media.height,
        "codec": media.codec,
        "bitrate": media.bitrate,
        "thumbnail_path": media.thumbnail_path,
        "error_message": media.error_message,
        "created_at": media.created_at.isoformat() if media.created_at else None,
        "variants": [
            {
                "quality": v.quality,
                "path": v.path,
                "bitrate": v.bitrate,
                "file_size": v.file_size,
                "width": v.width,
                "height": v.height
            }
            for v in media.variants
        ],
        "tags": [{"id": t.id, "name": t.name} for t in media.tags]
    }

class DeleteRequest(BaseModel):
    password: str

class RenameRequest(BaseModel):
    filename: str

class ThumbnailRequest(BaseModel):
    timestamp: float

@router.post("/media/{media_id}/thumbnail")
async def set_thumbnail(
    media_id: str,
    request: ThumbnailRequest,
    db: Session = Depends(get_db)
):
    from ..worker.tasks import generate_thumbnail_at_timestamp

    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Find original file
    media_root = os.getenv("MEDIA_ROOT", "/media")
    original_dir = Path(media_root) / "original"

    original_file = None
    for file in original_dir.glob(f"{media_id}.*"):
        original_file = str(file)
        break

    if not original_file or not os.path.exists(original_file):
        raise HTTPException(status_code=404, detail="Original file not found")

    # Generate thumbnail at specific timestamp
    try:
        thumbnail_path = generate_thumbnail_at_timestamp(original_file, media_id, request.timestamp)
        if thumbnail_path:
            media.thumbnail_path = thumbnail_path
            db.commit()
            return {"message": "Thumbnail updated successfully", "thumbnail_path": thumbnail_path}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail generation failed: {str(e)}")


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/media/{media_id}/thumbnail/upload")
async def upload_thumbnail(
    media_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a custom thumbnail image for any media type (video or audio)."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Validate content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: JPEG, PNG, WebP, GIF"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_THUMBNAIL_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5MB"
        )

    try:
        # Open and process image
        img = Image.open(io.BytesIO(content))

        # Convert to RGB if necessary (handles RGBA, P mode, etc.)
        if img.mode in ("RGBA", "P", "LA"):
            # Create white background for transparent images
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Resize to max 640x360 maintaining aspect ratio
        img.thumbnail((640, 360), Image.Resampling.LANCZOS)

        # Save to thumbnails directory
        media_root = os.getenv("MEDIA_ROOT", "/media")
        thumbnail_dir = Path(media_root) / "thumbnails"
        thumbnail_dir.mkdir(parents=True, exist_ok=True)

        thumbnail_path = thumbnail_dir / f"{media_id}.jpg"
        img.save(thumbnail_path, "JPEG", quality=85)

        # Update database
        media.thumbnail_path = f"/media/thumbnails/{media_id}.jpg"
        db.commit()

        return {
            "message": "Thumbnail uploaded successfully",
            "thumbnail_path": media.thumbnail_path
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )


@router.patch("/media/{media_id}")
async def rename_media(
    media_id: str,
    request: RenameRequest,
    db: Session = Depends(get_db)
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    media.original_filename = request.filename
    db.commit()

    return {"message": "Media renamed successfully", "filename": request.filename}

@router.delete("/media/{media_id}")
async def delete_media(
    media_id: str,
    request: DeleteRequest,
    db: Session = Depends(get_db)
):
    # Verify password
    if request.password != "ddd":
        raise HTTPException(status_code=403, detail="Invalid password")

    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete files from disk
    media_root = os.getenv("MEDIA_ROOT", "/media")

    # Delete original file (stored as /media/original/{media_id}{extension})
    original_dir = Path(media_root) / "original"
    for original_file in original_dir.glob(f"{media_id}.*"):
        try:
            os.remove(original_file)
        except Exception as e:
            print(f"Error deleting original file: {e}")

    # Delete HLS directory
    hls_dir = Path(media_root) / "hls" / media_id
    if hls_dir.exists():
        try:
            shutil.rmtree(hls_dir)
        except Exception as e:
            print(f"Error deleting HLS directory: {e}")

    # Delete thumbnail
    if media.thumbnail_path:
        thumbnail_full_path = Path(media_root) / media.thumbnail_path.lstrip("/media/")
        if thumbnail_full_path.exists():
            try:
                os.remove(thumbnail_full_path)
            except Exception as e:
                print(f"Error deleting thumbnail: {e}")

    # Delete from database
    db.delete(media)
    db.commit()

    return {"message": "Media deleted successfully"}

@router.get("/media/stats/overview")
async def get_stats_overview(db: Session = Depends(get_db)):
    total_media = db.query(func.count(Media.id)).scalar()
    total_videos = db.query(func.count(Media.id)).filter(Media.media_type == MediaType.VIDEO).scalar()
    total_audio = db.query(func.count(Media.id)).filter(Media.media_type == MediaType.AUDIO).scalar()
    processing = db.query(func.count(Media.id)).filter(Media.status == MediaStatus.PROCESSING).scalar()
    ready = db.query(func.count(Media.id)).filter(Media.status == MediaStatus.READY).scalar()
    failed = db.query(func.count(Media.id)).filter(Media.status == MediaStatus.FAILED).scalar()

    total_size = db.query(func.sum(Media.file_size)).scalar() or 0
    total_duration = db.query(func.sum(Media.duration)).scalar() or 0

    return {
        "total_media": total_media,
        "total_videos": total_videos,
        "total_audio": total_audio,
        "processing": processing,
        "ready": ready,
        "failed": failed,
        "total_size_bytes": total_size,
        "total_duration_seconds": total_duration
    }
