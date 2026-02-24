export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-8">
      {/* Page title */}
      <div className="h-8 w-48 bg-muted rounded-lg animate-pulse mb-6" />

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
