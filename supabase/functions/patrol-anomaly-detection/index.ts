// Patrol & operational anomaly detection.
// Flags: missed checkpoints, unusual patrol durations, false-alarm clustering per site, abnormal cash sequences.
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const anomalies: any[] = [];

    // 1. PATROL DURATION ANOMALIES
    const { data: patrols } = await supabase
      .from("patrols")
      .select("id, patrol_id, started_at, ended_at, status, site_id, sites(site_name)")
      .gte("started_at", sevenDaysAgo)
      .not("ended_at", "is", null);

    if (patrols && patrols.length > 0) {
      // Build per-site duration history
      const bySite: Record<string, number[]> = {};
      patrols.forEach((p: any) => {
        const dur = (new Date(p.ended_at).getTime() - new Date(p.started_at).getTime()) / 60000;
        if (!Number.isFinite(dur) || dur <= 0) return;
        const key = p.site_id ?? "unknown";
        (bySite[key] ??= []).push(dur);
      });

      // Flag patrols >2σ from per-site mean
      patrols.forEach((p: any) => {
        const dur = (new Date(p.ended_at).getTime() - new Date(p.started_at).getTime()) / 60000;
        const arr = bySite[p.site_id ?? "unknown"];
        if (!arr || arr.length < 4) return;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
        const sd = Math.sqrt(variance);
        if (sd === 0) return;
        const z = (dur - mean) / sd;
        if (Math.abs(z) > 2) {
          anomalies.push({
            type: dur < mean ? "patrol_too_short" : "patrol_too_long",
            severity: Math.abs(z) > 3 ? "high" : "warning",
            patrolId: p.patrol_id,
            site: p.sites?.site_name ?? "Unknown",
            detail: `Patrol duration ${dur.toFixed(0)} min vs site mean ${mean.toFixed(0)} min (z=${z.toFixed(1)})`,
            timestamp: p.started_at,
          });
        }
      });
    }

    // 2. MISSED CHECKPOINTS — patrols with checkpoints scheduled but none scanned
    const { data: recentPatrols } = await supabase
      .from("patrols")
      .select("id, patrol_id, started_at, status, sites(site_name)")
      .gte("started_at", oneDayAgo);

    if (recentPatrols) {
      for (const p of recentPatrols) {
        const { count } = await supabase
          .from("patrol_checkpoints")
          .select("id", { count: "exact", head: true })
          .eq("patrol_id", p.id);
        if ((count ?? 0) === 0 && p.status !== "in_progress") {
          anomalies.push({
            type: "no_checkpoints_scanned",
            severity: "high",
            patrolId: p.patrol_id,
            site: (p as any).sites?.site_name ?? "Unknown",
            detail: "Patrol completed with zero checkpoint scans",
            timestamp: p.started_at,
          });
        }
      }
    }

    // 3. FALSE-ALARM CLUSTERING — sites with ≥3 alarms in 24h that all resolved as false
    const { data: alarms } = await supabase
      .from("alarm_activations")
      .select("id, site_id, severity, status, triggered_at, sites(site_name)")
      .gte("triggered_at", oneDayAgo);

    if (alarms) {
      const bySite: Record<string, any[]> = {};
      alarms.forEach((a: any) => {
        const key = a.site_id ?? "unknown";
        (bySite[key] ??= []).push(a);
      });
      Object.entries(bySite).forEach(([_, list]) => {
        if (list.length >= 3) {
          const falseCount = list.filter((a) => /false/i.test(a.status ?? "")).length;
          if (falseCount >= 3) {
            anomalies.push({
              type: "false_alarm_cluster",
              severity: falseCount >= 5 ? "critical" : "high",
              site: list[0].sites?.site_name ?? "Unknown",
              detail: `${falseCount} false alarms in 24h — likely faulty sensor or misconfigured zone`,
              timestamp: list[list.length - 1].triggered_at,
            });
          } else if (list.length >= 6) {
            anomalies.push({
              type: "alarm_storm",
              severity: "high",
              site: list[0].sites?.site_name ?? "Unknown",
              detail: `${list.length} alarms in 24h — abnormal site activity`,
              timestamp: list[list.length - 1].triggered_at,
            });
          }
        }
      });
    }

    // 4. CASH-IN-TRANSIT ANOMALY — escort missions completed unusually fast vs route mean (proxy for shortcut/risk)
    const { data: escorts } = await supabase
      .from("escort_missions")
      .select("id, started_at, completed_at, status, route_distance_km")
      .gte("started_at", sevenDaysAgo)
      .not("completed_at", "is", null);

    if (escorts && escorts.length > 5) {
      const speeds = escorts
        .map((e: any) => {
          const minutes = (new Date(e.completed_at).getTime() - new Date(e.started_at).getTime()) / 60000;
          if (!minutes || !e.route_distance_km) return null;
          return e.route_distance_km / (minutes / 60); // km/h
        })
        .filter((x): x is number => x !== null && Number.isFinite(x));
      if (speeds.length > 5) {
        const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const sd = Math.sqrt(speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length);
        escorts.forEach((e: any) => {
          const minutes = (new Date(e.completed_at).getTime() - new Date(e.started_at).getTime()) / 60000;
          if (!minutes || !e.route_distance_km) return;
          const speed = e.route_distance_km / (minutes / 60);
          if (sd > 0 && Math.abs((speed - mean) / sd) > 2.5) {
            anomalies.push({
              type: "escort_speed_anomaly",
              severity: speed > mean ? "high" : "warning",
              detail: `Escort completed at ${speed.toFixed(0)} km/h vs route mean ${mean.toFixed(0)} km/h`,
              timestamp: e.started_at,
            });
          }
        });
      }
    }

    return new Response(
      JSON.stringify({
        anomalies: anomalies.sort((a, b) => {
          const sev: Record<string, number> = { critical: 0, high: 1, warning: 2 };
          return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
        }),
        summary: `Detected ${anomalies.length} operational anomalies (patrols + alarms + escorts) over the last 7 days.`,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
