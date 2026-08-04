"""City-level IP geolocation backed by the free DB-IP City Lite database.

The .mmdb file (MaxMind format, no account or license key required) is
downloaded once into GEOIP_DB_PATH at startup and kept until the next
container rebuild. Lookups are local and take microseconds. When the
database is absent (download still running or failed) lookups return
(None, None) and the UI falls back to showing the bare IP.
"""

import gzip
import logging
import os
import shutil
import threading
from datetime import date
from functools import lru_cache
from ipaddress import ip_address
from typing import Optional, Tuple
from urllib.request import Request, urlopen

import maxminddb

logger = logging.getLogger(__name__)

GEOIP_DB_PATH = os.environ.get("GEOIP_DB_PATH", "/geoip/dbip-city-lite.mmdb")

# DB-IP publishes one file per month; recent months stay available.
_DOWNLOAD_URL = "https://download.db-ip.com/free/dbip-city-lite-{year}-{month:02d}.mmdb.gz"

_reader: Optional[maxminddb.Reader] = None
_reader_lock = threading.Lock()


def _month_candidates(count: int = 3):
    """Current month first, then previous ones (the new file appears a few
    days into each month)."""
    year, month = date.today().year, date.today().month
    for _ in range(count):
        yield year, month
        month -= 1
        if month == 0:
            year, month = year - 1, 12


def _download_db() -> None:
    target_dir = os.path.dirname(GEOIP_DB_PATH)
    os.makedirs(target_dir, exist_ok=True)

    # First uvicorn worker to create the lock file downloads; the others
    # skip and start serving lookups once the file shows up.
    lock_path = GEOIP_DB_PATH + ".lock"
    try:
        fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
    except FileExistsError:
        return

    tmp_path = GEOIP_DB_PATH + ".tmp"
    try:
        for year, month in _month_candidates():
            url = _DOWNLOAD_URL.format(year=year, month=month)
            try:
                logger.info("GeoIP: downloading %s", url)
                req = Request(url, headers={"User-Agent": "onplay-geoip/1.0"})
                with urlopen(req, timeout=120) as resp, open(tmp_path, "wb") as out:
                    with gzip.open(resp) as gz:
                        shutil.copyfileobj(gz, out)
                os.replace(tmp_path, GEOIP_DB_PATH)
                logger.info("GeoIP: database ready at %s", GEOIP_DB_PATH)
                return
            except Exception as exc:  # noqa: BLE001 - try older months on any failure
                logger.warning("GeoIP: download failed for %s: %s", url, exc)
        logger.error("GeoIP: no database could be downloaded; locations disabled")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if os.path.exists(lock_path):
            os.remove(lock_path)


def ensure_db() -> None:
    """Kick off the database download in the background if it's missing.

    Never blocks startup; safe to call from every worker process.
    """
    if os.path.exists(GEOIP_DB_PATH):
        return
    threading.Thread(target=_download_db, daemon=True).start()


def _get_reader() -> Optional[maxminddb.Reader]:
    global _reader
    if _reader is None and os.path.exists(GEOIP_DB_PATH):
        with _reader_lock:
            if _reader is None:
                try:
                    _reader = maxminddb.open_database(GEOIP_DB_PATH)
                except Exception as exc:  # noqa: BLE001 - corrupt/partial file
                    logger.error("GeoIP: cannot open %s: %s", GEOIP_DB_PATH, exc)
    return _reader


@lru_cache(maxsize=4096)
def _lookup(ip: str) -> Tuple[Optional[str], Optional[str]]:
    reader = _reader
    if reader is None:
        return None, None
    try:
        record = reader.get(ip) or {}
    except (ValueError, maxminddb.InvalidDatabaseError):
        return None, None
    city = (record.get("city") or {}).get("names", {}).get("en")
    country = (record.get("country") or {}).get("iso_code")
    return city, country


def get_location(ip: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """(city, country_iso_code) for a public IP; (None, None) when unknown."""
    if not ip:
        return None, None
    try:
        if not ip_address(ip).is_global:
            return None, None
    except ValueError:
        return None, None
    if _get_reader() is None:
        # Don't poison the cache while the database is still downloading.
        return None, None
    return _lookup(ip)
