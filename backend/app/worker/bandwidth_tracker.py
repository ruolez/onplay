"""
Bandwidth tracking service that parses nginx access logs
and stores actual bandwidth usage in the database.
"""

import re
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func, tuple_
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

        # Only track HLS segment requests (.ts files)
        if not data['uri'].endswith('.ts'):
            return None

        # Parse timestamp
        timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))

        # Extract media ID from URI
        media_id = extract_media_id(data['uri'])

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

    Reads from `last_position` to end of file, parses HLS segment entries,
    and writes them in bulk. Aggregates per-(media_id, ip, hour) stats in
    memory to minimize DB round-trips.

    Returns the new file position for incremental processing on the next run.
    Detects log rotation (file shrunk below last_position) and restarts from 0.
    """
    log_path = Path(log_file_path)

    if not log_path.exists():
        logger.warning(f"Bandwidth log file not found: {log_file_path}")
        return 0

    # Detect log rotation: if the file is smaller than where we left off,
    # logrotate (or anything else) truncated/replaced it. Start over from 0.
    try:
        file_size = log_path.stat().st_size
    except OSError as e:
        logger.error(f"Could not stat bandwidth log: {e}")
        return last_position

    if last_position > file_size:
        logger.info(
            f"Bandwidth log appears rotated (size {file_size} < last_position "
            f"{last_position}); resetting to 0"
        )
        last_position = 0

    # Read from last position (incremental processing)
    with open(log_path, 'r') as f:
        f.seek(last_position)
        lines = f.readlines()
        new_position = f.tell()

    if not lines:
        return last_position

    # Parse all lines up front
    parsed_entries = []
    for line in lines:
        parsed = parse_log_line(line)
        if parsed:
            parsed_entries.append(parsed)

    if not parsed_entries:
        return new_position

    # Aggregate stats in memory per (media_id, ip, hour) bucket
    # so we only need one SELECT + one bulk INSERT/UPDATE for stats.
    bucket_totals: dict = {}
    for entry in parsed_entries:
        hour_bucket = entry['timestamp'].replace(minute=0, second=0, microsecond=0)
        key = (entry['media_id'], entry['ip_address'], hour_bucket)
        if key in bucket_totals:
            bucket_totals[key][0] += entry['bytes_sent']
            bucket_totals[key][1] += 1
        else:
            bucket_totals[key] = [entry['bytes_sent'], 1]

    db = SessionLocal()
    try:
        # Bulk insert raw bandwidth logs in a single round-trip.
        db.bulk_insert_mappings(BandwidthLog, parsed_entries)

        # Look up existing stats rows for all touched buckets in one query.
        bucket_keys = list(bucket_totals.keys())
        existing_rows = db.query(BandwidthStats).filter(
            tuple_(
                BandwidthStats.media_id,
                BandwidthStats.ip_address,
                BandwidthStats.date,
            ).in_(bucket_keys)
        ).all()

        existing_index = {
            (row.media_id, row.ip_address, row.date): row
            for row in existing_rows
        }

        new_rows = []
        for key, (bytes_sent, request_count) in bucket_totals.items():
            row = existing_index.get(key)
            if row is not None:
                row.total_bytes = (row.total_bytes or 0) + bytes_sent
                row.request_count = (row.request_count or 0) + request_count
            else:
                media_id, ip_address, hour_bucket = key
                new_rows.append({
                    'media_id': media_id,
                    'ip_address': ip_address,
                    'date': hour_bucket,
                    'total_bytes': bytes_sent,
                    'request_count': request_count,
                })

        if new_rows:
            db.bulk_insert_mappings(BandwidthStats, new_rows)

        db.commit()
        logger.info(
            f"Processed {len(parsed_entries)} bandwidth entries "
            f"({len(bucket_keys)} buckets, {len(new_rows)} new)"
        )

        return new_position

    except Exception as e:
        logger.error(f"Error processing bandwidth logs: {e}")
        db.rollback()
        return last_position
    finally:
        db.close()


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
