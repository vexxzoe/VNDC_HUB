export function PageSkeleton() {
  return (
    <div className="px-6 py-8 flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-surface-700 rounded-xl w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-surface-700 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-surface-700 rounded-2xl" />
    </div>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-200 dark:bg-surface-700 rounded-xl" />
      ))}
    </div>
  )
}
