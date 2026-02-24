export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-3 w-3 bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-3 w-3 bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-16">
        {/* Left: Info skeleton */}
        <div className="order-2 lg:order-1 lg:py-4 space-y-6 animate-pulse">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-7 w-24 bg-muted rounded" />
          <div className="h-px bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
          <div className="space-y-3 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="h-px bg-muted" />
          <div className="h-13 w-full bg-muted rounded-xl" />
        </div>

        {/* Right: Gallery skeleton */}
        <div className="order-1 lg:order-2 animate-pulse">
          <div className="aspect-[3/4] bg-muted rounded-2xl mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[72px] h-[90px] bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
