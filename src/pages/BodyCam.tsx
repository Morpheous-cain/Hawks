import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { Camera, Video, Shield, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import LiveCameraMonitor from "@/components/bodycam/LiveCameraMonitor";
import EvidenceLibrary from "@/components/bodycam/EvidenceLibrary";
import DeviceManagement from "@/components/bodycam/DeviceManagement";
import BodyCamAnalytics from "@/components/bodycam/BodyCamAnalytics";

const BodyCam = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>("all");

  const { data: officers } = useQuery({
    queryKey: ['bodycam-officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, staff_number')
        .eq('status', 'active')
        .order('first_name')
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Body Cam & Field Video"
        description="Real-time officer monitoring, evidence management & chain of custody (BCI-2025)"
        icon={Camera}
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Officer:</span>
        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Officers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Officers</SelectItem>
            {officers?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.first_name} {o.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Evidence Library
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Device Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <LiveCameraMonitor />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceLibrary />
        </TabsContent>

        <TabsContent value="devices">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <BodyCamAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BodyCam;
