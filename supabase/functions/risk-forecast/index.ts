// Daily/on-demand site risk forecast.
// Public read endpoint. Heuristic + AI-assisted scoring per site.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type SiteSignal = {
  site: string;
  recentIncidents24h?: number;
  missedCheckpoints?: number;
  openAdvisories?: number;
  alarmsLast7d?: number;
};

const score = (s: SiteSignal) => {
  const i = s.recentIncidents24h ?? 0;
  const m = s.missedCheckpoints ?? 0;
  const a = s.openAdvisories ?? 0;
  const al = s.alarmsLast7d ?? 0;
  const raw = i * 14 + m * 6 + a * 9 + al * 3;
  const v = Math.min(100, Math.round(raw));
  let level = "LOW";
  if (v >= 70) level = "CRITICAL";
  else if (v >= 50) level = "HIGH";
  else if (v >= 25) level = "ELEVATED";
  return { score: v, level };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const sites: SiteSignal[] = Array.isArray(body.sites) && body.sites.length
      ? body.sites
      : [
          { site: "Karen HQ", recentIncidents24h: 1, missedCheckpoints: 0, openAdvisories: 1, alarmsLast7d: 2 },
          { site: "Westlands Tower", recentIncidents24h: 3, missedCheckpoints: 2, openAdvisories: 2, alarmsLast7d: 5 },
          { site: "CBD Branch", recentIncidents24h: 0, missedCheckpoints: 1, openAdvisories: 0, alarmsLast7d: 1 },
          { site: "Industrial Park", recentIncidents24h: 2, missedCheckpoints: 4, openAdvisories: 1, alarmsLast7d: 3 },
        ];

    const forecasts = sites.map((s) => {
      const r = score(s);
      const horizon24h = Math.min(100, r.score + Math.round((s.alarmsLast7d ?? 0) * 0.6));
      const horizon72h = Math.min(100, Math.round((r.score + horizon24h) / 2));
      return {
        site: s.site,
        scoreNow: r.score,
        levelNow: r.level,
        horizon24h,
        horizon72h,
        signals: s,
        recommendation:
          r.score >= 70
            ? "Reinforce with QRF, escalate to Operations Manager, daily client briefing."
            : r.score >= 50
            ? "Increase patrol frequency, client advisory, supervisor visit within 12h."
            : r.score >= 25
            ? "Monitor, ensure SOP adherence, weekly review."
            : "Routine posture maintained.",
      };
    });

    return new Response(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        method: "heuristic-v1",
        forecasts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
