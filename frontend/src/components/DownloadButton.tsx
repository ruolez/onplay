import type { CSSProperties, MouseEvent } from "react";
import { Download, Loader2 } from "lucide-react";
import type { Media } from "../lib/api";
import { downloadFilename, downloadLabel, downloadUrl } from "../lib/download";
import { formatFileSize } from "../lib/utils";
import { useHaptics } from "../hooks/useHaptics";

type DownloadableMedia = Pick<
  Media,
  "id" | "filename" | "media_type" | "download" | "download_status"
>;

type Props = {
  media: DownloadableMedia;
  /** icon: bare icon button; primary: labelled CTA with size; menu: dropdown row */
  variant?: "icon" | "primary" | "menu";
  className?: string;
  style?: CSSProperties;
  iconClassName?: string;
  /** Render nothing while the file is not ready (cards) */
  hideWhenUnavailable?: boolean;
  haptic?: boolean;
  onDownloaded?: () => void;
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
};

const VARIANT_CLASSES: Record<NonNullable<Props["variant"]>, string> = {
  icon: "p-2.5 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0",
  primary:
    "theme-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors min-h-[40px]",
  menu: "theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left",
};

const VARIANT_ICON: Record<NonNullable<Props["variant"]>, string> = {
  icon: "w-4 h-4 theme-text-muted",
  primary: "w-4 h-4",
  menu: "w-4 h-4",
};

/**
 * Download link for a media item. A real anchor with the download attribute:
 * the server answers with Content-Disposition: attachment, so the page (and
 * the persistent player) keeps running while the browser saves the file.
 */
export default function DownloadButton({
  media,
  variant = "icon",
  className,
  style,
  iconClassName,
  hideWhenUnavailable = false,
  haptic = false,
  onDownloaded,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const haptics = useHaptics();
  const available = Boolean(media.download);
  const classes = className ?? VARIANT_CLASSES[variant];
  const iconClasses = iconClassName ?? VARIANT_ICON[variant];
  const label = downloadLabel(media);

  if (!available) {
    if (hideWhenUnavailable) return null;
    const failed = media.download_status === "failed";
    const title = failed ? "Download unavailable" : "Preparing download…";
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`${classes} opacity-50 cursor-not-allowed`}
        style={style}
        title={title}
        aria-label={`${title} for ${media.filename}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {failed ? (
          <Download className={iconClasses} />
        ) : (
          <Loader2 className={`${iconClasses} animate-spin`} />
        )}
        {variant !== "icon" && (
          <span>{failed ? "Download unavailable" : "Preparing download…"}</span>
        )}
      </button>
    );
  }

  const format = media.download!.format.toUpperCase();
  const size = media.download!.size;

  return (
    <a
      href={downloadUrl(media.id)}
      download={downloadFilename(media)}
      rel="nofollow"
      className={classes}
      style={style}
      title={size != null ? `${label} (${formatFileSize(size)})` : label}
      aria-label={`Download ${media.filename} as ${format}`}
      onClick={(e) => {
        // Cards are role="button": a download must not also start playback
        e.stopPropagation();
        if (haptic) haptics.buttonPress();
        onDownloaded?.();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Download className={iconClasses} />
      {variant === "primary" && (
        <>
          <span>{label}</span>
          {size != null && (
            <span className="opacity-75 font-normal">
              {formatFileSize(size)}
            </span>
          )}
        </>
      )}
      {variant === "menu" && <span>Download {format}</span>}
    </a>
  );
}
