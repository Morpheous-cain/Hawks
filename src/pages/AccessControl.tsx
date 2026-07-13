import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { CreditCard, UserCheck, Clock, TrendingUp, Download, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { AccessLogDialog } from "@/components/access-control/AccessLogDialog";
import { exportToCSV } from "@/utils/exportData";
import { toast } from "sonner";
import { format } from "date-fns";

const AccessControl = () => {
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .order('check_in_time', { ascending: false })
      .limit(100);

    if (!error) {
      setAccessLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccessLogs();

    const channel = supabase
      .channel('access-log-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_logs' }, () => fetchAccessLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCheckOut = async (logId: string) => {
    const { error } = await supabase
      .from('access_logs')
      .update({ check_out_time: new Date().toISOString(), status: 'checked_out' })
      .eq('id', logId);

    if (error) {
      toast.error("Failed to check out");
    } else {
      toast.success("Checked out successfully");
      fetchAccessLogs();
    }
  };

  const granted = accessLogs.filter((l) => l.status === 'checked_in' || l.status === 'checked_out').length;
  const denied = accessLogs.filter((l) => l.status === 'denied').length;

  const statusConfig: Record<string, string> = {
    checked_in: "bg-alert-normal text-primary-foreground",
    checked_out: "bg-muted text-muted-foreground",
    denied: "bg-alert-critical text-primary-foreground",
    pending: "bg-alert-caution text-primary-foreground",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control Interface"
        description="Biometric and RFID entry records synchronized with guard deployment"
        icon={CreditCard}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => exportToCSV(accessLogs, 'access-logs')}>
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
        <AccessLogDialog onSuccess={fetchAccessLogs} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-alert-normal" />
            <div>
              <p className="text-sm font-semibold text-primary">Checked In</p>
              <p className="text-3xl font-bold text-foreground">{granted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-alert-critical/30 bg-alert-critical/5">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-alert-critical" />
            <div>
              <p className="text-sm font-semibold text-primary">Access Denied</p>
              <p className="text-3xl font-bold text-foreground">{denied}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">Total Logs</p>
              <p className="text-3xl font-bold text-foreground">{accessLogs.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm font-semibold text-primary">System Status</p>
              <p className="text-3xl font-bold text-foreground">Online</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Real-Time Access Log</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading access logs...</div>
        ) : accessLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No access logs yet. Use the "Log Access" button to create your first entry.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Log ID</TableHead>
                <TableHead>Visitor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Access Point</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground">{log.log_id}</TableCell>
                  <TableCell className="text-foreground">
                    <div>
                      <p className="font-medium">{log.visitor_name}</p>
                      <p className="text-xs text-muted-foreground">{log.visitor_id_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground capitalize">{log.visitor_type}</TableCell>
                  <TableCell className="text-foreground">{log.access_point}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {log.check_in_time ? format(new Date(log.check_in_time), 'HH:mm:ss') : '-'}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {log.check_out_time ? format(new Date(log.check_out_time), 'HH:mm:ss') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[log.status] || statusConfig.pending}>
                      {log.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.status === 'checked_in' && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckOut(log.id)}>
                        <LogOut className="w-3 h-3 mr-1" />Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AccessControl;
