import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package, User, MapPin, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export const DispatchBoard = () => {
  const queryClient = useQueryClient();
  const [selectedRiders, setSelectedRiders] = useState<Record<string, string>>({});

  // Fetch pending deliveries (not yet assigned)
  const { data: pendingDeliveries, isLoading: loadingDeliveries } = useQuery({
    queryKey: ['pending-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_deliveries')
        .select('*')
        .is('assigned_rider_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available riders
  const { data: availableRiders, isLoading: loadingRiders } = useQuery({
    queryKey: ['available-riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_riders')
        .select('*')
        .eq('status', 'active')
        .order('rider_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch assigned deliveries (in progress)
  const { data: assignedDeliveries } = useQuery({
    queryKey: ['assigned-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_deliveries')
        .select('*, courier_riders(*)')
        .not('assigned_rider_id', 'is', null)
        .in('status', ['assigned', 'in_transit', 'picked_up'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Assign rider mutation
  const assignRiderMutation = useMutation({
    mutationFn: async ({ deliveryId, riderId }: { deliveryId: string; riderId: string }) => {
      const { error } = await supabase
        .from('courier_deliveries')
        .update({ 
          assigned_rider_id: riderId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-deliveries'] });
      toast.success('Rider assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign rider: ' + error.message);
    }
  });

  const handleAssign = (deliveryId: string) => {
    const riderId = selectedRiders[deliveryId];
    if (!riderId) {
      toast.error('Please select a rider first');
      return;
    }
    assignRiderMutation.mutate({ deliveryId, riderId });
  };

  const handleRiderSelect = (deliveryId: string, riderId: string) => {
    setSelectedRiders(prev => ({ ...prev, [deliveryId]: riderId }));
  };

  return (
    <div className="space-y-6">
      {/* Pending Assignments Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-alert-caution" />
            Pending Assignments ({pendingDeliveries?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDeliveries ? (
            <p className="text-muted-foreground">Loading deliveries...</p>
          ) : pendingDeliveries && pendingDeliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Assign Rider</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-sm">{delivery.tracking_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{delivery.sender_name}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-[150px]">{delivery.sender_address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{delivery.recipient_name}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-[150px]">{delivery.recipient_address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={delivery.priority === 'urgent' ? 'destructive' : delivery.priority === 'express' ? 'default' : 'secondary'}>
                        {delivery.priority || 'standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(delivery.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedRiders[delivery.id] || ''}
                        onValueChange={(value) => handleRiderSelect(delivery.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRiders?.map((rider) => (
                            <SelectItem key={rider.id} value={rider.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {rider.rider_name} ({rider.vehicle_type})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => handleAssign(delivery.id)}
                        disabled={!selectedRiders[delivery.id] || assignRiderMutation.isPending}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-alert-normal" />
              <p>No pending deliveries - all jobs assigned!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Active Jobs ({assignedDeliveries?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedDeliveries && assignedDeliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedDeliveries.map((delivery: any) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-sm">{delivery.tracking_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span>{delivery.courier_riders?.rider_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{delivery.sender_name}</TableCell>
                    <TableCell className="text-sm">{delivery.recipient_name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        delivery.status === 'in_transit' ? 'default' :
                        delivery.status === 'picked_up' ? 'secondary' : 'outline'
                      }>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(delivery.updated_at), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3" />
              <p>No active jobs in progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Riders Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-alert-normal" />
            Available Riders ({availableRiders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableRiders?.map((rider) => (
              <div key={rider.id} className="p-3 bg-muted rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rider.rider_name}</p>
                    <p className="text-xs text-muted-foreground">{rider.rider_id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{rider.vehicle_type}</span>
                  <Badge variant="outline" className="text-alert-normal border-alert-normal">
                    Available
                  </Badge>
                </div>
              </div>
            ))}
            {(!availableRiders || availableRiders.length === 0) && !loadingRiders && (
              <p className="text-muted-foreground col-span-full text-center py-4">
                No riders available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
