from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models import Analytics, Media
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import socket

router = APIRouter()

def get_hostname(ip: str) -> str:
    """Try to resolve IP to hostname, return IP if fails"""
    if not ip or ip == "unknown":
        return "unknown"
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except:
        return ip

class AnalyticsEvent(BaseModel):
    media_id: str
    event_type: str  # play, pause, complete, seek, error
    session_id: Optional[str] = None
    data: Optional[dict] = None

@router.post("/analytics/track")
async def track_event(
    event: AnalyticsEvent,
    request: Request,
    db: Session = Depends(get_db)
):
    # Verify media exists
    media = db.query(Media).filter(Media.id == event.media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Create analytics record
    analytics = Analytics(
        media_id=event.media_id,
        event_type=event.event_type,
        device=None,
        browser=None,
        ip_address=request.client.host if request.client else None,
        session_id=event.session_id,
        data=event.data
    )
    db.add(analytics)
    db.commit()

    return {"message": "Event tracked successfully"}

@router.get("/analytics/media/{media_id}")
async def get_media_analytics(media_id: str, db: Session = Depends(get_db)):
    # Verify media exists
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    total_plays = db.query(func.count(Analytics.id)).filter(
        Analytics.media_id == media_id,
        Analytics.event_type == "play"
    ).scalar() or 0

    total_completes = db.query(func.count(Analytics.id)).filter(
        Analytics.media_id == media_id,
        Analytics.event_type == "complete"
    ).scalar() or 0

    completion_rate = (total_completes / total_plays * 100) if total_plays > 0 else 0

    return {
        "media_id": media_id,
        "filename": media.original_filename,
        "total_plays": total_plays,
        "total_completes": total_completes,
        "completion_rate": round(completion_rate, 2)
    }

@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = 7,
    db: Session = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(days=days)

    total_plays = db.query(func.count(Analytics.id)).filter(
        Analytics.event_type == "play",
        Analytics.timestamp >= since
    ).scalar() or 0

    total_completes = db.query(func.count(Analytics.id)).filter(
        Analytics.event_type == "complete",
        Analytics.timestamp >= since
    ).scalar() or 0

    # Calculate estimated bandwidth using HLS variants (more accurate than original file size)
    play_events = db.query(Analytics).filter(
        Analytics.event_type == "play",
        Analytics.timestamp >= since
    ).all()

    total_bandwidth = 0
    bandwidth_by_ip = {}

    for event in play_events:
        media = db.query(Media).filter(Media.id == event.media_id).first()
        if media and media.variants:
            # Use the average HLS variant size (more accurate than original)
            avg_variant_size = sum(v.file_size for v in media.variants if v.file_size) / len([v for v in media.variants if v.file_size]) if media.variants else 0

            if avg_variant_size > 0:
                total_bandwidth += avg_variant_size

                # Track by IP
                ip = event.ip_address or "unknown"
                if ip not in bandwidth_by_ip:
                    bandwidth_by_ip[ip] = {"bandwidth": 0, "plays": 0}
                bandwidth_by_ip[ip]["bandwidth"] += avg_variant_size
                bandwidth_by_ip[ip]["plays"] += 1

    # Convert to sorted list with hostnames
    bandwidth_by_ip_list = [
        {
            "ip": ip,
            "hostname": get_hostname(ip),
            "bandwidth_bytes": data["bandwidth"],
            "plays": data["plays"]
        }
        for ip, data in bandwidth_by_ip.items()
    ]
    bandwidth_by_ip_list.sort(key=lambda x: x["bandwidth_bytes"], reverse=True)

    # Top media by plays
    top_media = db.query(
        Analytics.media_id,
        func.count(Analytics.id).label("play_count")
    ).filter(
        Analytics.event_type == "play",
        Analytics.timestamp >= since
    ).group_by(Analytics.media_id).order_by(desc("play_count")).limit(10).all()

    top_media_details = []
    for tm in top_media:
        media = db.query(Media).filter(Media.id == tm.media_id).first()
        if media:
            top_media_details.append({
                "media_id": tm.media_id,
                "filename": media.original_filename,
                "play_count": tm.play_count
            })

    return {
        "period_days": days,
        "total_plays": total_plays,
        "total_completes": total_completes,
        "total_bandwidth_bytes": total_bandwidth,
        "bandwidth_by_ip": bandwidth_by_ip_list[:10],  # Top 10 IPs
        "top_media": top_media_details
    }
