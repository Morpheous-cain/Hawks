// Shared helpers for MDT Management Console

export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export const findNearestUnits = (
  alertLat: number,
  alertLng: number,
  vehicles: any[],
  opts: { limit?: number; onlyAvailable?: boolean; avgSpeedKmh?: number } = {}
) => {
  const { limit = 3, onlyAvailable = true, avgSpeedKmh = 40 } = opts;
  return vehicles
    .filter((v) => v.last_gps_lat && v.last_gps_lng)
    .filter((v) => (onlyAvailable ? v.status === "available" : true))
    .map((v) => {
      const km = haversineKm(
        { lat: alertLat, lng: alertLng },
        { lat: Number(v.last_gps_lat), lng: Number(v.last_gps_lng) }
      );
      return { vehicle: v, km, etaMin: Math.round((km / avgSpeedKmh) * 60) };
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
};

// SLA target (minutes) per priority
export const slaTargetMinutes: Record<string, number> = {
  normal: 30,
  high: 15,
  urgent: 8,
  critical: 4,
};

export const slaStatus = (createdAt: string, priority: string, acknowledged: boolean) => {
  if (acknowledged) return { tone: "ok", label: "ACK", pct: 100 };
  const target = slaTargetMinutes[priority] ?? 30;
  const ageMin = (Date.now() - new Date(createdAt).getTime()) / 60000;
  const pct = Math.min(100, (ageMin / target) * 100);
  if (pct < 60) return { tone: "ok", label: `${Math.floor(target - ageMin)}m`, pct };
  if (pct < 100) return { tone: "warn", label: `${Math.floor(target - ageMin)}m`, pct };
  return { tone: "breach", label: `+${Math.floor(ageMin - target)}m`, pct };
};

// GPS staleness — amber >5min, red >15min
export const gpsStaleness = (lastUpdate?: string | null) => {
  if (!lastUpdate) return { tone: "red", label: "Never" };
  const ageMin = (Date.now() - new Date(lastUpdate).getTime()) / 60000;
  if (ageMin < 5) return { tone: "ok", label: `${Math.floor(ageMin)}m ago` };
  if (ageMin < 15) return { tone: "amber", label: `${Math.floor(ageMin)}m ago` };
  return { tone: "red", label: `${Math.floor(ageMin)}m ago` };
};

// Pinned units — localStorage
const PIN_KEY = "mdt_mgmt_pinned_units";
export const getPinned = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) || "[]");
  } catch {
    return [];
  }
};
export const togglePinned = (id: string) => {
  const cur = getPinned();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(PIN_KEY, JSON.stringify(next));
  return next;
};

// Dispatch templates
export const dispatchTemplates = [
  { code: "C3", label: "Respond Code 3 (Lights & Sirens)", priority: "critical", type: "dispatch" },
  { code: "C2", label: "Respond Code 2 (Priority, no sirens)", priority: "urgent", type: "dispatch" },
  { code: "C1", label: "Respond Code 1 (Routine)", priority: "high", type: "dispatch" },
  { code: "SB", label: "Standby at current location", priority: "normal", type: "update" },
  { code: "RTB", label: "Return to Base", priority: "normal", type: "dispatch" },
  { code: "PATROL", label: "Resume patrol pattern", priority: "normal", type: "dispatch" },
  { code: "MEET", label: "Rendezvous at staging point", priority: "high", type: "dispatch" },
  { code: "BOLO", label: "BOLO - Be On Look Out", priority: "high", type: "update" },
];

// Status filter chips
export const statusGroups = {
  available: ["available"],
  engaged: ["on_patrol", "en_route", "on_scene"],
  emergency: ["emergency"],
  offline: ["off_duty", "break"],
};
