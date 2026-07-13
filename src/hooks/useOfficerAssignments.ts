import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface OfficerAssignment {
  sites: string[];
  patrols: string[];
  responsibilities: string[];
  role: string;
  status: string;
}

export const useOfficerAssignments = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const currentUserId = user?.id || null;

  // Fetch officer's staff record with real-time updates
  const { data: staffRecord, refetch: refetchStaff, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-record", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      
      // First try to find by user_id in staff table
      // @ts-expect-error - Supabase types depth issue
      const { data: staffByUserId } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (staffByUserId) return staffByUserId;

      // Then try matching by profile email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", currentUserId)
        .single();

      if (profile?.email) {
        // @ts-expect-error - Supabase types depth issue
        const { data: staffByEmail } = await supabase
          .from("staff")
          .select("*")
          .eq("email", profile.email)
          .maybeSingle();
        
        if (staffByEmail) return staffByEmail;
      }

      // Return null if no matching staff record
      return null;
    },
    enabled: !!currentUserId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Real-time subscription for staff updates
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`officer-${currentUserId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'staff' }, 
        () => {
          refetchStaff();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'patrols' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['assigned-patrols'] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['assigned-dispatches'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refetchStaff, queryClient]);

  // Get officer assignments based on role
  const getModuleAccess = useCallback((role: string): string[] => {
    const roleModuleMap: Record<string, string[]> = {
      guard: ["clock", "bodycam"],
      patrol_officer: ["clock", "bodycam", "response"],
      response_officer: ["response", "bodycam"],
      supervisor: ["supervisor", "clock", "bodycam"],
      technician: ["technical"],
      k9_handler: ["k9", "clock", "bodycam"],
      escort_officer: ["escort", "bodycam"],
      investigator: ["investigation"],
      event_guard: ["events", "clock", "bodycam"],
      rider: ["courier"],
      driver: ["courier", "response"],
      qrf_team: ["response", "bodycam"],
    };

    return roleModuleMap[role] || ["clock"];
  }, []);

  // Check if officer has access to a specific module
  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    if (!staffRecord) return false;
    const role = staffRecord.duty_category || "guard";
    const allowedModules = getModuleAccess(role);
    return allowedModules.includes(moduleId);
  }, [staffRecord, getModuleAccess]);

  // Get officer's assigned sites
  const { data: assignedSites = [] } = useQuery({
    queryKey: ["assigned-sites", staffRecord?.id],
    queryFn: async () => {
      if (!staffRecord?.current_site) return [];
      return [staffRecord.current_site];
    },
    enabled: !!staffRecord,
  });

  // Get officer's assigned patrols with real-time sync
  const { data: assignedPatrols = [] } = useQuery({
    queryKey: ["assigned-patrols", staffRecord?.id],
    queryFn: async () => {
      if (!staffRecord?.id) return [];
      
      const { data } = await supabase
        .from("patrols")
        .select("*")
        .eq("guard_id", staffRecord.id)
        .in("status", ["active", "pending"]);
      
      return data || [];
    },
    enabled: !!staffRecord?.id,
    staleTime: 10000,
  });

  // Get officer's dispatch assignments with real-time sync
  const { data: assignedDispatches = [] } = useQuery({
    queryKey: ["assigned-dispatches", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      const { data } = await supabase
        .from("dispatch_requests")
        .select("*")
        .eq("requested_by", currentUserId)
        .in("status", ["pending", "approved", "dispatched"]);
      
      return data || [];
    },
    enabled: !!currentUserId,
    staleTime: 10000,
  });

  return {
    currentUserId,
    staffRecord,
    role: staffRecord?.duty_category || "guard",
    status: staffRecord?.status || "active",
    assignedSites,
    assignedPatrols,
    assignedDispatches,
    hasModuleAccess,
    getModuleAccess,
    isLoading: authLoading || staffLoading,
  };
};

export default useOfficerAssignments;
