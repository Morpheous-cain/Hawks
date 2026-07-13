// Shift rotation utility for Duty Roster Board.
// Day shift: 06:00 – 18:00. Night shift: 18:00 – 06:00.
// Pre-shift handover window: 15 minutes before each transition.

export type ShiftCode = "DAY" | "NIGHT";

export interface ShiftInfo {
  current: ShiftCode;
  currentLabel: string;       // e.g. "DAY SHIFT"
  currentWindow: string;      // e.g. "06:00 – 18:00"
  nextShift: ShiftCode;
  nextLabel: string;
  nextWindow: string;
  nextStart: Date;            // absolute time of next shift start
  msToNext: number;           // ms until nextStart
  shiftProgressPct: number;   // % of current shift elapsed (0–100)
  preShiftActive: boolean;    // true when within 15 min before next shift start
  preShiftRemainingSec: number; // seconds until handover ends (next shift starts)
}

const DAY_START_H = 6;
const NIGHT_START_H = 18;
const PRE_SHIFT_MIN = 15;

const at = (base: Date, hour: number) => {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export function getShiftInfo(now: Date = new Date()): ShiftInfo {
  const todayDayStart = at(now, DAY_START_H);
  const todayNightStart = at(now, NIGHT_START_H);
  const tomorrowDayStart = new Date(todayDayStart.getTime() + 24 * 3600 * 1000);

  let current: ShiftCode;
  let currentStart: Date;
  let nextStart: Date;

  if (now >= todayDayStart && now < todayNightStart) {
    current = "DAY";
    currentStart = todayDayStart;
    nextStart = todayNightStart;
  } else if (now >= todayNightStart) {
    current = "NIGHT";
    currentStart = todayNightStart;
    nextStart = tomorrowDayStart;
  } else {
    // before 06:00 → still on previous night shift
    current = "NIGHT";
    currentStart = new Date(todayNightStart.getTime() - 24 * 3600 * 1000);
    nextStart = todayDayStart;
  }

  const next: ShiftCode = current === "DAY" ? "NIGHT" : "DAY";
  const totalMs = nextStart.getTime() - currentStart.getTime();
  const elapsed = now.getTime() - currentStart.getTime();
  const shiftProgressPct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
  const msToNext = nextStart.getTime() - now.getTime();
  const preShiftActive = msToNext <= PRE_SHIFT_MIN * 60 * 1000 && msToNext > 0;

  return {
    current,
    currentLabel: current === "DAY" ? "DAY SHIFT" : "NIGHT SHIFT",
    currentWindow: current === "DAY" ? "06:00 – 18:00" : "18:00 – 06:00",
    nextShift: next,
    nextLabel: next === "DAY" ? "DAY SHIFT" : "NIGHT SHIFT",
    nextWindow: next === "DAY" ? "06:00 – 18:00" : "18:00 – 06:00",
    nextStart,
    msToNext,
    shiftProgressPct,
    preShiftActive,
    preShiftRemainingSec: Math.max(0, Math.floor(msToNext / 1000)),
  };
}

export const formatCountdown = (totalSec: number) => {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
};
