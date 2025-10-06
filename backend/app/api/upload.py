from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Media, MediaType, MediaStatus
from ..worker.tasks import process_media
import os
import aiofiles
from pathlib import Path

router = APIRouter()

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "/media")
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".flac"}
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

def get_media_type(filename: str) -> MediaType:
    ext = Path(filename).suffix.lower()
    if ext in ALLOWED_VIDEO_EXTENSIONS:
        return MediaType.VIDEO
    elif ext in ALLOWED_AUDIO_EXTENSIONS:
        return MediaType.AUDIO
    else:
        raise ValueError(f"Unsupported file type: {ext}")

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate file type
        media_type = get_media_type(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create media record
    media = Media(
        original_filename=file.filename,
        filename=file.filename,
        media_type=media_type,
        status=MediaStatus.UPLOADING
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    # Save original file
    original_dir = Path(MEDIA_ROOT) / "original"
    original_dir.mkdir(parents=True, exist_ok=True)

    file_extension = Path(file.filename).suffix
    original_path = original_dir / f"{media.id}{file_extension}"

    try:
        # Save file in chunks
        file_size = 0
        async with aiofiles.open(original_path, 'wb') as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    await f.close()
                    original_path.unlink()
                    db.delete(media)
                    db.commit()
                    raise HTTPException(status_code=400, detail="File too large")
                await f.write(chunk)

        # Update media record
        media.file_size = file_size
        media.status = MediaStatus.PROCESSING
        db.commit()

        # Queue processing task
        process_media.delay(media.id, str(original_path))

        return {
            "id": media.id,
            "filename": media.original_filename,
            "status": media.status,
            "message": "File uploaded successfully, processing started"
        }

    except Exception as e:
        # Clean up on error
        if original_path.exists():
            original_path.unlink()
        db.delete(media)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/upload/status/{media_id}")
async def get_upload_status(media_id: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return {
        "id": media.id,
        "filename": media.original_filename,
        "status": media.status,
        "error": media.error_message,
        "variants": [
            {
                "quality": v.quality,
                "path": v.path,
                "bitrate": v.bitrate,
                "file_size": v.file_size
            }
            for v in media.variants
        ] if media.status == MediaStatus.READY else []
    }
