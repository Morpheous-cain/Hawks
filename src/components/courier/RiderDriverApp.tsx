import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Package, MapPin, Phone, Clock, CheckCircle2, Navigation, 
  AlertCircle, User, Bell, Bike, Car, MessageSquare, RefreshCw,
  Play, PauseCircle, XCircle
} from "lucide-react";
import { format } from "date-fns";

interface Delivery {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  package_type: string;
  priority: string;
  status: string;
  notes: string;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
}

interface RiderInfo {
  id: string;
  rider_id: string;
  rider_name: string;
  vehicle_type: string;
  status: string;
}

// Demo data for live demonstration
const demoRiderInfo: RiderInfo = {
  id: 'demo-rider-001',
  rider_id: 'RDR-001',
  rider_name: 'James Mwangi',
  vehicle_type: 'motorcycle',
  status: 'active'
};

const demoDeliveries: Delivery[] = [
  {
    id: 'demo-del-001',
    tracking_number: 'TRK-2024-001',
    sender_name: 'Nakumatt Supermarket',
    sender_phone: '+254 722 123 456',
    sender_address: 'Westlands Mall, Nairobi',
    recipient_name: 'Sarah Wanjiku',
    recipient_phone: '+254 733 987 654',
    recipient_address: 'Kilimani, Argwings Kodhek Road, Apt 5B',
    package_type: 'groceries',
    priority: 'urgent',
    status: 'assigned',
    notes: 'Handle with care - contains fragile items',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    picked_up_at: null,
    delivered_at: null
  },
  {
    id: 'demo-del-002',
    tracking_number: 'TRK-2024-002',
    sender_name: 'Java House CBD',
    sender_phone: '+254 711 456 789',
    sender_address: 'Kenyatta Avenue, Nairobi CBD',
    recipient_name: 'Michael Odhiambo',
    recipient_phone: '+254 700 111 222',
    recipient_address: 'Upper Hill, NHIF Building, 4th Floor',
    package_type: 'food',
    priority: 'high',
    status: 'picked_up',
    notes: 'Hot food delivery - deliver ASAP',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 10 * 60000).toISOString(),
    delivered_at: null
  },
  {
    id: 'demo-del-003',
    tracking_number: 'TRK-2024-003',
    sender_name: 'Jumia Warehouse',
    sender_phone: '+254 720 555 666',
    sender_address: 'Industrial Area, Nairobi',
    recipient_name: 'Grace Achieng',
    recipient_phone: '+254 712 333 444',
    recipient_address: 'Lavington, James Gichuru Road',
    package_type: 'electronics',
    priority: 'normal',
    status: 'in_transit',
    notes: 'Customer requested call before delivery',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 25 * 60000).toISOString(),
    delivered_at: null
  },
  {
    id: 'demo-del-004',
    tracking_number: 'TRK-2024-004',
    sender_name: 'Pharmacy Direct',
    sender_phone: '+254 722 888 999',
    sender_address: 'Hurlingham Shopping Centre',
    recipient_name: 'Peter Kamau',
    recipient_phone: '+254 733 444 555',
    recipient_address: 'South C, Mugoya Estate',
    package_type: 'medical',
    priority: 'urgent',
    status: 'pending',
    notes: 'Medical supplies - time sensitive',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    picked_up_at: null,
    delivered_at: null
  },
  {
    id: 'demo-del-005',
    tracking_number: 'TRK-2024-005',
    sender_name: 'Carrefour Westgate',
    sender_phone: '+254 711 222 333',
    sender_address: 'Westgate Mall, Westlands',
    recipient_name: 'Lucy Njeri',
    recipient_phone: '+254 700 666 777',
    recipient_address: 'Parklands, 3rd Avenue',
    package_type: 'groceries',
    priority: 'normal',
    status: 'pending',
    notes: '',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    picked_up_at: null,
    delivered_at: null
  },
  {
    id: 'demo-del-006',
    tracking_number: 'TRK-2024-006',
    sender_name: 'KFC Moi Avenue',
    sender_phone: '+254 722 111 000',
    sender_address: 'Moi Avenue, Nairobi',
    recipient_name: 'David Mutua',
    recipient_phone: '+254 733 555 888',
    recipient_address: 'Ngong Road, Prestige Plaza',
    package_type: 'food',
    priority: 'high',
    status: 'delivered',
    notes: 'Delivered successfully',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 100 * 60000).toISOString(),
    delivered_at: new Date(Date.now() - 80 * 60000).toISOString()
  },
  {
    id: 'demo-del-007',
    tracking_number: 'TRK-2024-007',
    sender_name: 'Quickmart Karen',
    sender_phone: '+254 720 777 888',
    sender_address: 'Karen Shopping Centre',
    recipient_name: 'Anne Wambui',
    recipient_phone: '+254 712 999 000',
    recipient_address: 'Karen Hardy, Bogani Road',
    package_type: 'groceries',
    priority: 'normal',
    status: 'delivered',
    notes: 'Left with security guard',
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 160 * 60000).toISOString(),
    delivered_at: new Date(Date.now() - 140 * 60000).toISOString()
  }
];

