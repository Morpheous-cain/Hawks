import PageHeader from "@/components/PageHeader";
import { MessageSquare, Headphones } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveCallsDashboard from "@/components/comms/LiveCallsDashboard";
import CallHandlingScreen from "@/components/comms/CallHandlingScreen";
import WhatsAppSMSCenter from "@/components/comms/WhatsAppSMSCenter";
import CommunicationLog from "@/components/comms/CommunicationLog";
import DispatchEscalation from "@/components/comms/DispatchEscalation";
import ReportsMetrics from "@/components/comms/ReportsMetrics";
import RadioBridge from "@/components/comms/RadioBridge";
import CallOperatorConsole from "@/components/comms/CallOperatorConsole";

const Communications = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Center & Communication Command"
        description="BH-COMMS-2025 - Unified Communication Hub"
        icon={MessageSquare}
      />

      <Tabs defaultValue="operator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="operator" className="gap-1">
            <Headphones className="w-3 h-3" />
            Operator
          </TabsTrigger>
          <TabsTrigger value="live-calls">Live Calls</TabsTrigger>
          <TabsTrigger value="call-handling">Call Handling</TabsTrigger>
          <TabsTrigger value="whatsapp-sms">WhatsApp & SMS</TabsTrigger>
          <TabsTrigger value="tickets">Tickets Log</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="radio-bridge">Radio Bridge</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="operator" className="space-y-4">
          <CallOperatorConsole />
        </TabsContent>

        <TabsContent value="live-calls" className="space-y-4">
          <LiveCallsDashboard />
        </TabsContent>

        <TabsContent value="call-handling" className="space-y-4">
          <CallHandlingScreen />
        </TabsContent>

        <TabsContent value="whatsapp-sms" className="space-y-4">
          <WhatsAppSMSCenter />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <CommunicationLog />
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <DispatchEscalation />
        </TabsContent>

        <TabsContent value="radio-bridge" className="space-y-4">
          <RadioBridge />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communications;
