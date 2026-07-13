import { Suspense, lazy, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Radio, MapPin, ClipboardList, ClipboardCheck, BarChart3 } from "lucide-react";

const SupervisionPatrol = lazy(() => import("./SupervisionPatrol"));
const PatrolCheckpoints = lazy(() => import("./PatrolCheckpoints"));
const GPSPatrolTracking = lazy(() => import("./GPSPatrolTracking"));
const GuardTourReports = lazy(() => import("./GuardTourReports"));
const PatrolIntelligence = lazy(() => import("./modules/PatrolIntelligence"));

const TABS = [
  { id: "supervision", label: "Supervision", icon: QrCode, Comp: SupervisionPatrol },
  { id: "checkpoints", label: "Checkpoints", icon: QrCode, Comp: PatrolCheckpoints },
  { id: "gps", label: "GPS Tracking", icon: Radio, Comp: GPSPatrolTracking },
  { id: "monitoring", label: "Guard Monitoring", icon: ClipboardCheck, Comp: GuardTourReports },
  { id: "tour-reports", label: "Tour Reports", icon: ClipboardList, Comp: GuardTourReports },
  { id: "intelligence", label: "Intelligence", icon: BarChart3, Comp: PatrolIntelligence },
] as const;

const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

export default function PatrolSuite() {
  const [params, setParams] = useSearchParams();
  const active = useMemo(() => {
    const t = params.get("tab");
    return TABS.find((x) => x.id === t)?.id ?? TABS[0].id;
  }, [params]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <MapPin className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Patrol Suite</h1>
          <p className="text-sm text-muted-foreground">
            Unified supervision, checkpoints, GPS, monitoring, tour reports & intelligence
          </p>
        </div>
      </header>

      <Tabs
        value={active}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList className="flex flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-4">
            <Suspense fallback={<Loader />}>
              <t.Comp />
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
