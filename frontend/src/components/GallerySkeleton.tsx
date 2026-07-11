// Wireframe placeholders matching the Gallery card layout — reserves
// space to avoid layout shift and reads as a faster load than a spinner
export default function GallerySkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="space-y-1" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="theme-card rounded-lg p-2.5 sm:p-2 flex items-center gap-2 animate-pulse"
          >
            <div className="w-6 h-4 skeleton-block flex-shrink-0" />
            <div className="w-[18px] h-[18px] skeleton-block rounded-full flex-shrink-0" />
            <div className="flex-1 h-4 skeleton-block" />
            <div className="w-12 h-3 skeleton-block flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4 md:gap-5"
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="theme-card rounded-lg sm:rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-video skeleton-block !rounded-none" />
          <div className="p-2 xs:p-3 sm:p-4 space-y-2">
            <div className="h-4 w-3/4 skeleton-block" />
            <div className="h-3 w-1/2 skeleton-block" />
          </div>
        </div>
      ))}
    </div>
  );
}
