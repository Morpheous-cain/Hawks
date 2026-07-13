import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkOrderDialog } from "./WorkOrderDialog";
import { exportToCSV, exportToPDF } from "@/utils/exportData";

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchWorkOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('technical_work_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setWorkOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkOrders();

    const channel = supabase
      .channel('work-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_work_orders' }, () => {
        fetchWorkOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const filteredOrders = workOrders.filter(order =>
    searchTerm === "" ||
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, 'work_orders');
  };

  const handleExportPDF = () => {
    const exportData = filteredOrders.map(order => ({
      'Work Order': order.work_order_number,
      'Title': order.title,
      'Type': order.work_order_type,
      'Priority': order.priority,
      'Status': order.status,
      'Scheduled': order.scheduled_date || 'N/A',
    }));
    exportToPDF(exportData, 'work_orders', 'Work Orders Report');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-alert-normal text-primary-foreground";
      case "in-progress": return "bg-blue-500 text-primary-foreground";
      case "testing": return "bg-purple-500 text-primary-foreground";
      case "assigned": return "bg-alert-caution text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-alert-critical text-primary-foreground";
      case "high": return "bg-alert-caution text-primary-foreground";
      case "medium": return "bg-blue-500 text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search work orders..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <WorkOrderDialog onSuccess={fetchWorkOrders} />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Work Orders List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading work orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No work orders found</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-4 border-border hover:border-primary/50 transition-colors">
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{order.title}</h3>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.work_order_number} • {order.work_order_type}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 text-foreground font-medium capitalize">{order.work_order_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 text-foreground font-medium capitalize">{order.service_category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 text-foreground font-medium capitalize">{order.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="ml-2 text-foreground font-medium">{order.scheduled_date || 'Not set'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <Badge className={getStatusColor(order.status)}>
                  {order.status.replace("-", " ")}
                </Badge>
                <Badge variant="outline" className="border-border">
                  Stage: {order.workflow_stage}
                </Badge>
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
