import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { incident_id } = await req.json();
    if (!incident_id) {
      return new Response(JSON.stringify({ error: "incident_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: inc }, { data: timeline }, { data: escalations }, { data: evidence }] =
      await Promise.all([
        supabase.from("incidents").select("*, clients(legal_name), sites(site_name), staff(full_name)").eq("id", incident_id).maybeSingle(),
        supabase.from("incident_timeline").select("*").eq("incident_id", incident_id).order("event_at", { ascending: true }),
        supabase.from("incident_escalations").select("*").eq("incident_id", incident_id).order("level", { ascending: true }),
        supabase.from("incident_evidence").select("title, evidence_type, collected_at").eq("incident_id", incident_id),
      ]);

    if (!inc) {
      return new Response(JSON.stringify({ error: "incident not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a senior Security Operations Centre commander writing a concise executive brief for the COO. Use clear, factual, military-style language. Avoid speculation. Max 180 words.

INCIDENT
- Number: ${inc.incident_number}
- Type: ${inc.incident_type} | Severity: ${inc.severity} | Status: ${inc.status}
- Title: ${inc.title}
- Location: ${inc.location} ${inc.sites?.site_name ? `(${inc.sites.site_name})` : ""}
- Client: ${inc.clients?.legal_name || "N/A"}
- Occurred: ${inc.occurred_at}
- Assigned: ${inc.staff?.full_name || "Unassigned"}
- SLA: target ${inc.sla_target_minutes ?? "?"} min, deadline ${inc.sla_deadline ?? "n/a"}, breached: ${inc.sla_breached ? "YES" : "no"}
- Description: ${inc.description || "(none provided)"}

TIMELINE (${timeline?.length ?? 0} events)
${(timeline || []).map((t) => `- [${t.event_at}] ${t.event_type}: ${t.note || JSON.stringify(t.payload || {})}`).join("\n")}

ESCALATIONS
${(escalations || []).map((e) => `- L${e.level} to ${e.escalated_to_role} (${e.acknowledged ? "ack" : "pending"}) — ${e.reason || ""}`).join("\n") || "- None"}

EVIDENCE
${(evidence || []).map((e) => `- ${e.evidence_type}: ${e.title}`).join("\n") || "- None on file"}

OUTPUT FORMAT (markdown):
**Situation:** 2-3 sentences.
**Actions Taken:** bullets.
**Current Status & Risks:** 2 sentences.
**Recommended Next Action:** 1 sentence.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You write tight executive security briefings." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${t}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const summary: string = data?.choices?.[0]?.message?.content?.trim() || "";

    await supabase.from("incidents").update({
      ai_summary: summary,
      ai_summary_at: new Date().toISOString(),
    }).eq("id", incident_id);

    await supabase.from("incident_timeline").insert({
      incident_id,
      event_type: "ai_brief_generated",
      note: "AI executive brief generated",
    });

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
