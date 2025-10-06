import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { mediaApi } from "../lib/api";
import {
  Upload as UploadIcon,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "ready" | "failed";
  mediaId?: string;
  error?: string;
}

export default function Upload() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
      }
    },
    [],
  );

  const handleFiles = async (files: File[]) => {
    const newUploads: UploadItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      try {
        const response = await mediaApi.uploadFile(upload.file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u)),
          );
        });

        const mediaId = response.data.id;

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "processing", mediaId, progress: 100 }
              : u,
          ),
        );

        // Poll for processing status
        pollStatus(upload.id, mediaId);
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "failed", error: error.message }
              : u,
          ),
        );
      }
    }
  };

  const pollStatus = async (uploadId: string, mediaId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await mediaApi.getUploadStatus(mediaId);
        const status = response.data.status;

        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status } : u)),
        );

        if (status === "ready" || status === "failed") {
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader className="w-5 h-5 animate-spin text-yellow-500" />;
      case "ready":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold theme-text-primary mb-6 sm:mb-8">
        Upload Media
      </h1>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 lg:p-12 text-center transition-all ${
          dragActive ? "theme-card-border-hover" : ""
        }`}
        style={{
          borderColor: dragActive
            ? "var(--card-border-hover)"
            : "var(--card-border)",
          background: dragActive ? "var(--card-bg-hover)" : "var(--card-bg)",
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon className="w-12 h-12 sm:w-16 sm:h-16 theme-text-muted mx-auto mb-3 sm:mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold theme-text-primary mb-2">
          Drop your media files here
        </h3>
        <p className="theme-text-muted mb-4 sm:mb-6 text-sm sm:text-base">
          or click to browse (MP4, AVI, MOV, MP3, WAV)
        </p>

        <input
          type="file"
          multiple
          accept="video/*,audio/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <button className="px-6 py-3 theme-btn-primary rounded-lg font-medium min-h-[48px] text-sm sm:text-base">
          Select Files
        </button>
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold theme-text-primary">Uploads</h2>

          {uploads.map((upload) => (
            <div key={upload.id} className="theme-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(upload.status)}
                  <div>
                    <p className="theme-text-primary font-medium">
                      {upload.file.name}
                    </p>
                    <p className="theme-text-muted text-sm capitalize">
                      {upload.status}
                    </p>
                  </div>
                </div>

                {upload.status === "ready" && upload.mediaId && (
                  <button
                    onClick={() => navigate(`/player/${upload.mediaId}`)}
                    className="px-4 py-2 theme-btn-primary rounded-lg text-sm"
                  >
                    View
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {(upload.status === "uploading" ||
                upload.status === "processing") && (
                <div
                  className="w-full rounded-full h-2"
                  style={{ background: "var(--input-bg)" }}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${
                      upload.status === "processing" ? "animate-pulse" : ""
                    }`}
                    style={{
                      background:
                        upload.status === "uploading"
                          ? "var(--status-info)"
                          : "var(--status-warning)",
                      width:
                        upload.status === "uploading"
                          ? `${upload.progress}%`
                          : "100%",
                    }}
                  />
                </div>
              )}

              {upload.error && (
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--status-error)" }}
                >
                  {upload.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
