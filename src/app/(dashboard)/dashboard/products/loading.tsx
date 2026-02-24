export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded mt-1" />
        </div>
        <div className="h-9 w-32 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-muted rounded" />
        <div className="h-9 w-24 bg-muted rounded" />
      </div>
      <div className="bg-white border border-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border-b border-border last:border-0 flex gap-4">
            <div className="w-12 h-12 bg-muted rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
