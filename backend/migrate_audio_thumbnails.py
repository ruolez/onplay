#!/usr/bin/env python3
"""
Migrate all audio media records to use shared static thumbnail.
Updates database to point all audio files to /media/thumbnails/audio-default.jpg
"""

import sys
import os
import shutil
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Media, MediaType

def migrate_audio_thumbnails():
    """Update all audio media records to use shared thumbnail"""
    db = SessionLocal()

    try:
        # Ensure audio-default.jpg exists in destination
        media_root = os.getenv("MEDIA_ROOT", "/media")
        thumbnail_dir = Path(media_root) / "thumbnails"
        thumbnail_dir.mkdir(parents=True, exist_ok=True)

        destination = thumbnail_dir / "audio-default.jpg"

        # Copy from assets if not present
        if not destination.exists():
            assets_dir = Path(__file__).parent / "app" / "assets"
            source = assets_dir / "audio-default.jpg"

            if source.exists():
                shutil.copy2(source, destination)
                print(f"✅ Copied audio-default.jpg to {destination}")
            else:
                print(f"❌ ERROR: Source thumbnail not found at {source}")
                print("Cannot migrate without source file!")
                return
        else:
            print(f"✅ audio-default.jpg already exists at {destination}")

        # Get all audio media
        audio_media = db.query(Media).filter(Media.media_type == MediaType.AUDIO).all()

        print(f"\nFound {len(audio_media)} audio files")

        if len(audio_media) == 0:
            print("No audio files to migrate")
            return

        # Update all to use shared thumbnail
        updated_count = 0
        for media in audio_media:
            old_path = media.thumbnail_path
            media.thumbnail_path = "/media/thumbnails/audio-default.jpg"
            updated_count += 1

            if updated_count <= 5:  # Show first 5 examples
                print(f"  {media.filename}: {old_path} -> {media.thumbnail_path}")

        # Commit changes
        db.commit()

        print(f"\n✅ Updated {updated_count} audio files to use shared thumbnail")
        print(f"All audio files now point to: /media/thumbnails/audio-default.jpg")

    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_audio_thumbnails()
