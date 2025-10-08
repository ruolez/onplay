#!/usr/bin/env python3
"""Regenerate thumbnails for all audio files"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.models import Media, MediaType
from app.worker.tasks import generate_audio_thumbnail

def main():
    db = SessionLocal()
    try:
        # Get all audio media
        audio_files = db.query(Media).filter(Media.media_type == MediaType.AUDIO).all()

        print(f"Found {len(audio_files)} audio files")

        for media in audio_files:
            print(f"Regenerating thumbnail for: {media.filename}")
            try:
                thumbnail_path = generate_audio_thumbnail(media.id)
                print(f"  ✓ Generated: {thumbnail_path}")
            except Exception as e:
                print(f"  ✗ Error: {e}")

        print(f"\n✓ Complete! Regenerated {len(audio_files)} thumbnails")

    finally:
        db.close()

if __name__ == "__main__":
    main()
