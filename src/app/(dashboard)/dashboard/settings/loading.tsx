export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="space-y-4 max-w-xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-9 w-full bg-muted rounded" />
          </div>
        ))}
        <div className="h-9 w-32 bg-muted rounded mt-4" />
      </div>
    </div>
  );
}
