import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { TrendingDown, AlertCircle, BarChart3, Users, Building2, Package, Plus } from "lucide-react";
import LossControlDashboard from "@/components/cctv/LossControlDashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { LossControlRecordDialog } from "@/components/loss-control/LossControlRecordDialog";
import { LossControlOfficerManagement } from "@/components/loss-control/LossControlOfficerManagement";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LossControl = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showOfficerMgmt, setShowOfficerMgmt] = useState(false);

  useEffect(() => {
    fetchRecords();
    const channel = supabase
      .channel('loss-control-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loss_control_records' }, () => fetchRecords())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('loss_control_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  const activeRecords = records.filter(r => r.status === 'reported' || r.status === 'investigating' || r.status === 'open');
  const resolvedRecords = records.filter(r => r.status === 'resolved' || r.status === 'closed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Loss Control Intelligence & Operations System"
          description="BH-LCSM-2025 - Financial Loss Prevention & Security Intelligence"
          icon={TrendingDown}
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Record
          </Button>
          <Button onClick={() => setShowOfficerMgmt(true)} className="gap-2">
            <Shield className="w-4 h-4" />
            Manage Officers
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Loss Records</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">Behavior Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="corrective" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Corrective Actions</span>
          </TabsTrigger>
          <TabsTrigger value="entities" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Entity Profiles</span>
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Site Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <LossControlDashboard />
        </TabsContent>

        <TabsContent value="records">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Loss Control Records</h3>
              <Badge variant="outline" className="bg-alert-caution/10 border-alert-caution/30 text-alert-caution">
                {activeRecords.length} Active Cases
              </Badge>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No loss control records yet. Click "New Record" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Value (KES)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.record_number}</TableCell>
                      <TableCell><Badge variant="outline">{record.category || record.record_type}</Badge></TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>{record.financial_value ? `KES ${Number(record.financial_value).toLocaleString()}` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={
                          record.status === 'reported' || record.status === 'open' ? 'bg-alert-caution' :
                          record.status === 'investigating' ? 'bg-primary' :
                          'bg-alert-normal'
                        }>{record.status}</Badge>
                      </TableCell>
                      <TableCell>{record.created_at ? format(new Date(record.created_at), 'PP') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Behavior Pattern Detection</h3>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No patterns detected yet. Create loss records to enable pattern analysis.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(records.reduce((acc: Record<string, number>, r) => {
                  acc[r.category || 'Unknown'] = (acc[r.category || 'Unknown'] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([type, count]: [string, number]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium capitalize">{type}</span>
                    <Badge variant="outline">{count} incidents</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="corrective">
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Corrective Action Tracker</h3>
            {activeRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No corrective actions pending.</p>
            ) : (
              <div className="space-y-3">
                {activeRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-alert-caution/10 border border-alert-caution/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{record.record_number} - {record.category}</p>
                      <p className="text-xs text-muted-foreground">{record.incident_description?.substring(0, 80)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await supabase.from('loss_control_records').update({ status: 'resolved' }).eq('id', record.id);
                      toast.success('Record resolved');
                      fetchRecords();
                    }}>Resolve</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="entities">
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Entity Risk Profiles</h3>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No flagged entities. Records are needed to build entity profiles.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(records.reduce((acc: Record<string, number>, r) => {
                  const entity = r.cashier_name || r.assigned_to || 'Unknown';
                  acc[entity] = (acc[entity] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([entity, count]: [string, number]) => (
                  <div key={entity} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{entity}</span>
                    <Badge variant={count > 2 ? "destructive" : "outline"}>{count} incident(s)</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sites">
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Site-Level Analysis</h3>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No site data available. Loss records are needed for site analysis.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(records.reduce((acc: Record<string, { count: number; value: number }>, r) => {
                  const site = r.location || 'Unknown';
                  if (!acc[site]) acc[site] = { count: 0, value: 0 };
                  acc[site].count += 1;
                  acc[site].value += Number(r.financial_value || 0);
                  return acc;
                }, {} as Record<string, { count: number; value: number }>)).map(([site, data]: [string, { count: number; value: number }]) => (
                  <div key={site} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{site}</p>
                      <p className="text-xs text-muted-foreground">Total loss: KES {data.value.toLocaleString()}</p>
                    </div>
                    <Badge variant="outline">{data.count} incident(s)</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <LossControlRecordDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchRecords} />
      {showOfficerMgmt && <LossControlOfficerManagement onClose={() => setShowOfficerMgmt(false)} />}
    </div>
  );
};

export default LossControl;