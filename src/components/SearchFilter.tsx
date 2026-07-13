import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchFilterProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: string[];
  priority: string[];
  types: string[];
}

const SearchFilter = ({ onSearchChange, onFilterChange }: SearchFilterProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    types: [],
  });

  const statusOptions = ['Active', 'Pending', 'Resolved', 'Escalated'];
  const priorityOptions = ['High', 'Medium', 'Low'];
  const typeOptions = ['Security Breach', 'Suspicious Activity', 'Access Violation', 'System Alert'];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleFilterToggle = (category: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    const index = newFilters[category].indexOf(value);
    
    if (index > -1) {
      newFilters[category].splice(index, 1);
    } else {
      newFilters[category].push(value);
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({ status: [], priority: [], types: [] });
    onFilterChange({ status: [], priority: [], types: [] });
  };

  const activeFilterCount = filters.status.length + filters.priority.length + filters.types.length;

  return (
    <Card className="p-4 border-border">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/70" />
          <Input
            placeholder="Search incidents by ID, location, or officer..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-background border-border"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-5 flex items-center justify-center p-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.status.includes(status)}
                onCheckedChange={() => handleFilterToggle('status', status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
            
            <div className="px-2 py-1.5 text-sm font-semibold mt-2">Priority</div>
            {priorityOptions.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filters.priority.includes(priority)}
                onCheckedChange={() => handleFilterToggle('priority', priority)}
              >
                {priority}
              </DropdownMenuCheckboxItem>
            ))}
            
            <div className="px-2 py-1.5 text-sm font-semibold mt-2">Type</div>
            {typeOptions.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.types.includes(type)}
                onCheckedChange={() => handleFilterToggle('types', type)}
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SearchFilter;
