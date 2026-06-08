// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skeleton Nav */}
      <div className="bg-white border-b border-gray-200 h-16 animate-pulse" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12 mb-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>

        {/* Price cards skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="h-4 bg-gray-200 rounded w-12 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-20 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
