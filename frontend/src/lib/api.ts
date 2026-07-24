import axios from "axios";
import { getListenerId } from "./listenerId";

// Use relative URL for production, absolute URL for local dev
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Tag {
  id: number;
  name: string;
  media_count: number;
}

export interface Media {
  id: string;
  filename: string;
  original_filename: string;
  media_type: "video" | "audio";
  status: "uploading" | "processing" | "ready" | "failed";
  file_size?: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail_path?: string;
  created_at: string;
  play_count?: number;
  variants: MediaVariant[];
  tags: Tag[];
}

export interface MediaVariant {
  quality: string;
  path: string;
  bitrate: number;
  file_size: number;
  width?: number;
  height?: number;
}

export interface Analytics {
  media_id: string;
  filename: string;
  total_plays: number;
  total_completes: number;
  completion_rate: number;
}

export const mediaApi = {
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<{ id: string; filename: string; status: string }>(
      "/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(progress);
          }
        },
      },
    );
  },

  async getMedia(skip = 0, limit = 50, mediaType?: string, status?: string) {
    return api.get<{ total: number; items: Media[] }>("/media", {
      params: { skip, limit, media_type: mediaType, status },
    });
  },

  async getMediaById(id: string) {
    return api.get<Media>(`/media/${id}`);
  },

  async deleteMedia(id: string) {
    return api.delete(`/media/${id}`);
  },

  async renameMedia(id: string, filename: string) {
    return api.patch(`/media/${id}`, { filename });
  },

  async setThumbnail(id: string, timestamp: number) {
    return api.post(`/media/${id}/thumbnail`, { timestamp });
  },

  async uploadThumbnail(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/media/${id}/thumbnail/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getUploadStatus(id: string) {
    return api.get(`/upload/status/${id}`);
  },

  async getStatsOverview() {
    return api.get("/media/stats/overview");
  },

  async trackAnalytics(
    mediaId: string,
    eventType: string,
    sessionId?: string,
    data?: any,
  ) {
    return api.post("/analytics/track", {
      media_id: mediaId,
      event_type: eventType,
      session_id: sessionId,
      listener_id: getListenerId(),
      data,
    });
  },

  async getMediaAnalytics(mediaId: string) {
    return api.get<Analytics>(`/analytics/media/${mediaId}`);
  },

  async getAnalyticsOverview(days = 7) {
    return api.get("/analytics/overview", { params: { days } });
  },

  async getAllTags() {
    return api.get<Tag[]>("/tags");
  },

  async addTagToMedia(mediaId: string, tagName: string) {
    return api.post(`/media/${mediaId}/tags`, { name: tagName });
  },

  async removeTagFromMedia(mediaId: string, tagId: number) {
    return api.delete(`/media/${mediaId}/tags/${tagId}`);
  },

  async deleteTag(tagId: number) {
    return api.delete(`/tags/${tagId}`);
  },
};

export const authApi = {
  async login(username: string, password: string) {
    return api.post<{ username: string }>("/auth/login", {
      username,
      password,
    });
  },

  async logout() {
    return api.post("/auth/logout");
  },

  async me() {
    return api.get<{ username: string }>("/auth/me");
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return api.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

export interface ListenerSummary {
  listener_id: string;
  ip_address: string | null;
  hostname: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  first_seen: string | null;
  last_seen: string | null;
  total_events: number;
  total_plays: number;
  unique_media_count: number;
}

export interface ListenerMediaStat {
  media_id: string;
  filename: string;
  media_type: string | null;
  plays: number;
  completes: number;
  last_played: string | null;
}

export interface ListenerEvent {
  event_type: string;
  media_id: string;
  filename: string;
  timestamp: string | null;
  session_id: string | null;
}

export interface ListenerDetail extends Omit<
  ListenerSummary,
  "unique_media_count"
> {
  user_agent: string | null;
  media: ListenerMediaStat[];
  recent_events: ListenerEvent[];
}

export const analyticsApi = {
  async getListeners(skip = 0, limit = 50, days?: number) {
    return api.get<{
      total: number;
      skip: number;
      limit: number;
      items: ListenerSummary[];
    }>("/analytics/listeners", { params: { skip, limit, days } });
  },

  async getListenerDetail(listenerId: string) {
    return api.get<ListenerDetail>(`/analytics/listeners/${listenerId}`);
  },
};
