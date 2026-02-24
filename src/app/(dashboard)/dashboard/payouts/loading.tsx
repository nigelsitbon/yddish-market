export default function PayoutsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded" />
        ))}
      </div>
      <div className="bg-white border border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-border last:border-0">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
