from sqlalchemy import text

# Idempotent DDL applied at startup. create_all only creates new tables, so
# changes to existing tables must be listed here.
STATEMENTS = [
    "ALTER TABLE analytics ADD COLUMN IF NOT EXISTS listener_id VARCHAR",
    "CREATE INDEX IF NOT EXISTS ix_analytics_listener_id ON analytics (listener_id)",
    "CREATE INDEX IF NOT EXISTS ix_analytics_media_id ON analytics (media_id)",
    "CREATE INDEX IF NOT EXISTS ix_analytics_event_ts ON analytics (event_type, timestamp)",
]

LOCK_KEY = 872634917  # advisory lock: prod runs 4 workers that race on DDL


def run_startup_migrations(engine):
    with engine.connect() as conn:
        conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": LOCK_KEY})
        try:
            for stmt in STATEMENTS:
                conn.execute(text(stmt))
            conn.commit()
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
