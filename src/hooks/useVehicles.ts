import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type InsertVehicle = Database["public"]["Tables"]["vehicles"]["Insert"];
type UpdateVehicle = Database["public"]["Tables"]["vehicles"]["Update"];

export const useVehicles = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<Vehicle[], Error>({ // ponytail: use specific types when types.ts regenerates. Currently using `any` for `vehicles` in DispatchFleetControl.tsx
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select('*')
        .eq("is_active", true)
        .order("callsign", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createVehicle = useMutation<Vehicle, Error, InsertVehicle>({ // ponytail: use specific types when types.ts regenerates.
    mutationFn: async (newVehicle) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(newVehicle)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const updateVehicle = useMutation<Vehicle, Error, UpdateVehicle>({ // ponytail: use specific types when types.ts regenerates.
    mutationFn: async (updatedVehicle) => {
      const { data, error } = await supabase
        .from("vehicles")
        .update(updatedVehicle)
        .eq("id", updatedVehicle.id!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  return {
    vehicles: data || [],
    isLoading,
    error,
    createVehicle: createVehicle.mutateAsync,
    updateVehicle: updateVehicle.mutateAsync,
  };
};
