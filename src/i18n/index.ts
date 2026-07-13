// Black Hawk SOC-OS i18n — English + Swahili. Lazy, lightweight, no extra deps.
// Usage:
//   import { useT } from "@/i18n";
//   const t = useT();
//   <span>{t("dashboard")}</span>
import { useSyncExternalStore } from "react";

export type Lang = "en" | "sw";

const STORAGE_KEY = "bh-lang";

// Flat dictionary — keep keys short and operational. Add as we go.
const dict: Record<Lang, Record<string, string>> = {
  en: {
    // common
    dashboard: "Dashboard",
    incidents: "Incidents",
    alarms: "Alarms",
    patrols: "Patrols",
    officers: "Officers",
    staff: "Staff",
    clients: "Clients",
    sites: "Sites",
    reports: "Reports",
    settings: "Settings",
    sign_in: "Sign in",
    sign_out: "Sign out",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    search: "Search",
    // operational
    open_incidents: "Open incidents",
    on_duty: "On duty",
    response_time: "Response time",
    last_patrol: "Last patrol",
    panic: "Panic",
    perimeter_breach: "Perimeter breach",
    medical: "Medical",
    fire: "Fire",
    armed_robbery: "Armed robbery",
    sla_breached: "SLA breached",
    acknowledge: "Acknowledge",
    dispatch: "Dispatch",
    escalate: "Escalate",
    // co-pilot
    copilot: "Co-Pilot",
    ask_copilot: "Ask the Co-Pilot…",
    // language
    language: "Language",
    english: "English",
    swahili: "Kiswahili",
  },
  sw: {
    // common
    dashboard: "Dashibodi",
    incidents: "Matukio",
    alarms: "Kengele",
    patrols: "Doria",
    officers: "Maafisa",
    staff: "Wafanyakazi",
    clients: "Wateja",
    sites: "Vituo",
    reports: "Ripoti",
    settings: "Mipangilio",
    sign_in: "Ingia",
    sign_out: "Toka",
    loading: "Inapakia…",
    save: "Hifadhi",
    cancel: "Ghairi",
    submit: "Wasilisha",
    search: "Tafuta",
    // operational
    open_incidents: "Matukio yaliyofunguliwa",
    on_duty: "Kazini",
    response_time: "Muda wa majibu",
    last_patrol: "Doria ya mwisho",
    panic: "Hofu",
    perimeter_breach: "Uvunjaji wa mzingo",
    medical: "Matibabu",
    fire: "Moto",
    armed_robbery: "Ujambazi wa silaha",
    sla_breached: "SLA imevunjwa",
    acknowledge: "Thibitisha",
    dispatch: "Tuma",
    escalate: "Pandisha",
    // co-pilot
    copilot: "Msaidizi",
    ask_copilot: "Uliza Msaidizi…",
    // language
    language: "Lugha",
    english: "Kiingereza",
    swahili: "Kiswahili",
  },
};

let currentLang: Lang = ((): Lang => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "sw") return stored;
  return navigator.language?.toLowerCase().startsWith("sw") ? "sw" : "en";
})();

const listeners = new Set<() => void>();

export function setLang(lang: Lang) {
  currentLang = lang;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
  listeners.forEach((l) => l());
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  return dict[currentLang][key] ?? dict.en[key] ?? key;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return currentLang;
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useT() {
  useLang(); // re-render on language change
  return t;
}
