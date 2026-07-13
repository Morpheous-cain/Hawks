import { useMemo } from "react";
import MissionBriefHero from "./MissionBriefHero";
import KpiTile from "./KpiTile";
import QuickActionGrid from "./QuickActionGrid";
import TacticalAlertBanner from "./TacticalAlertBanner";
import StickyTacticalBar from "./StickyTacticalBar";
import SupervisorCockpit from "./SupervisorCockpit";
import RankCockpit from "./RankCockpit";
import { getCockpitProfile } from "@/config/rankCockpitConfig";
import { getRankDashboard } from "@/config/rankDashboardConfig";
import { isModuleVisible } from "@/config/rankSidebarConfig";
import { useFieldKpis } from "@/hooks/useFieldKpis";

interface Props {
  rank: string;
  rankDisplayName: string;
  userName: string;
  staffId?: string;
  assignedSites?: any[];
  onModuleSelect: (id: string) => void;
}

export const RankDashboard = ({
  rank, rankDisplayName, userName, staffId, assignedSites = [], onModuleSelect,
}: Props) => {
  const cfg = useMemo(() => getRankDashboard(rank), [rank]);
  const { kpis } = useFieldKpis(rank, staffId);

  const primarySite = assignedSites?.[0]?.client_name || assignedSites?.[0]?.site_name || "Unassigned";

  // Supervisor gets the dedicated Sector Cockpit experience
  if (rank === "supervisor") {
    return (
      <SupervisorCockpit
        rankDisplayName={rankDisplayName}
        userName={userName}
        staffId={staffId}
        assignedSites={assignedSites}
        onModuleSelect={onModuleSelect}
      />
    );
  }

  // Generic rank cockpit (Response Officer, Technician, K9, Escort, Investigator,
  // Rider/Driver, Event Security, Control Room, Operations Officer, Training Officer)
  if (getCockpitProfile(rank)) {
    return (
      <RankCockpit
        rank={rank}
        rankDisplayName={rankDisplayName}
        userName={userName}
        staffId={staffId}
        assignedSites={assignedSites}
        onModuleSelect={onModuleSelect}
      />
    );
  }

  const visible = (acts) => acts.filter((a) => isModuleVisible(a.id, rank));

  return (
    <div className="space-y-5 pb-2">
      <MissionBriefHero
        userName={userName}
        rank={rankDisplayName}
        siteName={primarySite}
        shiftWindow="06:00 – 18:00"
        onDutyCount={kpis.onDuty ?? 0}
        threatLevel="medium"
        briefing="Maintain checkpoint cadence. Two flagged advisories in your sector — review Threat Watch."
      />

      <TacticalAlertBanner staffId={staffId} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cfg.kpis.map((k) => (
          <KpiTile
            key={k.id}
            label={k.label}
            value={kpis[k.source] ?? 0}
            unit={k.unit}
            icon={k.icon}
            tone={k.tone}
          />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operations</p>
        <QuickActionGrid actions={visible(cfg.primaryActions)} onSelect={onModuleSelect} />
      </div>

      {cfg.secondaryActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quick Tools</p>
          <QuickActionGrid actions={visible(cfg.secondaryActions)} onSelect={onModuleSelect} />
        </div>
      )}

      <StickyTacticalBar
        onPTT={() => onModuleSelect("hq_connect")}
        onCall={() => onModuleSelect("hq_connect")}
        onBackup={() => onModuleSelect("hq_connect")}
        onPanic={() => onModuleSelect("incidents")}
        onStatus={() => onModuleSelect("hq_connect")}
      />
    </div>
  );
};

export default RankDashboard;
