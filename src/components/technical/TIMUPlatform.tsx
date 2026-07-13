import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, MapPin, Clock, CheckCircle, AlertTriangle, 
  Phone, Camera, FileText, Send, RefreshCw,
  Settings, Zap, Shield, Bell, Navigation, Package,
  Cpu, Video, Radio, Battery, Wifi, Hammer, ClipboardList,
  Play, Pause, CheckSquare, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WorkOrder {
  id: string;
  workOrderId: string;
  type: 'installation' | 'maintenance' | 'repair' | 'inspection' | 'emergency';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  clientName: string;
  siteName: string;
  location: string;
  equipmentType: string;
  assignedAt: string;
  dueBy: string;
  estimatedHours: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  dispatcherName: string;
  checklist: { item: string; completed: boolean }[];
  partsRequired: { name: string; quantity: number; inStock: boolean }[];
}

interface TechnicianInfo {
  id: string;
  name: string;
  specialization: string;
  team: string;
  vehicleId: string;
  certifications: string[];
  currentLocation: string;
}

// Demo data
const demoTechnicianInfo: TechnicianInfo = {
  id: 'TECH-001',
  name: 'David Kimani',
  specialization: 'CCTV & Access Control',
  team: 'TIMU Alpha',
  vehicleId: 'AP-TM-01',
  certifications: ['CCTV Advanced', 'Access Control', 'Electric Fence', 'Fire Systems'],
  currentLocation: 'En Route - Westlands'
};

const demoWorkOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    workOrderId: 'WO-2024-0156',
    type: 'emergency',
    priority: 'critical',
    title: 'CCTV System Down - Complete Failure',
    description: 'All 16 cameras offline. Client reports NVR showing no signal. Immediate response required - high-value site.',
    clientName: 'Kenya Commercial Bank',
    siteName: 'KCB Towers Main Branch',
    location: 'Kencom House, Moi Avenue, Nairobi CBD',
    equipmentType: 'CCTV System',
    assignedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 60 * 60000).toISOString(),
    estimatedHours: 2,
    status: 'pending',
    dispatcherName: 'Control Room',
    checklist: [
      { item: 'Check power supply to NVR', completed: false },
      { item: 'Verify network connectivity', completed: false },
      { item: 'Inspect camera connections', completed: false },
      { item: 'Test individual camera feeds', completed: false },
      { item: 'Replace faulty components', completed: false },
      { item: 'System test and client sign-off', completed: false }
    ],
    partsRequired: [
      { name: 'Cat6 Network Cable (50m)', quantity: 1, inStock: true },
      { name: 'BNC Connectors', quantity: 10, inStock: true },
      { name: 'Power Adapter 12V 2A', quantity: 2, inStock: true }
    ]
  },
  {
    id: 'WO-002',
    workOrderId: 'WO-2024-0155',
    type: 'installation',
    priority: 'high',
    title: 'New Access Control Installation',
    description: 'Install biometric access control system at main entrance and 3 internal doors. Include integration with existing CCTV.',
    clientName: 'Safaricom PLC',
    siteName: 'Safaricom House',
    location: 'Waiyaki Way, Westlands',
    equipmentType: 'Access Control',
    assignedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 6 * 60 * 60000).toISOString(),
    estimatedHours: 6,
    status: 'in_progress',
    dispatcherName: 'Tech Supervisor',
    checklist: [
      { item: 'Site survey completed', completed: true },
      { item: 'Cable runs installed', completed: true },
      { item: 'Biometric readers mounted', completed: true },
      { item: 'Controllers wired and configured', completed: false },
      { item: 'Software setup and enrollment', completed: false },
      { item: 'Integration with CCTV verified', completed: false },
      { item: 'User training provided', completed: false },
      { item: 'Client acceptance sign-off', completed: false }
    ],
    partsRequired: [
      { name: 'Biometric Reader ZK-F18', quantity: 4, inStock: true },
      { name: 'Access Controller 4-Door', quantity: 1, inStock: true },
      { name: 'Magnetic Lock 600lb', quantity: 4, inStock: true },
      { name: 'Exit Button', quantity: 4, inStock: true },
      { name: 'Power Supply 12V 5A', quantity: 2, inStock: true }
    ]
  },
  {
    id: 'WO-003',
    workOrderId: 'WO-2024-0154',
    type: 'maintenance',
    priority: 'medium',
    title: 'Quarterly Electric Fence Maintenance',
    description: 'Scheduled preventive maintenance. Check voltage levels, inspect insulators, clear vegetation, and test alarm integration.',
    clientName: 'UN Compound',
    siteName: 'UN Office Nairobi',
    location: 'Gigiri, Nairobi',
    equipmentType: 'Electric Fence',
    assignedAt: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    estimatedHours: 4,
    status: 'accepted',
    dispatcherName: 'Maintenance Scheduler',
    checklist: [
      { item: 'Voltage test all zones', completed: false },
      { item: 'Visual inspection of wires', completed: false },
      { item: 'Check all insulators', completed: false },
      { item: 'Clear vegetation (1m clearance)', completed: false },
      { item: 'Test alarm triggers', completed: false },
      { item: 'Battery backup test', completed: false },
      { item: 'Update maintenance log', completed: false }
    ],
    partsRequired: [
      { name: 'High-Voltage Insulators', quantity: 10, inStock: true },
      { name: 'Tension Spring', quantity: 5, inStock: true },
      { name: 'Warning Signs', quantity: 4, inStock: true }
    ]
  },
  {
    id: 'WO-004',
    workOrderId: 'WO-2024-0153',
    type: 'repair',
    priority: 'high',
    title: 'Boom Barrier Motor Replacement',
    description: 'Barrier motor burnt out. Client experiencing vehicle access delays. Replacement motor in stock.',
    clientName: 'Two Rivers Mall',
    siteName: 'Two Rivers - Parking P2',
    location: 'Limuru Road, Ruaka',
    equipmentType: 'Boom Barrier',
    assignedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 3 * 60 * 60000).toISOString(),
    estimatedHours: 2,
    status: 'pending',
    dispatcherName: 'Control Room',
    checklist: [
      { item: 'Isolate power supply', completed: false },
      { item: 'Remove faulty motor', completed: false },
      { item: 'Install new motor', completed: false },
      { item: 'Reconnect and test', completed: false },
      { item: 'Calibrate open/close times', completed: false },
      { item: 'Test with access cards', completed: false }
    ],
    partsRequired: [
      { name: 'Boom Barrier Motor 24V', quantity: 1, inStock: true },
      { name: 'Motor Capacitor', quantity: 1, inStock: true },
      { name: 'Limit Switch Set', quantity: 1, inStock: false }
    ]
  },
  {
    id: 'WO-005',
    workOrderId: 'WO-2024-0152',
    type: 'inspection',
    priority: 'low',
    title: 'Annual Fire Alarm System Inspection',
    description: 'Comprehensive annual inspection and testing of fire alarm system as per fire safety regulations.',
    clientName: 'Nairobi Hospital',
    siteName: 'Nairobi Hospital Main',
    location: 'Argwings Kodhek Road',
    equipmentType: 'Fire Alarm',
    assignedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 48 * 60 * 60000).toISOString(),
    estimatedHours: 8,
    status: 'pending',
    dispatcherName: 'Compliance Manager',
    checklist: [
      { item: 'Test all smoke detectors', completed: false },
      { item: 'Test heat detectors', completed: false },
      { item: 'Test manual call points', completed: false },
      { item: 'Verify panel functionality', completed: false },
      { item: 'Test sounders and strobes', completed: false },
      { item: 'Battery backup test', completed: false },
      { item: 'Documentation and certificate', completed: false }
    ],
    partsRequired: [
      { name: 'Smoke Detector Head', quantity: 5, inStock: true },
      { name: '9V Battery', quantity: 20, inStock: true }
    ]
  }
];

