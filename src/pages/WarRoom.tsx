/**
 * Crisis Management Centre (CMC)
 *
 * This page composes specialised sub-modules around a single live activation:
 *   - useCMC()                  → single source of truth (data + actions + realtime)
 *   - CMCActivateDialog         → tier selection + reason
 *   - CMCStandDownDialog        → controlled stand-down with summary
 *   - CMCDecisionDialog         → log Gold/Silver/Bronze command decisions
 *   - CMCDecisionLog            → real-time auditable decision feed + CSV export
 *   - CMCNotificationPanel      → executive escalation chain with SLA + ack workflow
 *   - CMCResourcePanel          → roll-call QRF / armed / K9 / medical with status cycling
 *
 * Pattern → to replicate for another command module:
 *   1) Create tables + RLS (see .lovable/pending_migrations/cmc_module.sql).
 *   2) Build a useXyz() hook owning fetch / realtime / actions.
 *   3) Compose dumb dialog + panel components reading from that hook.
 *   4) Page only wires layout + dialog open-state.
 */
import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedTimeline from "@/components/timeline/UnifiedTimeline";
import {
  ShieldAlert, Phone, Radio, Users, Siren, FileText,
  Building2, ClipboardList,
} from "lucide-react";
import { useCMC } from "@/hooks/useCMC";
import { formatDistanceToNow } from "date-fns";

import CMCActivateDialog from "@/components/cmc/CMCActivateDialog";
import CMCStandDownDialog from "@/components/cmc/CMCStandDownDialog";
import CMCDecisionDialog from "@/components/cmc/CMCDecisionDialog";
import CMCDecisionLog from "@/components/cmc/CMCDecisionLog";
import CMCNotificationPanel from "@/components/cmc/CMCNotificationPanel";
import CMCResourcePanel from "@/components/cmc/CMCResourcePanel";

const LiveMap = lazy(() => import("@/components/map/LiveMap"));

const tierLabel = (t: string) =>
  ({ tier_1: "TIER 1 — Major", tier_2: "TIER 2 — Serious", tier_3: "TIER 3 — Limited" } as any)[t] ?? t;

const WarRoom = () => {
  const navigate = useNavigate();
  const { activation, loading } = useCMC();
  const [activateOpen, setActivateOpen] = useState(false);
  const [standDownOpen, setStandDownOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const active = activation?.status === "active";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crisis Management Centre"
        description="Major-incident coordination — Gold/Silver/Bronze command, QRF status, client liaison, statutory reporting."
        icon={ShieldAlert}
      />

      {/* Activation banner */}
      <Card className={active ? "border-destructive bg-destructive/10" : "border-destructive/40 bg-destructive/5"}>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Siren className={`w-5 h-5 text-destructive ${active ? "animate-pulse" : ""}`} />
            <div>
              <div className="text-sm font-semibold">
                CMC Status:{" "}
                {loading ? (
                  <Skeleton className="inline-block w-24 h-4 align-middle" />
                ) : (
                  <span className={active ? "text-destructive" : "text-alert-normal"}>
                    {active ? `ACTIVE — ${tierLabel(activation!.tier)}` : "Standby"}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {active && activation ? (
                  <>
                    <span className="font-mono">{activation.activation_number}</span>
                    {" • "}activated {formatDistanceToNow(new Date(activation.activated_at), { addSuffix: true })}
                    {" • "}{activation.reason}
                  </>
                ) : (
                  "No active Tier-1 incident. All escalation paths tested 06:00."
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {active ? (
              <>
                <Button variant="default" size="sm" onClick={() => setDecisionOpen(true)}>
                  <ClipboardList className="w-4 h-4 mr-1" /> Log Decision
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStandDownOpen(true)}>
                  Stand Down
                </Button>
              </>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setActivateOpen(true)} disabled={loading}>
                <Siren className="w-4 h-4 mr-1" /> Activate CMC
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/sop-library")}>
              <FileText className="w-4 h-4 mr-1" /> Open SOP
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Suspense fallback={<Skeleton className="h-[460px] w-full" />}>
            <LiveMap height="460px" initialLayers={["sites", "incidents", "alarms", "officers"]} />
          </Suspense>

          {/* Command structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-amber-400" /> Gold (Strategic)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>CEO / COO — strategic intent & external authority</div>
                <Badge variant="outline" className="mt-1">{active ? "Engaged" : "Off-site"}</Badge>
              </CardContent>
            </Card>
            <Card className="border-slate-400/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-slate-300" /> Silver (Tactical)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>Ops Manager — tactical plan, resource allocation</div>
                <Badge variant="outline" className="mt-1">{active ? "On CMC Floor" : "CMC Floor"}</Badge>
              </CardContent>
            </Card>
            <Card className="border-orange-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-orange-400" /> Bronze (Operational)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>Scene Commander / QRF lead — on-ground execution</div>
                <Badge variant="outline" className="mt-1">{active ? "On-scene" : "Standby"}</Badge>
              </CardContent>
            </Card>
          </div>

          <CMCResourcePanel />
        </div>

        <div className="space-y-4">
          <UnifiedTimeline hours={6} compact />
          <CMCNotificationPanel />

          {/* External liaison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" /> External Liaison
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              {[
                { label: "Police (DCI / Kenya Police)", chip: "Hot-line" },
                { label: "EMS / Ambulance", chip: "Hot-line" },
                { label: "Fire / HAZMAT", chip: "Hot-line" },
                { label: "Regulator (PSRA)", chip: "Report ≤ 24h" },
                { label: "Client Site Lead", chip: "Direct" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span>{r.label}</span>
                  <Badge variant="outline">{r.chip}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <CMCDecisionLog onAdd={() => setDecisionOpen(true)} />
        </div>
      </div>

      <CMCActivateDialog open={activateOpen} onOpenChange={setActivateOpen} />
      <CMCStandDownDialog open={standDownOpen} onOpenChange={setStandDownOpen} />
      <CMCDecisionDialog open={decisionOpen} onOpenChange={setDecisionOpen} />
    </div>
  );
};

export default WarRoom;
