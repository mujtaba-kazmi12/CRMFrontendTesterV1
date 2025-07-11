import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-900">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-2 md:px-0">
          {/* Header */}
          <header className="mb-4 border-b pb-4 w-full">
            <div className="text-center mb-4">
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
            </div>
            
            <div className="flex items-center justify-center relative">
              <Skeleton className="h-4 w-64" />
              <div className="absolute right-0">
                <Skeleton className="h-8 w-64" />
              </div>
            </div>
          </header>

          {/* Category Navbar */}
          <nav className="mb-8">
            <div className="flex justify-center">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-18" />
                <Skeleton className="h-8 w-22" />
              </div>
            </div>
          </nav>
          
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Main article skeleton */}
              <div className="flex flex-col border-b pb-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-80 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>

              {/* Secondary articles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col border-b pb-4">
                    <Skeleton className="h-40 w-full mb-2" />
                    <Skeleton className="h-6 w-full mb-1" />
                    <div className="flex gap-2 mb-1">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="border-b pb-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <ul className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="w-20 h-20 flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ad placeholder */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 border rounded-lg py-6">
                <Skeleton className="h-4 w-16 mx-auto mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
} 