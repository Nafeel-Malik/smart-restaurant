/** Pulsing skeleton placeholders matching card layouts. */
export function SkeletonBlock({ className = '' }) {
  return <div className={`motion-skeleton ${className}`} aria-hidden />
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface overflow-hidden ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      <SkeletonBlock className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-outline-variant bg-surface p-5 flex gap-4"
        >
          <SkeletonBlock className="h-14 w-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 6, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
