from typing import Optional, Tuple

from fastapi import Request


def get_client_ip(request: Request) -> Optional[str]:
    """Real client IP behind nginx. The prod edge (host nginx) sets
    X-Forwarded-For fresh from $remote_addr — clients can't spoof it — and
    the Docker nginx recovers it via the realip module before appending its
    own hop, so the leftmost entry is always the browser. Dev (single nginx)
    appends via $proxy_add_x_forwarded_for; leftmost is the browser there too."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    return request.client.host if request.client else None


def parse_user_agent(ua: Optional[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Cheap substring-based UA parse -> (device, browser, os)."""
    if not ua:
        return None, None, None

    if "iPad" in ua or "Tablet" in ua:
        device = "tablet"
    elif "Mobi" in ua or "iPhone" in ua or ("Android" in ua and "Mobile" in ua):
        device = "mobile"
    else:
        device = "desktop"

    if "Edg" in ua:
        browser = "Edge"
    elif "OPR" in ua or "Opera" in ua:
        browser = "Opera"
    elif "Chrome" in ua or "CriOS" in ua:
        browser = "Chrome"
    elif "Firefox" in ua or "FxiOS" in ua:
        browser = "Firefox"
    elif "Safari" in ua:
        browser = "Safari"
    else:
        browser = None

    if "iPad" in ua:
        os_name = "iPadOS"
    elif "iPhone" in ua or "iOS" in ua:
        os_name = "iOS"
    elif "Android" in ua:
        os_name = "Android"
    elif "Windows NT" in ua:
        os_name = "Windows"
    elif "Mac OS X" in ua or "Macintosh" in ua:
        os_name = "macOS"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = None

    return device, browser, os_name
