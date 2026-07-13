import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Shield, Bell, MapPin, Users, FileText, 
  Truck, Building, Eye, Wrench, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  module: string;
}

const UnifiedSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const searchTerm = `%${query}%`;

    try {
      // Search incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id, incident_number, incident_type, location')
        .or(`incident_number.ilike.${searchTerm},incident_type.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(5);

      incidents?.forEach(i => searchResults.push({
        id: i.id,
        type: 'incident',
        title: i.incident_number,
        subtitle: `${i.incident_type} - ${i.location}`,
        module: 'Incidents'
      }));

      // Search alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('id, alarm_number, alarm_type, location')
        .or(`alarm_number.ilike.${searchTerm},alarm_type.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(5);

      alarms?.forEach(a => searchResults.push({
        id: a.id,
        type: 'alarm',
        title: a.alarm_number,
        subtitle: `${a.alarm_type} - ${a.location}`,
        module: 'Alarms'
      }));

      // Search staff
      const { data: staff } = await supabase
        .from('staff')
        .select('id, staff_id, full_name, department')
        .or(`staff_id.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .limit(5);

      staff?.forEach((s: any) => searchResults.push({
        id: s.id,
        type: 'staff',
        title: s.full_name,
        subtitle: `${s.staff_id} - ${s.department || 'N/A'}`,
        module: 'Staff'
      }));

      // Search clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, client_id, legal_name, sector')
        .or(`client_id.ilike.${searchTerm},legal_name.ilike.${searchTerm}`)
        .limit(5);

      clients?.forEach(c => searchResults.push({
        id: c.id,
        type: 'client',
        title: c.legal_name,
        subtitle: `${c.client_id} - ${c.sector || 'N/A'}`,
        module: 'Clients'
      }));

      // Search sites
      const { data: sites } = await supabase
        .from('sites')
        .select('id, site_name, address')
        .or(`site_name.ilike.${searchTerm},address.ilike.${searchTerm}`)
        .limit(5);

      sites?.forEach(s => searchResults.push({
        id: s.id,
        type: 'site',
        title: s.site_name,
        subtitle: s.address,
        module: 'Sites'
      }));

      // Search vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, call_sign, vehicle_type, registration_number')
        .or(`call_sign.ilike.${searchTerm},registration_number.ilike.${searchTerm}`)
        .limit(5);

      vehicles?.forEach((v: any) => searchResults.push({
        id: v.id,
        type: 'vehicle',
        title: v.call_sign,
        subtitle: `${v.vehicle_type} - ${v.registration_number}`,
        module: 'Fleet'
      }));

      // Search advisories
      const { data: advisories } = await supabase
        .from('strategic_advisories')
        .select('id, incident_id, title, category')
        .or(`incident_id.ilike.${searchTerm},title.ilike.${searchTerm}`)
        .limit(5);

      advisories?.forEach(a => searchResults.push({
        id: a.id,
        type: 'advisory',
        title: a.incident_id,
        subtitle: `${a.category} - ${a.title}`,
        module: 'Strategic'
      }));

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    }

    setIsSearching(false);
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Incidents': return <Shield className="w-4 h-4" />;
      case 'Alarms': return <Bell className="w-4 h-4" />;
      case 'Staff': return <Users className="w-4 h-4" />;
      case 'Clients': return <Building className="w-4 h-4" />;
      case 'Sites': return <MapPin className="w-4 h-4" />;
      case 'Fleet': return <Truck className="w-4 h-4" />;
      case 'Strategic': return <Eye className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="w-5 h-5 text-primary" />
          Unified Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search incidents, alarms, staff, clients, sites..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-8"
            />
            {query && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {results.length > 0 && (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-full">
                    {getModuleIcon(result.module)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{result.module}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {query && results.length === 0 && !isSearching && (
          <p className="text-center text-muted-foreground text-sm py-4">No results found</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedSearch;
