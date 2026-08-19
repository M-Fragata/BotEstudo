interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface-container-high ${className}`} />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
  return <Skeleton className={`rounded-full ${className}`} />
}