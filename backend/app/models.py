from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, Enum as SQLEnum, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class MediaType(str, enum.Enum):
    VIDEO = "video"
    AUDIO = "audio"

class MediaStatus(str, enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

# Association table for many-to-many relationship between Media and Tag
media_tags = Table(
    'media_tags',
    Base.metadata,
    Column('media_id', String, ForeignKey('media.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

class Media(Base):
    __tablename__ = "media"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    media_type = Column(SQLEnum(MediaType), nullable=False)
    status = Column(SQLEnum(MediaStatus), default=MediaStatus.UPLOADING)
    file_size = Column(Integer)
    duration = Column(Float)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    codec = Column(String, nullable=True)
    bitrate = Column(Integer, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    variants = relationship("MediaVariant", back_populates="media", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="media", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=media_tags, back_populates="media")

class MediaVariant(Base):
    __tablename__ = "media_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    media_id = Column(String, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    quality = Column(String, nullable=False)  # e.g., "1080p", "720p", "128kbps"
    path = Column(String, nullable=False)
    bitrate = Column(Integer)
    file_size = Column(Integer)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    media = relationship("Media", back_populates="variants")

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    media_id = Column(String, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # play, pause, complete, seek
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    data = Column(JSON, nullable=True)  # Additional event data

    media = relationship("Media", back_populates="analytics")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    media = relationship("Media", secondary=media_tags, back_populates="tags")

class BandwidthLog(Base):
    __tablename__ = "bandwidth_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    media_id = Column(String, ForeignKey("media.id", ondelete="CASCADE"), nullable=True)
    ip_address = Column(String, nullable=False, index=True)
    bytes_sent = Column(Integer, nullable=False)
    request_uri = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    request_time = Column(Float, nullable=True)  # Response time in seconds
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    processed = Column(DateTime(timezone=True), server_default=func.now())

    # Aggregated bandwidth tracking
class BandwidthStats(Base):
    __tablename__ = "bandwidth_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    media_id = Column(String, ForeignKey("media.id", ondelete="CASCADE"), nullable=True, index=True)
    ip_address = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=True, index=True)  # Track sessions
    date = Column(DateTime(timezone=True), nullable=False, index=True)  # Hourly aggregation
    total_bytes = Column(Integer, nullable=False, default=0)
    request_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