export const RiderDriverApp = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(demoDeliveries);
  const [riderInfo, setRiderInfo] = useState<RiderInfo | null>(demoRiderInfo);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState("assigned");

  useEffect(() => {
    fetchRiderInfo();
    fetchDeliveries();

    // Subscribe to realtime delivery updates
    const channel = supabase
      .channel('rider_deliveries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courier_deliveries' },
        (payload) => {
          console.log('Delivery update:', payload);
          fetchDeliveries();
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            toast.info('New delivery update received!', {
              description: 'Check your assigned deliveries',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRiderInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('courier_riders')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setRiderInfo(data);
    } catch (error) {
      console.error('Error fetching rider info:', error);
      // Keep demo data if fetch fails
    }
  };

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('courier_deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setDeliveries(data);
      }
      // Keep demo data if no real data exists
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      // Keep demo data if fetch fails
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('courier_deliveries')
        .update(updates)
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchDeliveries();
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateRiderStatus = async (newStatus: string) => {
    if (!riderInfo) return;
    
    try {
      const { error } = await supabase
        .from('courier_riders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', riderInfo.id);

      if (error) throw error;
      setRiderInfo({ ...riderInfo, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating rider status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-alert-caution/20 text-alert-caution border-alert-caution/30';
      case 'assigned': return 'bg-primary/20 text-primary border-primary/30';
      case 'picked_up': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_transit': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-alert-normal/20 text-alert-normal border-alert-normal/30';
      case 'failed': return 'bg-alert-critical/20 text-alert-critical border-alert-critical/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-alert-critical text-white';
      case 'high': return 'bg-alert-caution text-white';
      case 'normal': return 'bg-primary text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const assignedDeliveries = deliveries.filter(d => 
    ['assigned', 'picked_up', 'in_transit'].includes(d.status)
  );
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');

  const isDriver = riderInfo?.vehicle_type && ['car', 'van', 'truck'].includes(riderInfo.vehicle_type);

  return (
    <div className="space-y-4">
      {/* Rider/Driver Status Header */}
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                  {riderInfo?.rider_name?.split(' ').map(n => n[0]).join('') || 'RD'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {isDriver ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                  {riderInfo?.rider_name || 'Loading...'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {riderInfo?.rider_id || ''} • {riderInfo?.vehicle_type || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={riderInfo?.status === 'active' ? 'bg-alert-normal' : 'bg-muted'}>
                {riderInfo?.status || 'offline'}
              </Badge>
            </div>
          </div>

          {/* Status Toggle Buttons */}
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant={riderInfo?.status === 'active' ? 'default' : 'outline'}
              onClick={() => updateRiderStatus('active')}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-1" /> Go Online
            </Button>
            <Button 
              size="sm" 
              variant={riderInfo?.status === 'on_delivery' ? 'default' : 'outline'}
              onClick={() => updateRiderStatus('on_delivery')}
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-1" /> On Delivery
            </Button>
            <Button 
              size="sm" 
              variant={riderInfo?.status === 'offline' ? 'secondary' : 'outline'}
              onClick={() => updateRiderStatus('offline')}
              className="flex-1"
            >
              <PauseCircle className="w-4 h-4 mr-1" /> Go Offline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{assignedDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-alert-normal">{completedDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-alert-caution">{pendingDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="assigned" className="flex-1">
            <Bell className="w-4 h-4 mr-1" />
            My Jobs ({assignedDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex-1">
            <Package className="w-4 h-4 mr-1" />
            Available ({pendingDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Done ({completedDeliveries.length})
          </TabsTrigger>
        </TabsList>

        {/* Assigned/Active Jobs */}
        <TabsContent value="assigned" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : assignedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active deliveries</p>
                <p className="text-sm">New assignments will appear here</p>
              </CardContent>
            </Card>
          ) : (
            assignedDeliveries.map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onSelect={() => setSelectedDelivery(delivery)}
                onStatusUpdate={updateDeliveryStatus}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))
          )}
        </TabsContent>

        {/* Available Jobs */}
        <TabsContent value="available" className="space-y-3 mt-4">
          {pendingDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No available deliveries</p>
              </CardContent>
            </Card>
          ) : (
            pendingDeliveries.map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onSelect={() => setSelectedDelivery(delivery)}
                onStatusUpdate={updateDeliveryStatus}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                showAccept
              />
            ))
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No completed deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            completedDeliveries.slice(0, 10).map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onSelect={() => setSelectedDelivery(delivery)}
                onStatusUpdate={updateDeliveryStatus}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                readonly
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Delivery Detail Modal */}
      {selectedDelivery && (
        <DeliveryDetailModal 
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onStatusUpdate={updateDeliveryStatus}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}
    </div>
  );
};

export default RiderDriverApp;

// Delivery Card Component
const DeliveryCard = ({ 
  delivery, 
  onSelect, 
  onStatusUpdate,
  getStatusColor,
  getPriorityColor,
  showAccept = false,
  readonly = false
}: { 
  delivery: Delivery;
  onSelect: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  showAccept?: boolean;
  readonly?: boolean;
}) => {
  const getNextAction = () => {
    switch (delivery.status) {
      case 'assigned': return { label: 'Start Pickup', status: 'picked_up', icon: Navigation };
      case 'picked_up': return { label: 'Start Delivery', status: 'in_transit', icon: Car };
      case 'in_transit': return { label: 'Mark Delivered', status: 'delivered', icon: CheckCircle2 };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(delivery.priority || 'normal')} variant="secondary">
              {delivery.priority || 'Normal'}
            </Badge>
            <Badge className={getStatusColor(delivery.status)} variant="outline">
              {delivery.status?.replace('_', ' ')}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {delivery.tracking_number}
          </span>
        </div>

        {/* Pickup Info */}
        <div className="mb-3 p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium">Pickup</span>
          </div>
          <p className="text-sm ml-4">{delivery.sender_name}</p>
          <p className="text-xs text-muted-foreground ml-4 truncate">{delivery.sender_address}</p>
        </div>

        {/* Delivery Info */}
        <div className="mb-3 p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full bg-alert-normal" />
            <span className="font-medium">Deliver To</span>
          </div>
          <p className="text-sm ml-4">{delivery.recipient_name}</p>
          <p className="text-xs text-muted-foreground ml-4 truncate">{delivery.recipient_address}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onSelect} className="flex-1">
            <MessageSquare className="w-4 h-4 mr-1" /> Details
          </Button>
          
          {showAccept && (
            <Button 
              size="sm" 
              onClick={() => onStatusUpdate(delivery.id, 'assigned')}
              className="flex-1 bg-alert-normal hover:bg-alert-normal/90"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Accept Job
            </Button>
          )}

          {!readonly && nextAction && (
            <Button 
              size="sm" 
              onClick={() => onStatusUpdate(delivery.id, nextAction.status)}
              className="flex-1"
            >
              <nextAction.icon className="w-4 h-4 mr-1" /> {nextAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Delivery Detail Modal
const DeliveryDetailModal = ({
  delivery,
  onClose,
  onStatusUpdate,
  getStatusColor,
  getPriorityColor,
}: {
  delivery: Delivery;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Delivery Details</CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status & Tracking */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge className={getPriorityColor(delivery.priority || 'normal')}>
                {delivery.priority || 'Normal'}
              </Badge>
              <Badge className={getStatusColor(delivery.status)} variant="outline">
                {delivery.status?.replace('_', ' ')}
              </Badge>
            </div>
            <span className="font-mono text-sm">{delivery.tracking_number}</span>
          </div>

          {/* Pickup Details */}
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Pickup Location
            </h4>
            <div className="ml-5 space-y-1">
              <p className="font-medium">{delivery.sender_name}</p>
              <p className="text-sm text-muted-foreground">{delivery.sender_address}</p>
              <a 
                href={`tel:${delivery.sender_phone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="w-4 h-4" /> {delivery.sender_phone}
              </a>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alert-normal" />
              Delivery Location
            </h4>
            <div className="ml-5 space-y-1">
              <p className="font-medium">{delivery.recipient_name}</p>
              <p className="text-sm text-muted-foreground">{delivery.recipient_address}</p>
              <a 
                href={`tel:${delivery.recipient_phone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="w-4 h-4" /> {delivery.recipient_phone}
              </a>
            </div>
          </div>

          {/* Package Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Package Type</p>
              <p className="font-medium capitalize">{delivery.package_type || 'Standard'}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium text-sm">
                {format(new Date(delivery.created_at), 'dd MMM, HH:mm')}
              </p>
            </div>
          </div>

          {/* Notes */}
          {delivery.notes && (
            <div className="p-3 bg-alert-caution/10 border border-alert-caution/30 rounded-lg">
              <p className="text-xs text-alert-caution mb-1">Special Instructions</p>
              <p className="text-sm">{delivery.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.recipient_address)}`, '_blank')}
            >
              <Navigation className="w-4 h-4 mr-1" /> Navigate
            </Button>
            
            {delivery.status === 'assigned' && (
              <Button 
                className="flex-1"
                onClick={() => {
                  onStatusUpdate(delivery.id, 'picked_up');
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Confirm Pickup
              </Button>
            )}
            
            {delivery.status === 'picked_up' && (
              <Button 
                className="flex-1"
                onClick={() => {
                  onStatusUpdate(delivery.id, 'in_transit');
                  onClose();
                }}
              >
                <Car className="w-4 h-4 mr-1" /> Start Delivery
              </Button>
            )}
            
            {delivery.status === 'in_transit' && (
              <Button 
                className="flex-1 bg-alert-normal hover:bg-alert-normal/90"
                onClick={() => {
                  onStatusUpdate(delivery.id, 'delivered');
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Delivered
              </Button>
            )}
          </div>

          {/* Report Issue */}
          <Button variant="ghost" className="w-full text-alert-critical">
            <AlertCircle className="w-4 h-4 mr-1" /> Report Issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
