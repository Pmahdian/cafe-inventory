export function Skeleton({
  className = '',
}: {
  className?: string;
}) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-200/60 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-stone-200/60 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 flex-1 max-w-[200px]" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}