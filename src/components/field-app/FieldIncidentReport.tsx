import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Send, Camera, MapPin, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const incidentTypes = [
  { value: "theft", label: "Theft" },
  { value: "vandalism", label: "Vandalism" },
  { value: "trespass", label: "Trespass" },
  { value: "assault", label: "Assault" },
  { value: "fire", label: "Fire" },
  { value: "medical", label: "Medical Emergency" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "property_damage", label: "Property Damage" },
  { value: "other", label: "Other" },
];

const severityLevels = [
  { value: "low", label: "Low", color: "text-blue-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "critical", label: "Critical", color: "text-red-500" },
];

interface Incident {
  id: string;
  incident_number: string;
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  status: string;
  created_at: string;
}

const FieldIncidentReport = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchIncidents();
    getCurrentLocation();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('field-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!incidentType || !severity || !location || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const incidentNumber = `INC-${format(new Date(), 'yyyyMMdd')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      
      const { error } = await supabase.from('incidents').insert([{
        incident_number: incidentNumber,
        title: `${incidentTypes.find(t => t.value === incidentType)?.label || incidentType} - ${location}`,
        incident_type: incidentType,
        severity: severity,
        location: location,
        description: description,
        status: 'reported',
        reported_by: userData.user?.id,
        occurred_at: new Date().toISOString(),
      }]);
      if (error) throw error;

      toast.success("Incident reported successfully");
      
      // Reset form
      setIncidentType("");
      setSeverity("");
      setLocation("");
      setDescription("");
      
      fetchIncidents();
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast.error("Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    const found = severityLevels.find(s => s.value === sev);
    return found?.color || "text-muted-foreground";
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      reported: "bg-blue-500/20 text-blue-500",
      investigating: "bg-amber-500/20 text-amber-500",
      resolved: "bg-green-500/20 text-green-500",
      closed: "bg-muted text-muted-foreground",
    };
    return statusColors[status] || statusColors.reported;
  };

  return (
    <div className="space-y-6">
      {/* Report Form */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Incident
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity..." />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={level.color}>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Location *
            </Label>
            <Input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter incident location"
            />
            {gpsCoords && (
              <p className="text-xs text-muted-foreground">
                GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident in detail..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
            <Button variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              Add Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No recent incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="bg-card/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {incident.incident_number}
                            </span>
                            <Badge className={getStatusBadge(incident.status)}>
                              {incident.status}
                            </Badge>
                          </div>
                          <p className="font-medium">
                            {incidentTypes.find(t => t.value === incident.incident_type)?.label || incident.incident_type}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {incident.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
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

export default FieldIncidentReport;
