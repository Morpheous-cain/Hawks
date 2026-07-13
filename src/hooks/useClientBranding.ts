// Loads white-label branding for a client and applies CSS variables to the document root.
// Falls back to Black Hawk SOC-OS defaults when no branding row exists.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClientBranding = {
  client_id: string;
  display_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  contact_phone?: string | null;
  emergency_phone?: string | null;
};

// Convert "#3B82F6" -> "59 130 246" (raw RGB) for use in CSS variables.
// Tailwind tokens in this project use HSL, but per-tenant overrides only need
// to recolour a small set of presentation tokens, so a CSS-var override is fine.
function hexToRgbTriplet(hex?: string | null): string | null {
  if (!hex) return null;
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function useClientBranding(clientId?: string | null) {
  const [branding, setBranding] = useState<ClientBranding | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await (supabase as any)
        .from("client_branding")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (cancelled) return;
      const row = (data as ClientBranding | null) ?? null;
      setBranding(row);
      setLoading(false);

      // Apply CSS vars for white-label theming
      const root = document.documentElement;
      const primary = hexToRgbTriplet(row?.primary_color);
      const accent = hexToRgbTriplet(row?.accent_color);
      if (primary) root.style.setProperty("--brand-primary-rgb", primary);
      if (accent) root.style.setProperty("--brand-accent-rgb", accent);
    })();

    return () => {
      cancelled = true;
      const root = document.documentElement;
      root.style.removeProperty("--brand-primary-rgb");
      root.style.removeProperty("--brand-accent-rgb");
    };
  }, [clientId]);

  return { branding, loading };
}
