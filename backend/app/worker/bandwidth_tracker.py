"""
Bandwidth tracking service that parses nginx access logs
and stores actual bandwidth usage in the database.
"""

import re
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import BandwidthLog, BandwidthStats, Media
from ..database import SessionLocal
import logging

logger = logging.getLogger(__name__)

# Nginx log format: $remote_addr|$time_iso8601|$request_uri|$body_bytes_sent|$status|$request_time
LOG_PATTERN = re.compile(
    r'(?P<ip>[^\|]+)\|'
    r'(?P<timestamp>[^\|]+)\|'
    r'(?P<uri>[^\|]+)\|'
    r'(?P<bytes>\d+)\|'
    r'(?P<status>\d+)\|'
    r'(?P<request_time>[^\|]+)'
)

# Extract media ID from URI: /media/hls/{media_id}/...
MEDIA_ID_PATTERN = re.compile(r'/media/hls/([^/]+)/')


def extract_media_id(uri: str) -> Optional[str]:
    """Extract media ID from request URI"""
    match = MEDIA_ID_PATTERN.search(uri)
    return match.group(1) if match else None


def parse_log_line(line: str) -> Optional[dict]:
    """Parse a single nginx bandwidth log line"""
    match = LOG_PATTERN.match(line.strip())
    if not match:
        return None

    try:
        data = match.groupdict()

        # Parse timestamp
        timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))

        # Extract media ID from URI
        media_id = extract_media_id(data['uri'])

        # Only track HLS segment requests (.ts files)
        if not data['uri'].endswith('.ts'):
            return None

        return {
            'ip_address': data['ip'],
            'timestamp': timestamp,
            'request_uri': data['uri'],
            'bytes_sent': int(data['bytes']),
            'status_code': int(data['status']),
            'request_time': float(data['request_time']) if data['request_time'] else None,
            'media_id': media_id
        }
    except (ValueError, KeyError) as e:
        logger.error(f"Error parsing log line: {e}")
        return None


def process_bandwidth_logs(
    log_file_path: str = "/var/log/nginx/bandwidth.log",
    last_position: int = 0
) -> int:
    """
    Process nginx bandwidth logs and store in database.

    Returns the new file position for incremental processing.
    """
    db = SessionLocal()

    try:
        log_path = Path(log_file_path)

        if not log_path.exists():
            logger.warning(f"Bandwidth log file not found: {log_file_path}")
            return 0

        # Read from last position (incremental processing)
        with open(log_path, 'r') as f:
            f.seek(last_position)
            lines = f.readlines()
            new_position = f.tell()

        if not lines:
            return last_position

        # Parse and store logs
        processed_count = 0
        for line in lines:
            parsed = parse_log_line(line)
            if not parsed:
                continue

            # Store raw bandwidth log
            bandwidth_log = BandwidthLog(**parsed)
            db.add(bandwidth_log)

            # Update aggregated stats (hourly)
            update_bandwidth_stats(
                db,
                media_id=parsed['media_id'],
                ip_address=parsed['ip_address'],
                timestamp=parsed['timestamp'],
                bytes_sent=parsed['bytes_sent']
            )

            processed_count += 1

        if processed_count > 0:
            db.commit()
            logger.info(f"Processed {processed_count} bandwidth log entries")

        return new_position

    except Exception as e:
        logger.error(f"Error processing bandwidth logs: {e}")
        db.rollback()
        return last_position
    finally:
        db.close()


def update_bandwidth_stats(
    db: Session,
    media_id: Optional[str],
    ip_address: str,
    timestamp: datetime,
    bytes_sent: int
):
    """Update or create aggregated bandwidth stats (hourly buckets)"""

    # Truncate to hour
    hour_bucket = timestamp.replace(minute=0, second=0, microsecond=0)

    # Find or create stats record
    stats = db.query(BandwidthStats).filter(
        BandwidthStats.media_id == media_id,
        BandwidthStats.ip_address == ip_address,
        BandwidthStats.date == hour_bucket
    ).first()

    if stats:
        stats.total_bytes += bytes_sent
        stats.request_count += 1
    else:
        stats = BandwidthStats(
            media_id=media_id,
            ip_address=ip_address,
            date=hour_bucket,
            total_bytes=bytes_sent,
            request_count=1
        )
        db.add(stats)


def get_bandwidth_summary(
    db: Session,
    days: int = 7
) -> dict:
    """Get bandwidth summary from actual logs"""

    since = datetime.utcnow() - timedelta(days=days)

    # Total bandwidth from stats
    total_bandwidth = db.query(
        func.sum(BandwidthStats.total_bytes)
    ).filter(
        BandwidthStats.date >= since
    ).scalar() or 0

    # Bandwidth by IP
    bandwidth_by_ip = db.query(
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

    # Bandwidth by media
    bandwidth_by_media = db.query(
        BandwidthStats.media_id,
        func.sum(BandwidthStats.total_bytes).label('total_bytes'),
        func.sum(BandwidthStats.request_count).label('request_count')
    ).filter(
        BandwidthStats.date >= since,
        BandwidthStats.media_id.isnot(None)
    ).group_by(
        BandwidthStats.media_id
    ).order_by(
        func.sum(BandwidthStats.total_bytes).desc()
    ).limit(10).all()

    return {
        'total_bandwidth_bytes': int(total_bandwidth),
        'bandwidth_by_ip': [
            {
                'ip': ip,
                'bandwidth_bytes': int(total_bytes),
                'request_count': int(request_count)
            }
            for ip, total_bytes, request_count in bandwidth_by_ip
        ],
        'bandwidth_by_media': [
            {
                'media_id': media_id,
                'bandwidth_bytes': int(total_bytes),
                'request_count': int(request_count)
            }
            for media_id, total_bytes, request_count in bandwidth_by_media
        ]
    }


def cleanup_old_logs(db: Session, days: int = 90):
    """Clean up old bandwidth logs (keep aggregated stats)"""

    cutoff = datetime.utcnow() - timedelta(days=days)

    deleted = db.query(BandwidthLog).filter(
        BandwidthLog.timestamp < cutoff
    ).delete()

    db.commit()
    logger.info(f"Cleaned up {deleted} old bandwidth log entries")
