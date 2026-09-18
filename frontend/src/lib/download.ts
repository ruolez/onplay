import { API_URL, type Media } from "./api";
import { getListenerId } from "./listenerId";

type Downloadable = Pick<Media, "id" | "filename" | "download">;

export function downloadUrl(mediaId: string): string {
  return `${API_URL}/media/${mediaId}/download?listener_id=${encodeURIComponent(getListenerId())}`;
}

export function downloadFilename(media: Downloadable): string {
  const stem = media.filename.replace(/\.[^/.]+$/, "") || media.id;
  return `${stem}.${media.download?.format ?? "bin"}`;
}

export function downloadLabel(media: Downloadable): string {
  return media.download
    ? `Download ${media.download.format.toUpperCase()}`
    : "Preparing download…";
}
