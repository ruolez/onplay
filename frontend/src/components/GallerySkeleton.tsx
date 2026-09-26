// Wireframe placeholders matching the Gallery card layout — reserves
// space to avoid layout shift and reads as a faster load than a spinner
export default function GallerySkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div
        className="divide-y divide-[color:var(--card-border)]"
        aria-hidden="true"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-1 xs:px-1.5 py-2 animate-pulse"
          >
            <div className="w-12 h-12 skeleton-block rounded-md flex-shrink-0" />
            <div className="flex-1 h-4 skeleton-block" />
            <div className="w-10 h-3 skeleton-block flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-7 md:gap-y-8"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square skeleton-block !rounded-lg sm:!rounded-xl" />
          <div className="mt-2.5 space-y-1.5">
            <div className="h-4 w-4/5 skeleton-block" />
            <div className="h-3 w-1/2 skeleton-block" />
          </div>
        </div>
      ))}
    </div>
  );
}
