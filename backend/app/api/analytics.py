from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from sqlalchemy.dialects.postgresql import insert as pg_insert
from ..auth import require_admin
from ..client_info import get_client_ip, parse_user_agent
from ..geoip import get_location
from ..database import get_db
from ..models import Analytics, Listener, Media, BandwidthStats
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
import functools
import socket

router = APIRouter()

# Cap DNS lookups: gethostbyaddr blocks the FastAPI worker, and many client
# IPs have no reverse record (we'd otherwise wait the OS default ~5s).
socket.setdefaulttimeout(0.5)


@functools.lru_cache(maxsize=1024)
def get_hostname(ip: str) -> str:
    """Try to resolve IP to hostname, return IP if fails.

    Cached per-process to avoid repeating the same blocking lookup on every
    analytics overview request.
    """
    if not ip or ip == "unknown":
        return "unknown"
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror, socket.timeout, OSError):
        return ip

class AnalyticsEvent(BaseModel):
    media_id: str
    event_type: str  # play, pause, complete, seek, error
    session_id: Optional[str] = None
    listener_id: Optional[str] = None  # persistent client UUID from localStorage
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

    listener_id = (event.listener_id or "").strip()[:64] or None
    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent")
    device, browser, os_name = parse_user_agent(user_agent)

    analytics = Analytics(
        media_id=event.media_id,
        event_type=event.event_type,
        device=device,
        browser=browser,
        os=os_name,
        ip_address=ip,
        session_id=event.session_id,
        listener_id=listener_id,
        data=event.data
    )
    db.add(analytics)

    if listener_id:
        play_inc = 1 if event.event_type == "play" else 0
        stmt = pg_insert(Listener).values(
            id=listener_id,
            ip_address=ip,
            user_agent=user_agent,
            device=device,
            browser=browser,
            os=os_name,
            total_events=1,
            total_plays=play_inc,
        ).on_conflict_do_update(
            index_elements=[Listener.id],
            set_={
                "last_seen": func.now(),
                "ip_address": ip,
                "user_agent": user_agent,
                "device": device,
                "browser": browser,
                "os": os_name,
                "total_events": Listener.total_events + 1,
                "total_plays": Listener.total_plays + play_inc,
            },
        )
        db.execute(stmt)

    db.commit()

    return {"message": "Event tracked successfully"}

@router.get("/analytics/media/{media_id}", dependencies=[Depends(require_admin)])
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

@router.get("/analytics/overview", dependencies=[Depends(require_admin)])
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

    # Get ACTUAL bandwidth from nginx logs (via BandwidthStats)
    # This is real data from HLS segment downloads, not estimates
    total_bandwidth = db.query(
        func.sum(BandwidthStats.total_bytes)
    ).filter(
        BandwidthStats.date >= since
    ).scalar() or 0

    # Bandwidth by IP (actual usage)
    bandwidth_by_ip_raw = db.query(
        BandwidthStats.ip_address,
        func.sum(BandwidthStats.total_bytes).label('total_bytes'),
        func.sum(BandwidthStats.request_count).label('request_count')
    ).filter(
        BandwidthStats.date >= since
    ).group_by(
        BandwidthStats.ip_address
    ).order_by(
        func.sum(BandwidthStats.total_bytes).desc()
    ).limit(10).all()

    # Convert to list with hostnames
    bandwidth_by_ip_list = [
        {
            "ip": ip,
            "hostname": get_hostname(ip),
            "bandwidth_bytes": int(total_bytes),
            "requests": int(request_count)
        }
        for ip, total_bytes, request_count in bandwidth_by_ip_raw
    ]

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

def _pct_delta(current: float, previous: float):
    """Percent change vs previous period; None when there is no baseline."""
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


