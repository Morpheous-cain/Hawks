import { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from './LoadingSkeleton';
import { cn } from '@/lib/utils';

interface DataFetchWrapperProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  children: ReactNode;
  loadingVariant?: 'card' | 'table' | 'list' | 'stats' | 'page';
  loadingCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const DataFetchWrapper = ({
  isLoading,
  isError,
  error,
  isEmpty = false,
  children,
  loadingVariant = 'card',
  loadingCount = 1,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display at this time.',
  emptyIcon,
  onRetry,
  className,
}: DataFetchWrapperProps) => {
  if (isLoading) {
    return (
      <div className={cn("animate-in fade-in duration-300", className)}>
        <LoadingSkeleton variant={loadingVariant} count={loadingCount} />
      </div>
    );
  }

  if (isError) {
    const isNetworkError = error?.message?.includes('fetch') || 
                          error?.message?.includes('network') ||
                          error?.message?.includes('Failed to fetch');

    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg border bg-card text-center",
        className
      )}>
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          {isNetworkError ? (
            <WifiOff className="h-6 w-6 text-destructive" />
          ) : (
            <AlertCircle className="h-6 w-6 text-destructive" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isNetworkError ? 'Connection Error' : 'Failed to load data'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg border bg-card/50 text-center",
        className
      )}>
        <div className="rounded-full bg-muted p-3 mb-4">
          {emptyIcon || <Wifi className="h-6 w-6 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Inline loading indicator for updating states
export const InlineLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span>Updating...</span>
  </div>
);

// Connection status indicator
export const ConnectionStatus = ({ 
  isConnected, 
  className 
}: { 
  isConnected: boolean; 
  className?: string;
}) => (
  <div className={cn("flex items-center gap-1.5 text-xs", className)}>
    <div className={cn(
      "h-2 w-2 rounded-full",
      isConnected ? "bg-primary animate-pulse" : "bg-destructive"
    )} />
    <span className={isConnected ? "text-primary" : "text-destructive"}>
      {isConnected ? 'Live' : 'Disconnected'}
    </span>
  </div>
);

export default DataFetchWrapper;
