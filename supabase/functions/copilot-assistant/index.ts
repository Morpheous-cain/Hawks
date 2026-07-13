// Black Hawk Co-Pilot — AI assistant with live read-only DB tool calling.
// The user's JWT is forwarded so RLS is enforced on every query.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Black Hawk Co-Pilot, the embedded AI assistant inside the Black Hawk SOC-OS Console (Black Hawk SOC-OS).

You have access to LIVE OPERATIONAL DATA via tools. ALWAYS use the tools when the user asks about real numbers, sites, incidents, patrols, alarms, or staff. Do not invent figures.

Your domain:
- 24/7 SOC workflows · Control Room dispatch · MDT/MRT response · Alarm triage
- DOB entries · GPS patrols · Supervision · K9 · Escorts · Investigations
- CCTV · body-cam evidence · access control · technical security
- Strategic advisory & risk forecasting (Kenyan operating environment)

Behaviour:
- Be terse, operational, professional. No fluff.
- Use bullet points for summaries.
- Advisory format: SITUATION → RISK → IMPACT → RECOMMENDED ACTION → ESCALATION.
- DOB / incident text: third person, past tense, factual only.
- When showing query results, format as a short markdown table or bullets, not raw JSON.
- If a tool returns no rows, say so plainly — do not fabricate.
- If the question is outside security operations, redirect politely.`;

// Whitelisted read-only tools (each one runs a parameterised Supabase query)
const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_open_incidents",
      description: "Returns currently open incidents. Optionally filter by client or site name (case-insensitive partial match).",
      parameters: {
        type: "object",
        properties: {
          site_or_client: { type: "string", description: "Optional partial site or client name, e.g. 'Karen', 'Westlands'" },
          limit: { type: "integer", default: 20, maximum: 50 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_alarms_24h",
      description: "Counts alarm activations in the last 24 hours, broken down by severity and trigger type.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_active_patrols",
      description: "Returns all currently active GPS / mobile patrols, with officer, vehicle, and last checkpoint.",
      parameters: { type: "object", properties: { limit: { type: "integer", default: 20 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_site_status",
      description: "Returns the operational status of a site (last patrol, open incidents, recent alarms).",
      parameters: {
        type: "object",
        properties: { site_name: { type: "string", description: "Partial site name (case-insensitive)" } },
        required: ["site_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_dob_entries",
      description: "Returns the most recent Digital Occurrence Book entries.",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "integer", default: 24, maximum: 168 },
          limit: { type: "integer", default: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "officer_on_duty_count",
      description: "Returns the count of officers currently checked-in (clocked-in attendance without check-out).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_open_advisories",
      description: "Returns active strategic advisories with severity and SLA status.",
      parameters: { type: "object", properties: { limit: { type: "integer", default: 10 } } },
    },
  },
];

async function runTool(name: string, args: Record<string, any>, supabase: any) {
  const lim = Math.min(Number(args.limit) || 20, 50);
  switch (name) {
    case "list_open_incidents": {
      let q = supabase
        .from("incidents")
        .select("id, incident_type, severity, status, location, created_at, client_id, clients(legal_name)")
        .in("status", ["open", "Open", "active", "Active", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(lim);
      if (args.site_or_client) {
        q = q.or(`location.ilike.%${args.site_or_client}%,clients.legal_name.ilike.%${args.site_or_client}%`);
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { rows: data, count: data?.length ?? 0 };
    }
    case "count_alarms_24h": {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("alarm_activations")
        .select("severity, trigger_type")
        .gte("triggered_at", since);
      if (error) return { error: error.message };
      const bySeverity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        bySeverity[r.severity ?? "unknown"] = (bySeverity[r.severity ?? "unknown"] ?? 0) + 1;
        byType[r.trigger_type ?? "unknown"] = (byType[r.trigger_type ?? "unknown"] ?? 0) + 1;
      });
      return { total: data?.length ?? 0, by_severity: bySeverity, by_type: byType };
    }
    case "list_active_patrols": {
      const { data, error } = await supabase
        .from("patrols")
        .select("id, patrol_id, status, started_at, vehicle_registration, staff(full_name)")
        .in("status", ["active", "in_progress", "Active"])
        .order("started_at", { ascending: false })
        .limit(lim);
      if (error) return { error: error.message };
      return { rows: data, count: data?.length ?? 0 };
    }
    case "get_site_status": {
      const term = String(args.site_name ?? "");
      const { data: sites } = await supabase
        .from("sites")
        .select("id, site_name, client_id, clients(legal_name)")
        .ilike("site_name", `%${term}%`)
        .limit(3);
      if (!sites || sites.length === 0) return { match: null, message: `No site matching "${term}"` };
      const site = sites[0];
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [{ count: alarms24 }, { count: openInc }, { data: lastPatrol }] = await Promise.all([
        supabase.from("alarm_activations").select("id", { count: "exact", head: true }).eq("site_id", site.id).gte("triggered_at", since),
        supabase.from("incidents").select("id", { count: "exact", head: true }).eq("site_id", site.id).in("status", ["open", "Open", "active"]),
        supabase.from("patrols").select("started_at, status").eq("site_id", site.id).order("started_at", { ascending: false }).limit(1),
      ]);
      return {
        site: site.site_name,
        client: (site as any).clients?.legal_name,
        alarms_last_24h: alarms24 ?? 0,
        open_incidents: openInc ?? 0,
        last_patrol: lastPatrol?.[0] ?? null,
      };
    }
    case "list_recent_dob_entries": {
      const hours = Math.min(Number(args.hours) || 24, 168);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("dob_entries")
        .select("entry_type, summary, severity, location, created_at, staff(full_name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(lim);
      if (error) return { error: error.message };
      return { rows: data, count: data?.length ?? 0 };
    }
    case "officer_on_duty_count": {
      const { count, error } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .is("check_out", null);
      if (error) return { error: error.message };
      return { officers_on_duty: count ?? 0 };
    }
    case "list_open_advisories": {
      const { data, error } = await supabase
        .from("strategic_advisories")
        .select("incident_id, title, severity_level, status, location, sla_breached, timestamp_detected")
        .eq("status", "Active")
        .order("timestamp_detected", { ascending: false })
        .limit(lim);
      if (error) return { error: error.message };
      return { rows: data, count: data?.length ?? 0 };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward the user's JWT so RLS is enforced.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { messages = [], context } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys = context
      ? `${SYSTEM_PROMPT}\n\nCurrent operational context provided by client:\n${String(context).slice(0, 2000)}`
      : SYSTEM_PROMPT;

    const conversation: any[] = [{ role: "system", content: sys }, ...messages.slice(-20)];

    // Allow up to 3 tool-call rounds
    for (let round = 0; round < 3; round++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversation,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });

      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        return new Response(JSON.stringify({ error: `AI gateway error ${aiResp.status}`, details: t.slice(0, 500) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await aiResp.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg) return new Response(JSON.stringify({ reply: "(no response)" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const toolCalls = msg.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return new Response(JSON.stringify({ reply: msg.content ?? "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Append assistant turn (with tool_calls) to the conversation
      conversation.push(msg);

      // Run each tool and append its result
      for (const call of toolCalls) {
        let args: any = {};
        try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* ignore */ }
        const result = await runTool(call.function?.name ?? "", args, supabase);
        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 6000),
        });
      }
    }

    return new Response(JSON.stringify({ reply: "(tool loop exhausted)" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