@router.get("/analytics/dashboard", dependencies=[Depends(require_admin)])
async def get_analytics_dashboard(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Consolidated data for the admin analytics overview: KPIs with
    previous-period deltas, a gap-filled daily timeseries, listener
    device/browser/os breakdowns, and top media - one round trip.

    Windows are aligned to UTC calendar days so buckets and the
    previous-period comparison are like-for-like; "today" is a partial
    bucket in both the chart and the KPIs (standard analytics behavior).
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    cur_start = today_start - timedelta(days=days - 1)
    prev_start = cur_start - timedelta(days=days)

    # --- Summary: both windows in one pass via COUNT(...) FILTER (...) ---
    in_current = Analytics.timestamp >= cur_start
    in_previous = Analytics.timestamp < cur_start
    row = db.query(
        func.count(Analytics.id).filter(Analytics.event_type == "play", in_current).label("plays"),
        func.count(Analytics.id).filter(Analytics.event_type == "complete", in_current).label("completions"),
        func.count(func.distinct(Analytics.listener_id)).filter(Analytics.event_type == "play", in_current).label("listeners"),
        func.count(Analytics.id).filter(Analytics.event_type == "play", in_previous).label("prev_plays"),
        func.count(Analytics.id).filter(Analytics.event_type == "complete", in_previous).label("prev_completions"),
        func.count(func.distinct(Analytics.listener_id)).filter(Analytics.event_type == "play", in_previous).label("prev_listeners"),
    ).filter(
        Analytics.timestamp >= prev_start,
        Analytics.event_type.in_(["play", "complete"]),
    ).one()

    rate = round(row.completions / row.plays * 100, 1) if row.plays else 0.0
    prev_rate = round(row.prev_completions / row.prev_plays * 100, 1) if row.prev_plays else 0.0

    summary = {
        "current": {
            "plays": row.plays,
            "unique_listeners": row.listeners,
            "completions": row.completions,
            "completion_rate": rate,
        },
        "previous": {
            "plays": row.prev_plays,
            "unique_listeners": row.prev_listeners,
            "completions": row.prev_completions,
            "completion_rate": prev_rate,
        },
        "deltas": {
            "plays": _pct_delta(row.plays, row.prev_plays),
            "unique_listeners": _pct_delta(row.listeners, row.prev_listeners),
            "completions": _pct_delta(row.completions, row.prev_completions),
            # percentage-point difference (percent-change of a rate misleads)
            "completion_rate_pp": round(rate - prev_rate, 1) if row.prev_plays else None,
        },
    }

    # --- Timeseries: daily buckets, gap-filled with zeros server-side ---
    day_col = func.date_trunc("day", Analytics.timestamp)
    ts_rows = db.query(
        day_col.label("day"),
        func.count(Analytics.id).filter(Analytics.event_type == "play").label("plays"),
        func.count(Analytics.id).filter(Analytics.event_type == "complete").label("completions"),
        func.count(func.distinct(Analytics.listener_id)).filter(Analytics.event_type == "play").label("listeners"),
    ).filter(
        Analytics.timestamp >= cur_start,
        Analytics.event_type.in_(["play", "complete"]),
    ).group_by(day_col).all()

    by_day = {r.day.date(): r for r in ts_rows}
    timeseries = []
    for i in range(days):
        day = (cur_start + timedelta(days=i)).date()
        r = by_day.get(day)
        timeseries.append({
            "date": day.isoformat(),
            "plays": r.plays if r else 0,
            "unique_listeners": r.listeners if r else 0,
            "completions": r.completions if r else 0,
        })

    # --- Breakdowns: same cohort as the unique-listeners KPI. Rows without
    # a listener_id (recorded before listener tracking) are excluded;
    # "Unknown" covers only unparseable user agents. ---
    def breakdown(column):
        rows = db.query(
            func.coalesce(column, "Unknown").label("name"),
            func.count(func.distinct(Analytics.listener_id)).label("listeners"),
        ).filter(
            Analytics.timestamp >= cur_start,
            Analytics.event_type == "play",
            Analytics.listener_id.isnot(None),
        ).group_by("name").order_by(desc("listeners")).all()
        return [{"name": r.name, "listeners": r.listeners} for r in rows]

    devices = {
        "device": breakdown(Analytics.device),
        "browser": breakdown(Analytics.browser),
        "os": breakdown(Analytics.os),
    }

    # --- Top media: one grouped query + one batch Media fetch (no N+1) ---
    top_rows = db.query(
        Analytics.media_id,
        func.count(Analytics.id).filter(Analytics.event_type == "play").label("plays"),
        func.count(Analytics.id).filter(Analytics.event_type == "complete").label("completions"),
        func.count(func.distinct(Analytics.listener_id)).filter(Analytics.event_type == "play").label("listeners"),
        func.max(Analytics.timestamp).filter(Analytics.event_type == "play").label("last_played"),
    ).filter(
        Analytics.timestamp >= cur_start,
        Analytics.event_type.in_(["play", "complete"]),
    ).group_by(Analytics.media_id).having(
        func.count(Analytics.id).filter(Analytics.event_type == "play") > 0
    ).order_by(desc("plays")).limit(10).all()

    from .media import versioned_thumbnail

    media_by_id = {}
    if top_rows:
        media_by_id = {
            m.id: m
            for m in db.query(Media).filter(Media.id.in_([r.media_id for r in top_rows])).all()
        }

    top_media = []
    for r in top_rows:
        media = media_by_id.get(r.media_id)
        if not media:
            continue
        top_media.append({
            "media_id": r.media_id,
            "filename": media.original_filename,
            "media_type": media.media_type.value,
            "thumbnail_path": versioned_thumbnail(media),
            "plays": r.plays,
            "completions": r.completions,
            "completion_rate": round(r.completions / r.plays * 100, 1) if r.plays else 0.0,
            "unique_listeners": r.listeners,
            "last_played": r.last_played.isoformat() if r.last_played else None,
        })

    return {
        "period_days": days,
        "summary": summary,
        "timeseries": timeseries,
        "devices": devices,
        "top_media": top_media,
    }


@router.get("/analytics/listeners", dependencies=[Depends(require_admin)])
async def list_listeners(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    days: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(Listener)
    if days:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Listener.last_seen >= since)

    total = query.count()
    listeners = query.order_by(desc(Listener.last_seen)).offset(skip).limit(limit).all()

    unique_media = {}
    if listeners:
        listener_ids = [l.id for l in listeners]
        rows = db.query(
            Analytics.listener_id,
            func.count(func.distinct(Analytics.media_id))
        ).filter(
            Analytics.listener_id.in_(listener_ids)
        ).group_by(Analytics.listener_id).all()
        unique_media = {listener_id: count for listener_id, count in rows}

    items = []
    for l in listeners:
        city, region, country = get_location(l.ip_address)
        items.append({
            "listener_id": l.id,
            "ip_address": l.ip_address,
            "hostname": get_hostname(l.ip_address) if l.ip_address else None,
            "city": city,
            "region": region,
            "country": country,
            "device": l.device,
            "browser": l.browser,
            "os": l.os,
            "first_seen": l.first_seen.isoformat() if l.first_seen else None,
            "last_seen": l.last_seen.isoformat() if l.last_seen else None,
            "total_events": l.total_events,
            "total_plays": l.total_plays,
            "unique_media_count": unique_media.get(l.id, 0),
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items,
    }

@router.get("/analytics/listeners/{listener_id}", dependencies=[Depends(require_admin)])
async def get_listener_detail(listener_id: str, db: Session = Depends(get_db)):
    listener = db.query(Listener).filter(Listener.id == listener_id).first()
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")

    media_rows = db.query(
        Analytics.media_id,
        func.sum(case((Analytics.event_type == "play", 1), else_=0)).label("plays"),
        func.sum(case((Analytics.event_type == "complete", 1), else_=0)).label("completes"),
        func.max(Analytics.timestamp).label("last_played"),
    ).filter(
        Analytics.listener_id == listener_id
    ).group_by(Analytics.media_id).order_by(desc("last_played")).all()

    media_ids = [row.media_id for row in media_rows]
    media_by_id = {}
    if media_ids:
        media_by_id = {
            m.id: m for m in db.query(Media).filter(Media.id.in_(media_ids)).all()
        }

    recent_events = db.query(Analytics).filter(
        Analytics.listener_id == listener_id
    ).order_by(desc(Analytics.timestamp)).limit(100).all()

    city, region, country = get_location(listener.ip_address)

    return {
        "listener_id": listener.id,
        "ip_address": listener.ip_address,
        "hostname": get_hostname(listener.ip_address) if listener.ip_address else None,
        "city": city,
        "region": region,
        "country": country,
        "device": listener.device,
        "browser": listener.browser,
        "os": listener.os,
        "user_agent": listener.user_agent,
        "first_seen": listener.first_seen.isoformat() if listener.first_seen else None,
        "last_seen": listener.last_seen.isoformat() if listener.last_seen else None,
        "total_events": listener.total_events,
        "total_plays": listener.total_plays,
        "media": [
            {
                "media_id": row.media_id,
                "filename": media_by_id[row.media_id].original_filename if row.media_id in media_by_id else "(deleted)",
                "media_type": media_by_id[row.media_id].media_type.value if row.media_id in media_by_id else None,
                "plays": int(row.plays or 0),
                "completes": int(row.completes or 0),
                "last_played": row.last_played.isoformat() if row.last_played else None,
            }
            for row in media_rows
        ],
        "recent_events": [
            {
                "event_type": e.event_type,
                "media_id": e.media_id,
                "filename": media_by_id[e.media_id].original_filename if e.media_id in media_by_id else "(deleted)",
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "session_id": e.session_id,
            }
            for e in recent_events
        ],
    }
