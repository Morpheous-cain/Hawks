import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface AdvisoryFiltersProps {
  filters: {
    category: string;
    severity: string;
    status: string;
    search: string;
    timeRange: string;
  };
  onFilterChange: (filters: any) => void;
  activeCount: number;
}

const AdvisoryFilters = ({ filters, onFilterChange, activeCount }: AdvisoryFiltersProps) => {
  const clearFilters = () => {
    onFilterChange({ category: "all", severity: "all", status: "all", search: "", timeRange: "all" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search advisories..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="h-8 pl-8 text-xs bg-card/40 border-border/30"
        />
      </div>

      {/* Category */}
      <Select value={filters.category} onValueChange={(value) => onFilterChange({ ...filters, category: value })}>
        <SelectTrigger className="h-8 w-[130px] text-xs bg-card/40 border-border/30">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Traffic">Traffic</SelectItem>
          <SelectItem value="Protest">Protest</SelectItem>
          <SelectItem value="Terror">Terror</SelectItem>
          <SelectItem value="Weather">Weather</SelectItem>
          <SelectItem value="Crime">Crime</SelectItem>
        </SelectContent>
      </Select>

      {/* Severity */}
      <Select value={filters.severity} onValueChange={(value) => onFilterChange({ ...filters, severity: value })}>
        <SelectTrigger className="h-8 w-[120px] text-xs bg-card/40 border-border/30">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severity</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
          <SelectItem value="CAUTION">Caution</SelectItem>
          <SelectItem value="NORMAL">Normal</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={filters.status} onValueChange={(value) => onFilterChange({ ...filters, status: value })}>
        <SelectTrigger className="h-8 w-[120px] text-xs bg-card/40 border-border/30">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Investigating">Investigating</SelectItem>
          <SelectItem value="Resolved">Resolved</SelectItem>
          <SelectItem value="Archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Time Range */}
      <Select value={filters.timeRange} onValueChange={(value) => onFilterChange({ ...filters, timeRange: value })}>
        <SelectTrigger className="h-8 w-[110px] text-xs bg-card/40 border-border/30">
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="1h">1 Hour</SelectItem>
          <SelectItem value="6h">6 Hours</SelectItem>
          <SelectItem value="24h">24 Hours</SelectItem>
          <SelectItem value="7d">7 Days</SelectItem>
          <SelectItem value="30d">30 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground px-2">
          <X className="w-3.5 h-3.5 mr-1" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
};

export default AdvisoryFilters;
