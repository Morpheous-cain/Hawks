import { OperationalContextValue } from "./OperationalContextFields";
import { supabase } from "@/integrations/supabase/client";

/**
 * Convert operational context into a human-readable text block that can be
 * appended to existing notes/description fields without requiring schema
 * changes. Returns "" when nothing was captured.
 */
export const operationalContextToText = (ctx: OperationalContextValue): string => {
  const parts: string[] = [];
  if (ctx.geo) parts.push(`GEO: ${ctx.geo.lat.toFixed(6)},${ctx.geo.lng.toFixed(6)}${ctx.geo.accuracy ? ` (±${Math.round(ctx.geo.accuracy)}m)` : ""}`);
  if (ctx.tags.length) parts.push(`TAGS: ${ctx.tags.join(", ")}`);
  if (ctx.witnesses.length) parts.push(`WITNESSES: ${ctx.witnesses.join("; ")}`);
  if (ctx.slaMinutes) parts.push(`SLA: ${ctx.slaMinutes}min`);
  if (ctx.voiceNote) parts.push(`VOICE: ${ctx.voiceNote}`);
  if (!parts.length) return "";
  return "\n\n--- Operational Context ---\n" + parts.join("\n");
};

/**
 * Append operational text to an existing string field (notes/description).
 */
export const appendContext = (existing: string | null | undefined, ctx: OperationalContextValue): string => {
  return (existing || "") + operationalContextToText(ctx);
};

/**
 * Upload all attachments to evidence-vault under module/entity/.
 * Returns the storage paths (one per uploaded file).
 */
export const uploadContextAttachments = async (
  module: string,
  entityId: string,
  files: File[],
): Promise<string[]> => {
  const uploaded: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${module}/${entityId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("evidence-vault").upload(path, file);
    if (!error) uploaded.push(path);
  }
  return uploaded;
};
