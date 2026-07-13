import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Video } from "lucide-react";

const CCTVVideoWallIntegration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            CCTV & Video Wall Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">CCTV Integration</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This module integrates with your existing CCTV & Video module to provide
              quick access to camera feeds associated with active incidents, alarms, and sites.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Navigate to CCTV & Video module for full camera management
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CCTVVideoWallIntegration;
