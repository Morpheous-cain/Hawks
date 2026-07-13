import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'stats' | 'page';
  count?: number;
  className?: string;
}

export const LoadingSkeleton = ({ variant = 'card', count = 1, className }: LoadingSkeletonProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="bg-muted/50 p-4 border-b">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border-b last:border-b-0">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        );

      case 'page':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-2/3" />
                </div>
              ))}
            </div>
            {/* Content */}
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        );

      default:
        return <Skeleton className="h-20 w-full" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
