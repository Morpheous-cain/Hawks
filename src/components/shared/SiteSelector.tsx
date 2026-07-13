import { useState, useEffect } from "react";
import { Building, MapPin, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

export interface Site {
  id: string;
  site_name: string;
  site_type: string | null;
  address: string;
  gps_coordinates: string | null;
  client_id: string;
  client_name?: string;
}

interface SiteSelectorProps {
  value: string;
  onValueChange: (value: string, site?: Site) => void;
  label?: string;
  placeholder?: string;
  filterByClient?: string;
  showClientName?: boolean;
  showAddress?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SiteSelector = ({
  value,
  onValueChange,
  label = "Select Site",
  placeholder = "Choose a site",
  filterByClient,
  showClientName = true,
  showAddress = false,
  disabled = false,
  required = false,
  className = ""
}: SiteSelectorProps) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSites();
  }, [filterByClient]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sites')
        .select(`
          id,
          site_name,
          site_type,
          address,
          gps_coordinates,
          client_id,
          clients (
            legal_name
          )
        `)
        .order('site_name');
      
      if (filterByClient) {
        query = query.eq('client_id', filterByClient);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        const sitesWithClientName = data.map((site: any) => ({
          id: site.id,
          site_name: site.site_name,
          site_type: site.site_type,
          address: site.address,
          gps_coordinates: site.gps_coordinates,
          client_id: site.client_id,
          client_name: site.clients?.legal_name || 'Unknown Client'
        }));
        setSites(sitesWithClientName);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter(site => 
    site.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (site.client_name && site.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSite = sites.find(s => s.id === value);

  const handleValueChange = (newValue: string) => {
    const site = sites.find(s => s.id === newValue);
    onValueChange(newValue, site);
  };

  const getSiteTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      'commercial': 'bg-blue-500/20 text-blue-600',
      'residential': 'bg-green-500/20 text-green-600',
      'industrial': 'bg-amber-500/20 text-amber-600',
      'government': 'bg-purple-500/20 text-purple-600',
      'retail': 'bg-pink-500/20 text-pink-600',
    };
    return colors[type?.toLowerCase() || ''] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className={className}>
      {label && (
        <Label className="mb-1.5 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : placeholder}>
            {selectedSite && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{selectedSite.site_name}</span>
                {showClientName && selectedSite.client_name && (
                  <span className="text-muted-foreground text-xs">({selectedSite.client_name})</span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Sites List */}
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading sites...
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No sites found
            </div>
          ) : (
            filteredSites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                <div className="flex items-center gap-3 py-1">
                  <Building className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{site.site_name}</span>
                      {site.site_type && (
                        <Badge variant="outline" className={`text-xs ${getSiteTypeColor(site.site_type)}`}>
                          {site.site_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {showClientName && site.client_name && (
                        <span>{site.client_name}</span>
                      )}
                      {showAddress && site.address && (
                        <>
                          {showClientName && <span>•</span>}
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-48">{site.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SiteSelector;
