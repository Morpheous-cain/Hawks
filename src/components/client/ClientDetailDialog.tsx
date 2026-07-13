import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, FileText, Users, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
}

export function ClientDetailDialog({ open, onOpenChange, clientId }: ClientDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);

  useEffect(() => {
    if (open && clientId) {
      fetchClientDetails();
    }
  }, [open, clientId]);

  const fetchClientDetails = async () => {
    if (!clientId) return;
    setLoading(true);
    
    try {
      const [clientRes, contractsRes, sitesRes, contactsRes, riskRes, financeRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).single(),
        supabase.from("contracts").select("*").eq("client_id", clientId).order("start_date", { ascending: false }),
        supabase.from("sites").select("*").eq("client_id", clientId),
        supabase.from("client_contacts").select("*").eq("client_id", clientId),
        supabase.from("risk_assessments").select("*, sites(site_name)").eq("client_id", clientId).order("assessment_date", { ascending: false }),
        supabase.from("client_finances").select("*").eq("client_id", clientId).order("invoice_date", { ascending: false }),
      ]);

      setClient(clientRes.data);
      setContracts(contractsRes.data || []);
      setSites(sitesRes.data || []);
      setContacts(contactsRes.data || []);
      setRiskAssessments(riskRes.data || []);
      setFinances(financeRes.data || []);
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = { active: "default", inactive: "secondary", suspended: "destructive" };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: any = { paid: "default", pending: "secondary", overdue: "destructive", partial: "outline" };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getRiskTierBadge = (tier: string) => {
    const variants: any = { low: "default", medium: "secondary", high: "destructive" };
    return <Badge variant={variants[tier] || "default"}>{tier}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {loading ? "Loading..." : client?.legal_name || "Client Details"}
          </DialogTitle>
          <DialogDescription>
            {client && `Client ID: ${client.client_id} | ${client.sector || "N/A"}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !client ? (
          <div className="text-center py-8 text-muted-foreground">Client not found</div>
        ) : (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid gap-3 grid-cols-4">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(client.status)}</div>
                    </div>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Contracts</p>
                      <p className="text-xl font-bold">{contracts.length}</p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Sites</p>
                      <p className="text-xl font-bold">{sites.length}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Contacts</p>
                      <p className="text-xl font-bold">{contacts.length}</p>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts</TabsTrigger>
                  <TabsTrigger value="sites">Sites</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="risk">Risk</TabsTrigger>
                  <TabsTrigger value="finances">Finances</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid gap-3 grid-cols-2">
                        <div>
                          <p className="text-xs font-medium">Legal Name</p>
                          <p className="text-sm text-muted-foreground">{client.legal_name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Trading Name</p>
                          <p className="text-sm text-muted-foreground">{client.trading_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Registration Number</p>
                          <p className="text-sm text-muted-foreground">{client.registration_number || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">PIN</p>
                          <p className="text-sm text-muted-foreground">{client.pin || "N/A"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-medium">Background</p>
                          <p className="text-sm text-muted-foreground">{client.background || "N/A"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 grid-cols-2">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Primary Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <div>
                          <p className="text-xs font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{client.primary_contact_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Role</p>
                          <p className="text-sm text-muted-foreground">{client.primary_contact_role || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Phone</p>
                          <p className="text-sm text-primary">{client.primary_contact_phone || "N/A"}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Secondary Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <div>
                          <p className="text-xs font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{client.secondary_contact_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Role</p>
                          <p className="text-sm text-muted-foreground">{client.secondary_contact_role || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Phone</p>
                          <p className="text-sm text-primary">{client.secondary_contact_phone || "N/A"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location & Geofence Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 grid-cols-3">
                        <div>
                          <p className="text-xs font-medium">Latitude</p>
                          <p className="text-sm text-muted-foreground">{client.gps_lat || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Longitude</p>
                          <p className="text-sm text-muted-foreground">{client.gps_lng || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Geofence Radius</p>
                          <p className="text-sm text-muted-foreground">{client.geofence_radius_meters || 50} meters</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contracts">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Contracts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {contracts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No contracts found</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Contract #</TableHead>
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Status</TableHead>
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sites">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Sites</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sites.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No sites found</p>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contacts">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No contacts found</p>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Risk Assessments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskAssessments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No risk assessments found</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Site</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Risk Tier</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Trend</TableHead>
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="finances">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Financial Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {finances.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No financial records found</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
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
                                <TableCell>{finance.ageing_days || 0} days</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
