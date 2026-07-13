import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, AlertTriangle, Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: 'incident' | 'patrol' | 'attendance' | 'alarm' | 'dob';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  status?: string;
}

const NaturalLanguageSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);

    try {
      const searchTerm = `%${query.trim()}%`;
      const allResults: SearchResult[] = [];

      // Search incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .or(`description.ilike.${searchTerm},title.ilike.${searchTerm},incident_type.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(10);

      incidents?.forEach((i: any) => {
        allResults.push({
          type: 'incident',
          title: i.title || i.incident_type || 'Incident',
          description: i.description || '',
          timestamp: i.created_at,
          location: i.location,
          status: i.status,
        });
      });

      // Search attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, staff:staff_id(full_name)')
        .or(`site.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .order('check_in', { ascending: false })
        .limit(10);

      attendance?.forEach((a: any) => {
        allResults.push({
          type: 'attendance',
          title: `${a.staff?.full_name || 'Unknown'} — ${a.site}`,
          description: a.notes || `Clock ${a.check_out ? 'in/out' : 'in'}`,
          timestamp: a.check_in,
          location: a.site,
          status: a.status,
        });
      });

      // Search alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('*')
        .or(`location.ilike.${searchTerm},alarm_type.ilike.${searchTerm},outcome_notes.ilike.${searchTerm}`)
        .order('triggered_at', { ascending: false })
        .limit(10);

      alarms?.forEach((a: any) => {
        allResults.push({
          type: 'alarm',
          title: `${a.alarm_type} — ${a.alarm_number}`,
          description: a.outcome_notes || a.location,
          timestamp: a.triggered_at,
          location: a.location,
          status: a.status,
        });
      });

      // Search DOB entries
      const { data: dob } = await supabase
        .from('dob_entries')
        .select('*')
        .or(`description.ilike.${searchTerm},entry_type.ilike.${searchTerm},site_name.ilike.${searchTerm}`)
        .order('entry_time', { ascending: false })
        .limit(10);

      dob?.forEach((d: any) => {
        allResults.push({
          type: 'dob',
          title: d.entry_type || 'DOB Entry',
          description: d.description || '',
          timestamp: d.entry_time,
          location: d.site_name,
        });
      });

      // Sort by timestamp
      allResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'attendance': return <User className="w-4 h-4 text-primary" />;
      case 'alarm': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'dob': return <FileText className="w-4 h-4 text-muted-foreground" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      incident: 'Incident',
      attendance: 'Attendance',
      alarm: 'Alarm',
      dob: 'DOB',
      patrol: 'Patrol',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search incidents, patrols, attendance, alarms, DOB entries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {searched && (
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
        )}

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {results.map((result, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                {getTypeIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{result.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0">{getTypeBadge(result.type)}</Badge>
                    {result.status && (
                      <Badge variant="secondary" className="text-xs shrink-0">{result.status}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                    {result.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageSearch;
