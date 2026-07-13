import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Building2, Plus, Search, Filter, TrendingUp, AlertCircle, Download, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingPulse from "@/components/LoadingPulse";
import { exportToCSV } from "@/utils/exportData";
import { logAudit } from "@/utils/auditLog";
import { ClientCreateDialog } from "@/components/client/ClientCreateDialog";
import { ClientDetailDialog } from "@/components/client/ClientDetailDialog";

const ClientManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          contracts(count),
          sites(count),
          risk_assessments(risk_tier, risk_score, risk_trend)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
      
      await logAudit({
        module: "client_management",
        action: "view_clients",
        changes: { count: data?.length || 0 },
      });
    } catch (error: any) {
      toast({
        title: "Error Loading Clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === "all" || client.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  if (authLoading || loading) {
    return <LoadingPulse />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Management Module"
        description="Executive Data Environment - Client Portfolio & Risk Management"
        icon={Building2}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-xs font-medium text-foreground/80 mt-1">Across all sectors</p>
            </div>
            <Building2 className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Active Contracts</p>
              <p className="text-2xl font-bold">
                {clients.filter(c => c.status === 'active').length}
              </p>
              <p className="text-xs font-medium text-foreground/80 mt-1">
                {((clients.filter(c => c.status === 'active').length / clients.length) * 100).toFixed(0)}% retention
              </p>
            </div>
            <TrendingUp className="h-8 w-8" style={{ color: 'hsl(var(--alert-normal))' }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Total Annual Value</p>
              <p className="text-2xl font-bold">
                KES {(clients.reduce((sum, c) => sum + (Number(c.annual_value) || 0), 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs font-medium text-foreground/80 mt-1">Combined portfolio</p>
            </div>
            <TrendingUp className="h-8 w-8" style={{ color: 'hsl(var(--accent))' }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Pending Renewals</p>
              <p className="text-2xl font-bold">
                {clients.filter(c => c.status === 'pending_renewal').length}
              </p>
              <p className="text-xs font-medium text-foreground/80 mt-1">Requires attention</p>
            </div>
            <AlertCircle className="h-8 w-8" style={{ color: 'hsl(var(--alert-caution))' }} />
          </div>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="Aviation">Aviation</SelectItem>
                <SelectItem value="Hospitality">Hospitality</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Retail & Commercial">Retail & Commercial</SelectItem>
                <SelectItem value="Manufacturing & Distribution">Manufacturing & Distribution</SelectItem>
                <SelectItem value="Retail & Real Estate">Retail & Real Estate</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Logistics & Transport">Logistics & Transport</SelectItem>
                <SelectItem value="Corporate Offices">Corporate Offices</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Manufacturing & Food Processing">Manufacturing & Food Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 w-full md:w-auto"
              onClick={() => exportToCSV(filteredClients, 'black-hawk-clients')}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              className="gap-2 bg-gradient-command w-full md:w-auto"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              New Client
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card">Client ID</TableHead>
                <TableHead className="sticky top-0 bg-card">Legal Name</TableHead>
                <TableHead className="sticky top-0 bg-card">Primary Contact</TableHead>
                <TableHead className="sticky top-0 bg-card">Secondary Contact</TableHead>
                <TableHead className="sticky top-0 bg-card">Sector</TableHead>
                <TableHead className="sticky top-0 bg-card">Contract Ref</TableHead>
                <TableHead className="sticky top-0 bg-card">Sites</TableHead>
                <TableHead className="sticky top-0 bg-card">Geofence</TableHead>
                <TableHead className="sticky top-0 bg-card">Status</TableHead>
                <TableHead className="sticky top-0 bg-card">Next Action</TableHead>
                <TableHead className="sticky top-0 bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No clients found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.client_id}</TableCell>
                    <TableCell className="font-medium">{client.legal_name}</TableCell>
                    <TableCell className="text-sm">
                      <div className="max-w-[220px]">
                        <p className="font-medium truncate">{client.primary_contact_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.primary_contact_role || ""}</p>
                        {client.primary_contact_phone && (
                          <p className="text-xs text-primary truncate">{client.primary_contact_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="max-w-[220px]">
                        <p className="font-medium truncate">{client.secondary_contact_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.secondary_contact_role || ""}</p>
                        {client.secondary_contact_phone && (
                          <p className="text-xs text-primary truncate">{client.secondary_contact_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {client.sector || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{client.contract_ref || "—"}</TableCell>
                    <TableCell className="text-center">{client.active_sites_count || 0}</TableCell>
                    <TableCell>
                      {client.gps_lat && client.gps_lng ? (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          {client.geofence_radius_meters || 50}m
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status === 'pending_renewal' ? 'Pending' : client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[250px]">
                      <p className="truncate text-muted-foreground">{client.next_action || "—"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setShowDetailDialog(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Data Governance Notice */}
      <Card className="p-4 bg-muted/50 border-l-4 border-l-primary">
        <h3 className="font-semibold text-sm mb-2">Data Governance Principles</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ <strong>One-Entry Rule:</strong> Each data point entered once by rightful owner</li>
          <li>✓ <strong>Non-Blocking Workflow:</strong> Data entry never stops operations</li>
          <li>✓ <strong>Confidentiality:</strong> Only Administrator, BDO, and COO can feed system</li>
          <li>✓ <strong>Auditability:</strong> Every entry records who, what, when</li>
          <li>✓ <strong>COO Verification:</strong> All entries verified before executive dashboard</li>
        </ul>
      </Card>

      {/* Create Client Dialog */}
      <ClientCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchClients}
      />

      {/* Client Detail Dialog */}
      <ClientDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        clientId={selectedClientId}
      />
    </div>
  );
};

export default ClientManagement;
