import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearChunkReloadGuard, isChunkLoadError, reloadForChunkError } from '@/utils/chunkReload';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mark chunk errors up-front so render() can show the silent "updating" UI
    // instead of flashing the red error card before reload fires.
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (isChunkLoadError(error)) {
      reloadForChunkError();
      return;
    }
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  handleHardReload = () => {
    // Bypass the 30s cooldown — user explicitly asked to recover.
    clearChunkReloadGuard();
    reloadForChunkError();
  };

  render() {
    if (this.state.hasError) {
      // Stale-chunk failure (post-deploy, returning from idle): show a
      // calm "updating" overlay while reloadForChunkError() runs. No red
      // alert flash, no scary message.
      if (this.state.isChunkError) {
        return (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Updating to the latest version…</p>
            <Button onClick={this.handleHardReload} variant="ghost" size="sm" className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload now
            </Button>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg text-destructive">Something went wrong</CardTitle>
            </div>
            <CardDescription>
              An unexpected error occurred. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {this.state.error && (
                <code className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {this.state.error.message}
                </code>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" size="sm" className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleHardReload} variant="ghost" size="sm" className="w-fit">
                  Reload app
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Error handled:', error);
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button 
              onClick={clearError} 
              variant="outline" 
              size="sm" 
              className="w-fit bg-blue-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return { error, handleError, clearError, ErrorDisplay };
};

export default ErrorBoundary;
