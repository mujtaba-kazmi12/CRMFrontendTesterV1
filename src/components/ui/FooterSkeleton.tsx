export function FooterSkeleton() {
  const SkeletonText = ({ className = '' }: { className?: string }) => (
    <div className={`bg-zinc-700 animate-pulse rounded ${className}`}></div>
  );

  return (
    <footer className="bg-zinc-800 border-t border-zinc-700 mt-16 min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[80px]">
          <SkeletonText className="h-10 w-64" />
          <div className="flex flex-wrap gap-3 sm:gap-6 md:gap-8 min-h-[60px] items-start">
            <SkeletonText className="h-6 w-16" />
            <SkeletonText className="h-6 w-20" />
            <SkeletonText className="h-6 w-32" />
          </div>
        </div>
      </div>
      <div className="border-b border-white w-full mt-2 mb-8"></div>
      <div className="max-w-7xl mx-auto px-4 pb-8 min-h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-2 min-h-[280px]">
          <div className="lg:col-span-2">
            <SkeletonText className="h-7 w-40 mb-2" />
            <div className="space-y-2">
              <SkeletonText className="h-4 w-full" />
              <SkeletonText className="h-4 w-full" />
              <SkeletonText className="h-4 w-3/4" />
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <SkeletonText className="h-7 w-32 mb-2" />
              <SkeletonText className="h-10 w-full mb-3" />
              <SkeletonText className="h-10 w-full" />
            </div>
            <div className="flex-1">
              <SkeletonText className="h-7 w-32 mb-2" />
              <div className="space-y-4">
                <SkeletonText className="h-5 w-full" />
                <SkeletonText className="h-5 w-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-700 pt-8">
          <SkeletonText className="h-7 w-40 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 min-h-[120px]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonText className="h-6 w-24" />
                <SkeletonText className="h-4 w-20" />
                <SkeletonText className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-700 py-4 bg-zinc-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-500">
          <SkeletonText className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    </footer>
  );
} 