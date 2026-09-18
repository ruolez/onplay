"""Record analytics events from any route without importing the analytics
router (api/analytics.py imports from api/media.py, so media.py can't import
it back)."""

from typing import Optional

from fastapi import Request
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from .client_info import get_client_ip, parse_user_agent
from .models import Analytics, Listener


def record_event(
    db: Session,
    *,
    media_id: str,
    event_type: str,
    request: Request,
    listener_id: Optional[str] = None,
    session_id: Optional[str] = None,
    data: Optional[dict] = None,
) -> Analytics:
    """Insert an Analytics row and upsert the listener summary. The caller
    commits."""
    listener_id = (listener_id or "").strip()[:64] or None
    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent")
    device, browser, os_name = parse_user_agent(user_agent)

    event = Analytics(
        media_id=media_id,
        event_type=event_type,
        device=device,
        browser=browser,
        os=os_name,
        ip_address=ip,
        session_id=session_id,
        listener_id=listener_id,
        data=data,
    )
    db.add(event)

    if listener_id:
        play_inc = 1 if event_type == "play" else 0
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

    return event
