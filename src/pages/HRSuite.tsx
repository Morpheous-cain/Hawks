import { Suspense, lazy, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCog,
  CalendarDays,
  Calendar,
  UserPlus,
  ClipboardCheck,
  BarChart3,
  ShieldAlert,
} from "lucide-react";

const StaffManagement = lazy(() => import("./StaffManagement"));
const StaffScheduling = lazy(() => import("./StaffScheduling"));
const FieldOfficersManagement = lazy(() => import("./FieldOfficersManagement"));
const LeaveManagement = lazy(() => import("./LeaveManagement"));
const HRRecruitment = lazy(() => import("./hr/HRRecruitment"));
const HROnboarding = lazy(() => import("./hr/HROnboarding"));
const HRAttendance = lazy(() => import("./hr/HRAttendance"));
const HRPerformance = lazy(() => import("./hr/HRPerformance"));
const HRDisciplinary = lazy(() => import("./hr/HRDisciplinary"));

const TABS = [
  { id: "staff", label: "Staff", icon: Users, Comp: StaffManagement },
  { id: "officers", label: "Officers", icon: UserCog, Comp: FieldOfficersManagement },
  { id: "scheduling", label: "Scheduling", icon: Calendar, Comp: StaffScheduling },
  { id: "leave", label: "Leave", icon: CalendarDays, Comp: LeaveManagement },
  { id: "recruitment", label: "Recruitment", icon: UserPlus, Comp: HRRecruitment },
  { id: "onboarding", label: "Onboarding", icon: ClipboardCheck, Comp: HROnboarding },
  { id: "attendance", label: "Attendance", icon: Calendar, Comp: HRAttendance },
  { id: "performance", label: "Performance", icon: BarChart3, Comp: HRPerformance },
  { id: "disciplinary", label: "Disciplinary", icon: ShieldAlert, Comp: HRDisciplinary },
] as const;

const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

export default function HRSuite() {
  const [params, setParams] = useSearchParams();
  const active = useMemo(() => {
    const t = params.get("tab");
    return TABS.find((x) => x.id === t)?.id ?? TABS[0].id;
  }, [params]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">HR Suite</h1>
          <p className="text-sm text-muted-foreground">
            Unified people, scheduling, leave & talent lifecycle management
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
