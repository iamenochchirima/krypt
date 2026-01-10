import { Skeleton } from "@/components/ui/skeleton"

export default function PlayLoading() {
  return (
    <div className="container mx-auto px-4 py-24">
      {/* Hero Section Skeleton */}
      <div className="relative mb-16 overflow-hidden rounded-2xl">
        <Skeleton className="h-[400px] w-full" />
      </div>

      {/* Featured Games Skeleton */}
      <section className="mb-16">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border">
                <Skeleton className="aspect-video w-full" />
                <div className="p-6">
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="mb-4 h-4 w-full" />
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="mb-4 h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="mb-16">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
        </div>
      </section>

      {/* Tournaments Skeleton */}
      <section>
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="rounded-xl border p-6">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