export const TIMUPlatform = () => {
  const [technicianInfo] = useState<TechnicianInfo>(demoTechnicianInfo);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(demoWorkOrders);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const channel = supabase
      .channel('timu-work-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_work_orders' }, () => {
        toast({
          title: "New Work Order",
          description: "You have received a new work assignment",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <Zap className="h-4 w-4" />;
      case 'installation': return <Package className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'repair': return <Wrench className="h-4 w-4" />;
      case 'inspection': return <ClipboardList className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  const getEquipmentIcon = (type: string) => {
    if (type.toLowerCase().includes('cctv')) return <Video className="h-4 w-4" />;
    if (type.toLowerCase().includes('access')) return <Shield className="h-4 w-4" />;
    if (type.toLowerCase().includes('fence')) return <Zap className="h-4 w-4" />;
    if (type.toLowerCase().includes('fire')) return <Bell className="h-4 w-4" />;
    if (type.toLowerCase().includes('barrier')) return <Settings className="h-4 w-4" />;
    return <Cpu className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'paused': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleAcceptOrder = (order: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, status: 'accepted' } : wo
    ));
    toast({ title: "Work Order Accepted", description: `${order.workOrderId} accepted` });
  };

  const handleStartWork = (order: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, status: 'in_progress' } : wo
    ));
    toast({ title: "Work Started", description: "Timer started for this job" });
  };

  const handlePauseWork = (order: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, status: 'paused' } : wo
    ));
    toast({ title: "Work Paused", description: "Remember to log pause reason" });
  };

  const handleCompleteWork = (order: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, status: 'completed' } : wo
    ));
    setSelectedOrder(null);
    toast({ title: "Work Completed", description: "Job marked as complete" });
  };

  const handleChecklistToggle = (orderIndex: number, itemIndex: number) => {
    if (!selectedOrder) return;
    const updatedChecklist = [...selectedOrder.checklist];
    updatedChecklist[itemIndex].completed = !updatedChecklist[itemIndex].completed;
    setSelectedOrder({ ...selectedOrder, checklist: updatedChecklist });
    setWorkOrders(prev => prev.map(wo => 
      wo.id === selectedOrder.id ? { ...wo, checklist: updatedChecklist } : wo
    ));
  };

  const pendingCount = workOrders.filter(wo => wo.status === 'pending').length;
  const inProgressCount = workOrders.filter(wo => wo.status === 'in_progress').length;
  const criticalCount = workOrders.filter(wo => wo.priority === 'critical' && wo.status !== 'completed').length;

  const getChecklistProgress = (order: WorkOrder) => {
    const completed = order.checklist.filter(item => item.completed).length;
    return Math.round((completed / order.checklist.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Technician Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {technicianInfo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{technicianInfo.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>{technicianInfo.specialization}</span>
                  <span>•</span>
                  <span>{technicianInfo.team}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{technicianInfo.currentLocation}</span>
                  <span>•</span>
                  <span>Vehicle: {technicianInfo.vehicleId}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Radio className="h-4 w-4 mr-2" />
                Radio
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call Dispatch
              </Button>
            </div>
          </div>
          {/* Certifications */}
          <div className="flex flex-wrap gap-1 mt-3">
            {technicianInfo.certifications.map((cert, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cert}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className={pendingCount > 0 ? 'border-amber-500/50 bg-amber-500/10' : ''}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending Jobs</div>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-destructive/50 bg-destructive/10 animate-pulse' : ''}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className={inProgressCount > 0 ? 'border-primary/50 bg-primary/10' : ''}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">
              {workOrders.filter(wo => wo.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="orders" className="relative">
            <ClipboardList className="h-4 w-4 mr-2" />
            Work Orders
            {pendingCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="actions">
            <Wrench className="h-4 w-4 mr-2" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="h-4 w-4 mr-2" />
            Job History
          </TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orders List */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Assigned Work Orders</CardTitle>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <div className="space-y-2">
                    {workOrders
                      .sort((a, b) => {
                        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                        const statusOrder = { pending: 0, in_progress: 1, accepted: 2, paused: 3, completed: 4, cancelled: 5 };
                        if (statusOrder[a.status] !== statusOrder[b.status]) {
                          return statusOrder[a.status] - statusOrder[b.status];
                        }
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((order) => (
                        <Card 
                          key={order.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedOrder?.id === order.id ? 'border-primary ring-1 ring-primary' : ''
                          } ${order.priority === 'critical' && order.status !== 'completed' ? 'border-destructive/50' : ''}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <div className={`p-1.5 rounded ${getPriorityColor(order.priority)}`}>
                                  {getTypeIcon(order.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground">{order.workOrderId}</span>
                                    {getEquipmentIcon(order.equipmentType)}
                                  </div>
                                  <div className="font-medium text-sm truncate">{order.title}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{order.clientName} - {order.siteName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                                      {order.status.replace('_', ' ')}
                                    </Badge>
                                    {order.status === 'in_progress' && (
                                      <div className="flex-1">
                                        <Progress value={getChecklistProgress(order)} className="h-1" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Order Detail */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Work Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(selectedOrder.priority)}>
                            {selectedOrder.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{selectedOrder.type}</Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getEquipmentIcon(selectedOrder.equipmentType)}
                            {selectedOrder.equipmentType}
                          </Badge>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">{selectedOrder.workOrderId}</div>
                        <h3 className="font-semibold text-lg mt-1">{selectedOrder.title}</h3>
                      </div>

                      {/* Description */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{selectedOrder.description}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Client</div>
                          <div className="font-medium">{selectedOrder.clientName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Site</div>
                          <div className="font-medium">{selectedOrder.siteName}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-xs">Location</div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            {selectedOrder.location}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Due By</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            {new Date(selectedOrder.dueBy).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Est. Hours</div>
                          <div className="mt-1">{selectedOrder.estimatedHours}h</div>
                        </div>
                      </div>

                      {/* Checklist */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Work Checklist</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedOrder.checklist.filter(i => i.completed).length}/{selectedOrder.checklist.length}
                          </div>
                        </div>
                        <Progress value={getChecklistProgress(selectedOrder)} className="h-2 mb-2" />
                        <div className="space-y-1">
                          {selectedOrder.checklist.map((item, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                                item.completed ? 'text-muted-foreground line-through' : ''
                              }`}
                              onClick={() => handleChecklistToggle(workOrders.findIndex(wo => wo.id === selectedOrder.id), idx)}
                            >
                              {item.completed ? (
                                <CheckSquare className="h-4 w-4 text-green-500" />
                              ) : (
                                <div className="h-4 w-4 border rounded" />
                              )}
                              <span className="text-sm">{item.item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Parts Required */}
                      <div>
                        <div className="text-sm font-medium mb-2">Parts Required</div>
                        <div className="space-y-1">
                          {selectedOrder.partsRequired.map((part, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                              <span>{part.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">x{part.quantity}</span>
                                {part.inStock ? (
                                  <Badge variant="outline" className="bg-green-500/20 text-green-400 text-xs">In Stock</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-destructive/20 text-destructive text-xs">Out of Stock</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add work notes, findings, or issues..."
                          value={workNotes}
                          onChange={(e) => setWorkNotes(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Send className="h-4 w-4 mr-2" />
                            Send Update
                          </Button>
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t">
                        {selectedOrder.status === 'pending' && (
                          <Button className="flex-1" onClick={() => handleAcceptOrder(selectedOrder)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Job
                          </Button>
                        )}
                        {selectedOrder.status === 'accepted' && (
                          <Button className="flex-1" onClick={() => handleStartWork(selectedOrder)}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Work
                          </Button>
                        )}
                        {selectedOrder.status === 'in_progress' && (
                          <>
                            <Button variant="outline" onClick={() => handlePauseWork(selectedOrder)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompleteWork(selectedOrder)}
                              disabled={getChecklistProgress(selectedOrder) < 100}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete Job
                            </Button>
                          </>
                        )}
                        {selectedOrder.status === 'paused' && (
                          <Button className="flex-1" onClick={() => handleStartWork(selectedOrder)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Work
                          </Button>
                        )}
                        <Button variant="outline">
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a work order to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">CCTV</div>
                    <div className="text-sm text-muted-foreground">12 items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Access Control</div>
                    <div className="text-sm text-muted-foreground">8 items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Electric Fence</div>
                    <div className="text-sm text-muted-foreground">15 items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Hammer className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Tools</div>
                    <div className="text-sm text-muted-foreground">Complete kit</div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Vehicle Status</span>
                  <Badge className="bg-green-500/20 text-green-400">Ready</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-green-500" />
                    <span>Battery: Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>GPS: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-green-500" />
                    <span>Radio: Connected</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Camera className="h-6 w-6" />
              <span>Photo Report</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Service Report</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Package className="h-6 w-6" />
              <span>Request Parts</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Report Issue</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Radio className="h-6 w-6" />
              <span>Call Dispatch</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Zap className="h-6 w-6" />
              <span>Emergency</span>
            </Button>
          </div>
        </TabsContent>

        {/* Job History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs - This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">Jobs Completed</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">32h</div>
                  <div className="text-xs text-muted-foreground">Total Hours</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-xs text-muted-foreground">SLA Compliance</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">4.8</div>
                  <div className="text-xs text-muted-foreground">Client Rating</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
                <Button variant="outline" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Timesheet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TIMUPlatform;
