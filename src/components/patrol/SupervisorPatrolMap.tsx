import { useState, useEffect } from "react";
import { MapPin, Clock, User, AlertTriangle, CheckCircle, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface OfficerLocation {
  id: string;
  name: string;
  site: string;
  lastCheckIn: string;
  distance: number;
  status: 'on_site' | 'en_route' | 'off_site' | 'unknown';
  gpsLat?: number;
  gpsLng?: number;
}

const SupervisorPatrolMap = () => {
  const [officers, setOfficers] = useState<OfficerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerLocation | null>(null);

  useEffect(() => {
    fetchOfficerLocations();
    const interval = setInterval(fetchOfficerLocations, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOfficerLocations = async () => {
    setLoading(true);
    try {
      // Fetch recent attendance with staff info
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          id,
          check_in,
          check_out,
          site,
          status,
          notes,
          staff:staff_id (
            id,
            full_name
          )
        `)
        .is('check_out', null)
        .order('check_in', { ascending: false })
        .limit(50);

      if (error) throw error;

      const officerLocations: OfficerLocation[] = (attendanceData || []).map((record: any) => {
        // Parse GPS from notes if available
        let gpsLat, gpsLng, distance = 0;
        if (record.notes) {
          const gpsMatch = record.notes.match(/GPS:\s*([-\d.]+),\s*([-\d.]+)/);
          const accuracyMatch = record.notes.match(/Accuracy:\s*(\d+)m/);
          if (gpsMatch) {
            gpsLat = parseFloat(gpsMatch[1]);
            gpsLng = parseFloat(gpsMatch[2]);
          }
          if (accuracyMatch) {
            distance = parseInt(accuracyMatch[1]);
          }
        }

        return {
          id: record.id,
          name: record.staff?.full_name || 'Unknown Officer',
          site: record.site,
          lastCheckIn: record.check_in,
          distance,
          status: record.status === 'verified' ? 'on_site' : 'unknown',
          gpsLat,
          gpsLng
        };
      });

      setOfficers(officerLocations);
    } catch (error) {
      console.error("Error fetching officer locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficers = officers.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.site.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    onSite: officers.filter(o => o.status === 'on_site').length,
    enRoute: officers.filter(o => o.status === 'en_route').length,
    offSite: officers.filter(o => o.status === 'off_site').length,
    total: officers.length
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">On Site</p>
                <p className="text-2xl font-bold">{stats.onSite}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">En Route</p>
                <p className="text-2xl font-bold">{stats.enRoute}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Off Site</p>
                <p className="text-2xl font-bold">{stats.offSite}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Placeholder */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Officer Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
              <div className="text-center z-10">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Interactive Map</p>
                <p className="text-sm text-muted-foreground">{stats.total} officers tracked</p>
              </div>
              {/* Simulated officer pins */}
              {officers.slice(0, 5).map((officer, index) => (
                <div
                  key={officer.id}
                  className={`absolute w-3 h-3 rounded-full animate-pulse cursor-pointer
                    ${officer.status === 'on_site' ? 'bg-green-500' : 'bg-amber-500'}
                  `}
                  style={{
                    left: `${20 + (index * 15)}%`,
                    top: `${30 + (index * 10)}%`
                  }}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Officer List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Officers</CardTitle>
              <Input
                placeholder="Search..."
                className="w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOfficers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No active officers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOfficers.map((officer) => (
                      <TableRow
                        key={officer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedOfficer(officer)}
                      >
                        <TableCell className="font-medium">{officer.name}</TableCell>
                        <TableCell>{officer.site}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(officer.lastCheckIn), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            officer.status === 'on_site' ? 'default' :
                            officer.status === 'en_route' ? 'secondary' : 'destructive'
                          }>
                            {officer.status === 'on_site' && `${officer.distance}m`}
                            {officer.status === 'en_route' && 'En Route'}
                            {officer.status === 'off_site' && 'Off Site'}
                            {officer.status === 'unknown' && 'Unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Selected Officer Details */}
        {selectedOfficer && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Officer Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOfficer(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{selectedOfficer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOfficer.site}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Check-in</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(selectedOfficer.lastCheckIn), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distance from Site</p>
                  <p className="font-medium">{selectedOfficer.distance}m</p>
                </div>
                {selectedOfficer.gpsLat && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">GPS Coordinates</p>
                    <p className="font-mono text-sm">
                      {selectedOfficer.gpsLat.toFixed(6)}, {selectedOfficer.gpsLng?.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Send Alert</Button>
                <Button size="sm" variant="outline">View History</Button>
                <Button size="sm" variant="outline">Contact</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupervisorPatrolMap;
