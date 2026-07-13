// Public REST API surface for partners / client dashboards.
// API-key auth via X-BH-API-Key header. Read-only; returns curated, safe payloads.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bh-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const VALID_KEY = Deno.env.get("BH_PUBLIC_API_KEY") ?? "demo-key-replace-me";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "").replace(/^public-api\/?/, "");
  const key = req.headers.get("x-bh-api-key");

  if (!key || key !== VALID_KEY) return json({ error: "invalid_api_key" }, 401);

  // Routes — purposely minimal & safe; mirror real DB later.
  if (path === "v1/health") return json({ status: "ok", service: "bh-public-api", version: "1.0" });

  if (path === "v1/sites") {
    return json({
      data: [
        { id: "site_karen_hq", name: "Karen HQ", region: "Nairobi", status: "active", risk: "low" },
        { id: "site_westlands", name: "Westlands Tower", region: "Nairobi", status: "active", risk: "elevated" },
        { id: "site_industrial", name: "Industrial Park", region: "Nairobi", status: "active", risk: "high" },
      ],
    });
  }

  if (path === "v1/incidents") {
    return json({
      data: [
        { id: "INC-2025-00482", site: "Westlands Tower", type: "alarm", severity: "medium", status: "open", opened_at: new Date(Date.now() - 1800_000).toISOString() },
        { id: "INC-2025-00481", site: "Karen HQ", type: "patrol-anomaly", severity: "low", status: "closed", opened_at: new Date(Date.now() - 5400_000).toISOString() },
      ],
    });
  }

  if (path === "v1/advisories") {
    return json({
      data: [
        { id: "ASD-2025-0091", area: "CBD", level: "ELEVATED", headline: "Civil unrest near Moi Avenue — avoid 18:00–22:00.", issued_at: new Date().toISOString() },
      ],
    });
  }

  return json({ error: "not_found", path }, 404);
});
