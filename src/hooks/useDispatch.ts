import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DispatchRequest = Database["public"]["Tables"]["dispatch_requests"]["Insert"];
type DispatchLog = Database["public"]["Tables"]["dispatch_logs"]["Insert"];

export const useDispatch = () => {
  const queryClient = useQueryClient();

  const createDispatchRequest = useMutation<any, Error, DispatchRequest>({ // ponytail: use specific types when types.ts regenerates.
    mutationFn: async (request) => {
      const { data, error } = await supabase
        .from("dispatch_requests")
        .insert(request)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch_requests"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] }); // Invalidate vehicles to update assignment status
    },
  });

  const createDispatchLog = useMutation<any, Error, DispatchLog>({ // ponytail: use specific types when types.ts regenerates.
    mutationFn: async (log) => {
      const { data, error } = await supabase
        .from("dispatch_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch_logs"] });
    },
  });

  return {
    createDispatchRequest: createDispatchRequest.mutateAsync,
    isCreatingDispatchRequest: createDispatchRequest.isPending,
    createDispatchLog: createDispatchLog.mutateAsync,
    isCreatingDispatchLog: createDispatchLog.isPending,
  };
};
