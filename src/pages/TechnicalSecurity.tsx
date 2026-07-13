import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { Wrench, ClipboardList, Package, Calendar, AlertTriangle, Building2, Smartphone, Briefcase } from "lucide-react";
import WorkOrders from "@/components/technical/WorkOrders";
import EquipmentRegistry from "@/components/technical/EquipmentRegistry";
import MaintenanceSchedulesEnhanced from "@/components/technical/MaintenanceSchedulesEnhanced";
import RiskManagement from "@/components/technical/RiskManagement";
import ClientSiteProfiles from "@/components/technical/ClientSiteProfiles";
import MobileTechnicianInterface from "@/components/technical/MobileTechnicianInterface";
import { TIMUPlatform } from "@/components/technical/TIMUPlatform";
import { useTechnicalNotifications } from "@/hooks/useTechnicalNotifications";

const TechnicalSecurity = () => {
  useTechnicalNotifications();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Security Module"
        description="Technical Installations & Maintenance Unit (TIMU)"
        icon={Wrench}
      />

      <Tabs defaultValue="timu-platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="timu-platform" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">TIMU App</span>
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Work Orders</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sites</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timu-platform">
          <TIMUPlatform />
        </TabsContent>

        <TabsContent value="work-orders">
          <WorkOrders />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentRegistry />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceSchedulesEnhanced />
        </TabsContent>

        <TabsContent value="mobile">
          <MobileTechnicianInterface />
        </TabsContent>

        <TabsContent value="risk">
          <RiskManagement />
        </TabsContent>

        <TabsContent value="sites">
          <ClientSiteProfiles />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechnicalSecurity;
