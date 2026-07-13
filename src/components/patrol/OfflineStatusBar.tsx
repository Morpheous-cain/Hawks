import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, CloudOff, Upload } from "lucide-react";
import useOfflineSync from "@/hooks/useOfflineSync";

const OfflineStatusBar = () => {
  const { online, pendingCount, syncing, syncPendingActions } = useOfflineSync();

  if (online && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wifi className="w-3 h-3 text-green-500" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      online ? 'bg-amber-500/10 border-amber-500/30' : 'bg-destructive/10 border-destructive/30'
    }`}>
      {online ? (
        <Wifi className="w-4 h-4 text-amber-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-destructive" />
      )}
      
      <span className="text-sm font-medium">
        {online ? 'Online' : 'Offline'}
      </span>

      {pendingCount > 0 && (
        <>
          <Badge variant="outline" className="text-xs">
            <CloudOff className="w-3 h-3 mr-1" />
            {pendingCount} queued
          </Badge>
          
          {online && (
            <Button
              variant="ghost"
              size="sm"
              onClick={syncPendingActions}
              disabled={syncing}
              className="h-6 px-2 text-xs"
            >
              {syncing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineStatusBar;
