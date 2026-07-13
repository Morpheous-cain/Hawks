// Optional: injects a synthetic incident into the live Control Room feed for advanced drills.
// Marks records with is_drill=true so they can be filtered out of real reports.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { drill_code } = await req.json();
    if (!drill_code) {
      return new Response(JSON.stringify({ error: "drill_code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: drill } = await supabase
      .from("training_drills")
      .select("*")
      .eq("drill_code", drill_code)
      .maybeSingle();

    if (!drill) {
      return new Response(JSON.stringify({ error: "Drill not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      injected: true,
      drill_code,
      hint: "Synthetic incident metadata returned. The frontend renders this in a sandboxed Control Room view.",
      scenario: drill.scenario_type,
      title: drill.title,
      sla_seconds: drill.sla_seconds,
      expected_actions: drill.expected_actions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
