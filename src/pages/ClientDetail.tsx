import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, FileText, Users, Shield, DollarSign, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const currentPlatform = typeof window !== "undefined"
    ? window.location.pathname.match(/^\/platform\/([^/]+)/)?.[1] ?? null
    : null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchClientDetails();
  }, [user, id]);

  const fetchClientDetails = async () => {
    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      const { data: contractsData } = await supabase
        .from("contracts")
        .select("*")
        .eq("client_id", id)
        .order("start_date", { ascending: false });

      const { data: sitesData } = await supabase
        .from("sites")
        .select("*")
        .eq("client_id", id);

      const { data: contactsData } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", id);

      const { data: riskData } = await supabase
        .from("risk_assessments")
        .select("*, sites(site_name)")
        .eq("client_id", id)
        .order("assessment_date", { ascending: false });

      const { data: financeData } = await supabase
        .from("client_finances")
        .select("*")
        .eq("client_id", id)
        .order("invoice_date", { ascending: false });

      setClient(clientData);
      setContracts(contractsData || []);
      setSites(sitesData || []);
      setContacts(contactsData || []);
      setRiskAssessments(riskData || []);
      setFinances(financeData || []);
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPulse />;
  if (!client) return <div>Client not found</div>;

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: any = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
      partial: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getRiskTierBadge = (tier: string) => {
    const variants: any = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    };
    return <Badge variant={variants[tier] || "default"}>{tier}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(currentPlatform ? `/platform/${currentPlatform}/m/clients` : "/clients")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          icon={Building2}
          title={client.legal_name}
          description={`Client ID: ${client.client_id} | ${client.sector || "N/A"}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(client.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessments</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Legal Name</p>
                  <p className="text-sm text-muted-foreground">{client.legal_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Trading Name</p>
                  <p className="text-sm text-muted-foreground">{client.trading_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Registration Number</p>
                  <p className="text-sm text-muted-foreground">{client.registration_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">PIN</p>
                  <p className="text-sm text-muted-foreground">{client.pin || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium">Background</p>
                  <p className="text-sm text-muted-foreground">{client.background || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Primary Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{client.primary_contact_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">{client.primary_contact_role || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-primary">{client.primary_contact_phone || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Secondary Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{client.secondary_contact_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">{client.secondary_contact_role || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-primary">{client.secondary_contact_phone || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location & Geofence Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium">Latitude</p>
                  <p className="text-sm text-muted-foreground">{client.gps_lat || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Longitude</p>
                  <p className="text-sm text-muted-foreground">{client.gps_lng || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Geofence Radius</p>
                  <p className="text-sm text-muted-foreground">{client.geofence_radius_meters || 50} meters</p>
                </div>
              </div>
              {client.gps_lat && client.gps_lng && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Guards assigned to this client can only clock in/out within {client.geofence_radius_meters || 50}m of the configured location.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>All contracts for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>{format(new Date(contract.start_date), "PP")}</TableCell>
                      <TableCell>{format(new Date(contract.end_date), "PP")}</TableCell>
                      <TableCell>KES {contract.value?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>{contract.billing_frequency || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites">
          <Card>
            <CardHeader>
              <CardTitle>Sites</CardTitle>
              <CardDescription>All sites for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Commander</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.site_name}</TableCell>
                      <TableCell>{site.site_type}</TableCell>
                      <TableCell>{site.address}</TableCell>
                      <TableCell>{site.site_commander || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>All contact persons for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.position || "N/A"}</TableCell>
                      <TableCell><Badge variant="outline">{contact.contact_type}</Badge></TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>{contact.email || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessments</CardTitle>
              <CardDescription>Risk assessment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Assessment Date</TableHead>
                    <TableHead>Risk Tier</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.sites?.site_name || "General"}</TableCell>
                      <TableCell>{format(new Date(assessment.assessment_date), "PP")}</TableCell>
                      <TableCell>{getRiskTierBadge(assessment.risk_tier)}</TableCell>
                      <TableCell>{assessment.risk_score}</TableCell>
                      <TableCell><Badge variant="outline">{assessment.risk_trend}</Badge></TableCell>
                      <TableCell>{format(new Date(assessment.next_due_date), "PP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Financial Records</CardTitle>
              <CardDescription>Invoices and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Ageing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finances.map((finance) => (
                    <TableRow key={finance.id}>
                      <TableCell className="font-medium">{finance.invoice_number}</TableCell>
                      <TableCell>{format(new Date(finance.invoice_date), "PP")}</TableCell>
                      <TableCell>KES {finance.amount?.toLocaleString()}</TableCell>
                      <TableCell>{getPaymentStatusBadge(finance.payment_status)}</TableCell>
                      <TableCell>{finance.payment_date ? format(new Date(finance.payment_date), "PP") : "N/A"}</TableCell>
                      <TableCell>{finance.ageing_days} days</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}