import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarCollapseToggle } from "@/components/shared/SidebarCollapseToggle";
import { Button } from "@/components/ui/button";
import { Phone, Clock, Calendar, LogOut } from "lucide-react";
import { ClientPortalSidebar } from "@/components/client-portal/ClientPortalSidebar";
import ClientPortalSiteStatus from "@/components/client-portal/ClientPortalSiteStatus";
import ClientPortalIncidents from "@/components/client-portal/ClientPortalIncidents";
import ClientPortalServiceRequests from "@/components/client-portal/ClientPortalServiceRequests";
import ClientPortalCommunication from "@/components/client-portal/ClientPortalCommunication";
import ClientPortalDashboard from "@/components/client-portal/ClientPortalDashboard";
import ClientPortalAdvisories from "@/components/client-portal/ClientPortalAdvisories";
import ClientPortalPatrolProof from "@/components/client-portal/ClientPortalPatrolProof";
import { PortalHeader } from "@/components/shell/PortalHeader";

const LiveClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 lg:flex">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-mono text-sm font-medium tabular-nums text-foreground">
        {format(now, "HH:mm:ss")}
      </span>
      <span className="h-3 w-px bg-border" />
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{format(now, "EEE, dd MMM")}</span>
    </div>
  );
};

const ClientPortal = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, [user]);

  const fetchClientData = async () => {
    if (!user) return;
    
    try {
      // For demo purposes, fetch the first client
      // In production, this would be linked to the user's profile
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setClientData(client);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading portal...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ClientPortalDashboard clientId={clientData?.id} />;
      case "advisories":
        return <ClientPortalAdvisories clientId={clientData?.id} />;
      case "sites":
        return <ClientPortalSiteStatus clientId={clientData?.id} />;
      case "patrol-proof":
        return <ClientPortalPatrolProof clientId={clientData?.id} />;
      case "incidents":
        return <ClientPortalIncidents clientId={clientData?.id} />;
      case "requests":
        return <ClientPortalServiceRequests clientId={clientData?.id} />;
      case "messages":
        return <ClientPortalCommunication clientId={clientData?.id} />;
      default:
        return <ClientPortalDashboard clientId={clientData?.id} />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      advisories: "Security Advisories",
      sites: "Site Status",
      "patrol-proof": "Patrol Verification",
      incidents: "Incident Reports",
      requests: "Service Requests",
      messages: "Messages",
    };
    return titles[activeTab] || "Dashboard";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ClientPortalSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={signOut}
          clientName={clientData?.legal_name || "Client Portal"}
          clientId={clientData?.id}
        />

        <SidebarInset className="flex-1 flex flex-col">
          {/* Header — mirrors PlatformShell */}
          <PortalHeader
            portalLabel={`Client Portal · ${clientData?.legal_name || "Client"}`}
            pageTitle={getPageTitle()}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1440px]">{renderContent()}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ClientPortal;
