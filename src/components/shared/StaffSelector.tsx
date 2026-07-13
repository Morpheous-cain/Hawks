import { useState, useEffect } from "react";
import { User, Search, Building, Badge } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

export interface StaffMember {
  id: string;
  staff_id: string;
  full_name: string;
  position: string;
  current_site: string | null;
  current_client: string | null;
  status: string | null;
  photo_url: string | null;
  phone: string;
}

type StaffStatus = 'active' | 'deserted' | 'off_duty' | 'on_leave' | 'resigned' | 'suspended' | 'terminated' | 'transferred';

interface StaffSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  filterByStatus?: StaffStatus[];
  filterByPosition?: string[];
  filterBySite?: string;
  showBadge?: boolean;
  showAvatar?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const StaffSelector = ({
  value,
  onValueChange,
  label = "Select Officer",
  placeholder = "Choose an officer",
  filterByStatus = ['active'],
  filterByPosition,
  filterBySite,
  showBadge = true,
  showAvatar = false,
  disabled = false,
  required = false,
  className = ""
}: StaffSelectorProps) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStaffMembers();
  }, [filterByStatus, filterByPosition, filterBySite]);

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('staff')
        .select('id, staff_id, full_name, position, current_site, current_client, status, photo_url, phone')
        .order('full_name');
      
      if (filterByStatus && filterByStatus.length > 0) {
        query = query.in('status', filterByStatus);
      }
      
      if (filterByPosition && filterByPosition.length > 0) {
        query = query.in('position', filterByPosition);
      }
      
      if (filterBySite) {
        query = query.eq('current_site', filterBySite);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setStaffMembers(data as StaffMember[]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(staff => 
    staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStaff = staffMembers.find(s => s.id === value);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      'Security Guard': 'bg-blue-500/20 text-blue-600',
      'Supervisor': 'bg-purple-500/20 text-purple-600',
      'Controller': 'bg-green-500/20 text-green-600',
      'Operations Officer': 'bg-amber-500/20 text-amber-600',
      'Investigator': 'bg-red-500/20 text-red-600',
      'Technical Officer': 'bg-cyan-500/20 text-cyan-600',
      'Training Officer': 'bg-pink-500/20 text-pink-600',
    };
    return colors[position] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className={className}>
      {label && (
        <Label className="mb-1.5 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : placeholder}>
            {selectedStaff && (
              <div className="flex items-center gap-2">
                {showAvatar && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={selectedStaff.photo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedStaff.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span>{selectedStaff.full_name}</span>
                {showBadge && (
                  <BadgeUI variant="outline" className={`text-xs ml-1 ${getPositionColor(selectedStaff.position)}`}>
                    {selectedStaff.position}
                  </BadgeUI>
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
                placeholder="Search officers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Staff List */}
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading officers...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No officers found
            </div>
          ) : (
            filteredStaff.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                <div className="flex items-center gap-3 py-1">
                  {showAvatar && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={staff.photo_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10">
                        {getInitials(staff.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{staff.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge className="h-3 w-3" />
                      <span>{staff.staff_id}</span>
                      {staff.current_site && (
                        <>
                          <span>•</span>
                          <Building className="h-3 w-3" />
                          <span>{staff.current_site}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {showBadge && (
                    <BadgeUI variant="outline" className={`ml-auto text-xs ${getPositionColor(staff.position)}`}>
                      {staff.position}
                    </BadgeUI>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StaffSelector;
