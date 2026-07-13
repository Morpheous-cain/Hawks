import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, MapPin, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const DispatchEscalation = () => {
  const { data: dispatches, isLoading } = useQuery({
    queryKey: ["dispatch-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispatch_requests")
        .select("*, ticket:communication_tickets(ticket_number, subject), requested_by:profiles!dispatch_requests_requested_by_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const statusColors = {
    pending: "bg-alert-caution text-alert-caution",
    approved: "bg-alert-normal text-alert-normal",
    dispatched: "bg-primary text-primary",
    en_route: "bg-primary text-primary",
    on_scene: "bg-alert-normal text-alert-normal",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };

  const dispatchTypeColors = {
    patrol: "bg-blue-500/20 text-blue-500",
    mdt: "bg-purple-500/20 text-purple-500",
    k9: "bg-green-500/20 text-green-500",
    escort: "bg-orange-500/20 text-orange-500",
    investigation: "bg-red-500/20 text-red-500",
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-alert-normal text-alert-normal",
    high: "bg-alert-caution text-alert-caution",
    emergency: "bg-alert-critical text-alert-critical",
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-alert-caution">
            {dispatches?.filter(d => d.status === 'pending').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Dispatched</div>
          <div className="text-2xl font-bold text-primary">
            {dispatches?.filter(d => d.status === 'dispatched' || d.status === 'en_route').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">On Scene</div>
          <div className="text-2xl font-bold text-alert-normal">
            {dispatches?.filter(d => d.status === 'on_scene').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Completed Today</div>
          <div className="text-2xl font-bold text-muted-foreground">
            {dispatches?.filter(d => d.status === 'completed' && new Date(d.created_at) > new Date(Date.now() - 86400000)).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Emergency</div>
          <div className="text-2xl font-bold text-alert-critical">
            {dispatches?.filter(d => d.priority === 'emergency' && d.status !== 'completed').length || 0}
          </div>
        </Card>
      </div>

      {/* Dispatch Requests Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Dispatch Requests
        </h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Loading dispatch requests...
                  </TableCell>
                </TableRow>
              ) : dispatches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No dispatch requests
                  </TableCell>
                </TableRow>
              ) : (
                dispatches?.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-mono text-sm">{dispatch.request_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={dispatchTypeColors[dispatch.dispatch_type as keyof typeof dispatchTypeColors] || ''}>
                        {dispatch.dispatch_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{dispatch.ticket?.ticket_number}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm truncate">{dispatch.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[dispatch.priority as keyof typeof priorityColors]}>
                        {dispatch.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispatch.assigned_unit || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[dispatch.status as keyof typeof statusColors] || ''}>
                        {dispatch.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispatch.requested_by?.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(dispatch.created_at), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {dispatch.status === 'pending' && (
                          <>
                            <Button size="sm" variant="default">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {dispatch.status !== 'pending' && dispatch.status !== 'completed' && (
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default DispatchEscalation;