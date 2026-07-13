// Evidence Vault: issues a short-lived signed URL for a body-cam clip and logs the access.
// Requires the user to be authenticated; the JWT is validated and the access is recorded.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Authenticate user
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clip_id, reason, access_type = "view", ttl_seconds = 300 } = await req.json();
    if (!clip_id) {
      return new Response(JSON.stringify({ error: "clip_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Lookup clip with the USER client so RLS applies
    const { data: clip, error: clipErr } = await userClient
      .from("body_cam_clips")
      .select("id, storage_path, clip_url, evidence_id, locked_as_evidence")
      .eq("id", clip_id)
      .maybeSingle();

    if (clipErr || !clip) {
      return new Response(JSON.stringify({ error: "Clip not found or access denied" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const path = clip.storage_path ?? clip.clip_url;
    if (!path) {
      return new Response(JSON.stringify({ error: "Clip has no storage_path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate signed URL with the service-role client
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const ttl = Math.min(Math.max(Number(ttl_seconds) || 300, 30), 3600);
    const { data: signed, error: signErr } = await adminClient
      .storage
      .from("evidence-vault")
      .createSignedUrl(path, ttl);

    if (signErr) {
      return new Response(JSON.stringify({ error: signErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Log the access (best-effort — do not fail if logging breaks)
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
    try {
      await adminClient.from("evidence_access_log").insert({
        clip_id,
        accessed_by: user.id,
        access_type,
        ip_address: req.headers.get("x-forwarded-for") ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
        signed_url_expires_at: expires_at,
        reason: reason ?? null,
      });
    } catch (_) { /* ignore log errors */ }

    return new Response(
      JSON.stringify({
        signed_url: signed.signedUrl,
        expires_at,
        evidence_id: clip.evidence_id,
        locked_as_evidence: clip.locked_as_evidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
