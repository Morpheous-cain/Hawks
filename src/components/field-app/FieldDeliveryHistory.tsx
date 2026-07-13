import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Package, CheckCircle, Clock, Search, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Delivery {
  id: string;
  tracking_number: string;
  sender_name: string;
  recipient_name: string;
  recipient_address: string;
  status: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const FieldDeliveryHistory = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDeliveries();
    
    const channel = supabase
      .channel('delivery-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courier_deliveries' }, () => {
        fetchDeliveries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courier_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-500",
      picked_up: "bg-blue-500/20 text-blue-500",
      in_transit: "bg-purple-500/20 text-purple-500",
      delivered: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
    };
    return colors[status] || colors.pending;
  };

  const filteredDeliveries = deliveries.filter(d =>
    d.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
    d.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    d.sender_name.toLowerCase().includes(search.toLowerCase())
  );

  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
  const pendingCount = deliveries.filter(d => d.status === 'pending' || d.status === 'in_transit').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deliveries..."
          className="pl-9"
        />
      </div>

      {/* Delivery List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Delivery History ({filteredDeliveries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No deliveries found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="bg-card/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-xs text-primary">
                          {delivery.tracking_number}
                        </span>
                        <Badge className={getStatusBadge(delivery.status)}>
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{delivery.sender_name}</p>
                            <p className="text-xs text-muted-foreground">Sender</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{delivery.recipient_name}</p>
                            <p className="text-xs text-muted-foreground">{delivery.recipient_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {delivery.picked_up_at && (
                          <span>Picked: {format(new Date(delivery.picked_up_at), 'MMM dd, HH:mm')}</span>
                        )}
                        {delivery.delivered_at && (
                          <span className="text-green-500">
                            Delivered: {format(new Date(delivery.delivered_at), 'MMM dd, HH:mm')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldDeliveryHistory;
