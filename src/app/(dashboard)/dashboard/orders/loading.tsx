export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded mt-1" />
      </div>
      <div className="flex gap-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 w-20 bg-muted rounded" />
        ))}
      </div>
      <div className="bg-white border border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 border-b border-border last:border-0">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-muted rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
