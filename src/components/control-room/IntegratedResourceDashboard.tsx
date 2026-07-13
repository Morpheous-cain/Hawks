import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Truck, Camera, Radio, Shield, Wrench, 
  MapPin, Activity, CheckCircle, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResourceStats {
  staff: { total: number; onDuty: number; available: number };
  vehicles: { total: number; inField: number; available: number; maintenance: number };
  equipment: { total: number; operational: number; faulty: number };
  sites: { total: number; active: number; alerts: number };
  patrols: { active: number; completed: number; pending: number };
}

const IntegratedResourceDashboard = () => {
  const [resources, setResources] = useState<ResourceStats>({
    staff: { total: 0, onDuty: 0, available: 0 },
    vehicles: { total: 0, inField: 0, available: 0, maintenance: 0 },
    equipment: { total: 0, operational: 0, faulty: 0 },
    sites: { total: 0, active: 0, alerts: 0 },
    patrols: { active: 0, completed: 0, pending: 0 }
  });

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchResources = async () => {
    try {
      // Fetch staff
      const { data: staff } = await supabase.from('staff').select('status');
      const staffStats = {
        total: staff?.length || 0,
        onDuty: staff?.filter(s => s.status === 'active').length || 0,
        available: staff?.filter(s => s.status === 'active').length || 0
      };

      // Fetch vehicles
      const { data: vehicles } = await supabase.from('vehicles').select('status, is_active');
      const vehicleStats = {
        total: vehicles?.length || 0,
        inField: vehicles?.filter((v: any) => v.status === 'en_route' || v.status === 'on_scene').length || 0,
        available: vehicles?.filter((v: any) => v.status === 'available' && v.is_active).length || 0,
        maintenance: vehicles?.filter((v: any) => v.status === 'maintenance').length || 0
      };

      // Fetch equipment
      const { data: equipment } = await supabase.from('technical_equipment').select('status');
      const equipmentStats = {
        total: equipment?.length || 0,
        operational: equipment?.filter(e => e.status === 'operational').length || 0,
        faulty: equipment?.filter(e => e.status === 'faulty' || e.status === 'offline').length || 0
      };

      // Fetch sites
      const { data: sites } = await supabase.from('sites').select('id');
      const { data: activeAlarms } = await supabase
        .from('alarm_activations')
        .select('site_id')
        .in('status', ['active', 'dispatched']);
      
      const siteStats = {
        total: sites?.length || 0,
        active: sites?.length || 0,
        alerts: new Set(activeAlarms?.map(a => a.site_id)).size
      };

      // Fetch patrols
      const { data: patrols } = await supabase.from('patrols').select('status');
      const patrolStats = {
        active: patrols?.filter(p => p.status === 'active').length || 0,
        completed: patrols?.filter(p => p.status === 'completed').length || 0,
        pending: patrols?.filter(p => p.status === 'scheduled').length || 0
      };

      setResources({
        staff: staffStats,
        vehicles: vehicleStats,
        equipment: equipmentStats,
        sites: siteStats,
        patrols: patrolStats
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const resourceCards = [
    {
      title: 'Personnel',
      icon: Users,
      stats: [
        { label: 'Total', value: resources.staff.total },
        { label: 'On Duty', value: resources.staff.onDuty, color: 'text-alert-normal' },
        { label: 'Available', value: resources.staff.available, color: 'text-primary' }
      ],
      progress: resources.staff.total > 0 ? (resources.staff.onDuty / resources.staff.total) * 100 : 0
    },
    {
      title: 'Vehicles',
      icon: Truck,
      stats: [
        { label: 'Total', value: resources.vehicles.total },
        { label: 'In Field', value: resources.vehicles.inField, color: 'text-primary' },
        { label: 'Available', value: resources.vehicles.available, color: 'text-alert-normal' },
        { label: 'Maintenance', value: resources.vehicles.maintenance, color: 'text-alert-caution' }
      ],
      progress: resources.vehicles.total > 0 ? ((resources.vehicles.available + resources.vehicles.inField) / resources.vehicles.total) * 100 : 0
    },
    {
      title: 'Equipment',
      icon: Wrench,
      stats: [
        { label: 'Total', value: resources.equipment.total },
        { label: 'Operational', value: resources.equipment.operational, color: 'text-alert-normal' },
        { label: 'Faulty', value: resources.equipment.faulty, color: 'text-alert-critical' }
      ],
      progress: resources.equipment.total > 0 ? (resources.equipment.operational / resources.equipment.total) * 100 : 0
    },
    {
      title: 'Sites',
      icon: MapPin,
      stats: [
        { label: 'Total', value: resources.sites.total },
        { label: 'Active', value: resources.sites.active, color: 'text-alert-normal' },
        { label: 'With Alerts', value: resources.sites.alerts, color: 'text-alert-critical' }
      ],
      progress: resources.sites.total > 0 ? ((resources.sites.total - resources.sites.alerts) / resources.sites.total) * 100 : 0
    },
    {
      title: 'Patrols',
      icon: Shield,
      stats: [
        { label: 'Active', value: resources.patrols.active, color: 'text-primary' },
        { label: 'Completed', value: resources.patrols.completed, color: 'text-alert-normal' },
        { label: 'Pending', value: resources.patrols.pending, color: 'text-muted-foreground' }
      ],
      progress: (resources.patrols.active + resources.patrols.completed + resources.patrols.pending) > 0 
        ? (resources.patrols.completed / (resources.patrols.active + resources.patrols.completed + resources.patrols.pending)) * 100 
        : 0
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          Integrated Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {resourceCards.map((card, index) => (
            <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{card.title}</span>
              </div>
              <div className="space-y-1 mb-2">
                {card.stats.map((stat, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className={stat.color || 'text-foreground'}>{stat.value}</span>
                  </div>
                ))}
              </div>
              <Progress value={card.progress} className="h-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegratedResourceDashboard;
