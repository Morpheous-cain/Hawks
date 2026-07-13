import { useState, useEffect } from "react";
import { Building2, Search, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

export interface Client {
  id: string;
  client_id: string;
  legal_name: string;
  trading_name: string | null;
  sector: string | null;
  status: string | null;
  active_sites_count: number | null;
  primary_contact_name: string | null;
}

interface ClientSelectorProps {
  value: string;
  onValueChange: (value: string, client?: Client) => void;
  label?: string;
  placeholder?: string;
  filterByStatus?: string[];
  filterBySector?: string;
  showSector?: boolean;
  showSiteCount?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const ClientSelector = ({
  value,
  onValueChange,
  label = "Select Client",
  placeholder = "Choose a client",
  filterByStatus = ['active'],
  filterBySector,
  showSector = true,
  showSiteCount = true,
  disabled = false,
  required = false,
  className = ""
}: ClientSelectorProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClients();
  }, [filterByStatus, filterBySector]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, client_id, legal_name, trading_name, sector, status, active_sites_count, primary_contact_name')
        .order('legal_name');
      
      if (filterByStatus && filterByStatus.length > 0) {
        query = query.in('status', filterByStatus);
      }
      
      if (filterBySector) {
        query = query.eq('sector', filterBySector);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setClients(data as Client[]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.trading_name && client.trading_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    client.client_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === value);

  const handleValueChange = (newValue: string) => {
    const client = clients.find(c => c.id === newValue);
    onValueChange(newValue, client);
  };

  const getSectorColor = (sector: string | null) => {
    const colors: Record<string, string> = {
      'hospitality': 'bg-amber-500/20 text-amber-600',
      'retail': 'bg-pink-500/20 text-pink-600',
      'finance': 'bg-green-500/20 text-green-600',
      'healthcare': 'bg-red-500/20 text-red-600',
      'education': 'bg-blue-500/20 text-blue-600',
      'government': 'bg-purple-500/20 text-purple-600',
      'manufacturing': 'bg-cyan-500/20 text-cyan-600',
    };
    return colors[sector?.toLowerCase() || ''] || 'bg-muted text-muted-foreground';
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
            {selectedClient && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{selectedClient.legal_name}</span>
                {showSiteCount && selectedClient.active_sites_count !== null && (
                  <span className="text-muted-foreground text-xs">
                    ({selectedClient.active_sites_count} sites)
                  </span>
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
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Clients List */}
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading clients...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No clients found
            </div>
          ) : (
            filteredClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center gap-3 py-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.legal_name}</span>
                      {showSector && client.sector && (
                        <Badge variant="outline" className={`text-xs ${getSectorColor(client.sector)}`}>
                          {client.sector}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{client.client_id}</span>
                      {showSiteCount && client.active_sites_count !== null && (
                        <>
                          <span>•</span>
                          <span>{client.active_sites_count} sites</span>
                        </>
                      )}
                      {client.primary_contact_name && (
                        <>
                          <span>•</span>
                          <Phone className="h-3 w-3" />
                          <span>{client.primary_contact_name}</span>
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

export default ClientSelector;
