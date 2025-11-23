from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Tag, Media, media_tags
from pydantic import BaseModel
from typing import List

router = APIRouter()

class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    id: int
    name: str
    media_count: int

    class Config:
        from_attributes = True

@router.get("/tags", response_model=List[TagResponse])
async def get_all_tags(db: Session = Depends(get_db)):
    """Get all existing tags with media count"""
    results = db.query(
        Tag.id,
        Tag.name,
        func.count(media_tags.c.media_id).label('media_count')
    ).outerjoin(
        media_tags, Tag.id == media_tags.c.tag_id
    ).group_by(Tag.id).order_by(Tag.name).all()

    return [{"id": r.id, "name": r.name, "media_count": r.media_count} for r in results]


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Delete a tag from the system (only if unused)"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check if tag is in use
    usage_count = db.query(func.count(media_tags.c.media_id)).filter(
        media_tags.c.tag_id == tag_id
    ).scalar()

    if usage_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Tag is still used by {usage_count} media item(s)"
        )

    db.delete(tag)
    db.commit()

    return {"message": "Tag deleted successfully"}

@router.post("/media/{media_id}/tags")
async def add_tag_to_media(
    media_id: str,
    tag_data: TagCreate,
    db: Session = Depends(get_db)
):
    """Add a tag to media, creating the tag if it doesn't exist"""
    # Check if media exists
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Get or create tag (case-insensitive)
    tag = db.query(Tag).filter(func.lower(Tag.name) == func.lower(tag_data.name)).first()
    if not tag:
        tag = Tag(name=tag_data.name.strip())
        db.add(tag)
        db.flush()

    # Add tag to media if not already present
    if tag not in media.tags:
        media.tags.append(tag)
        db.commit()

    return {"message": "Tag added successfully", "tag": {"id": tag.id, "name": tag.name}}

@router.delete("/media/{media_id}/tags/{tag_id}")
async def remove_tag_from_media(
    media_id: str,
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Remove a tag from media"""
    # Check if media exists
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Check if tag exists
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Remove tag from media
    if tag in media.tags:
        media.tags.remove(tag)
        db.commit()

    return {"message": "Tag removed successfully"}
