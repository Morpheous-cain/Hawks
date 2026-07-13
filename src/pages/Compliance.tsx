import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, FileWarning, Clock4, GraduationCap, FileSignature, Calendar } from "lucide-react";

const STATS = [
  { label: "Outstanding Risk Assessments", value: 7, icon: AlertTriangle, tone: "alert-caution" },
  { label: "SLA Breaches (30d)", value: 3, icon: Clock4, tone: "alert-critical" },
  { label: "Expired Certifications", value: 12, icon: GraduationCap, tone: "alert-caution" },
  { label: "Overdue Equipment Returns", value: 4, icon: FileWarning, tone: "alert-caution" },
  { label: "Contracts Renewing ≤60d", value: 5, icon: FileSignature, tone: "primary" },
  { label: "Active Compliance Items", value: 89, icon: ShieldCheck, tone: "alert-normal" },
];

const ITEMS = [
  { id: "RA-2025-021", title: "Risk Assessment overdue — Westlands Tower", owner: "Ops Manager", due: "Yesterday", status: "Overdue", level: "high" },
  { id: "CR-2025-008", title: "Contract renewal — Karen Estate", owner: "Account Manager", due: "in 12 days", status: "Action Required", level: "med" },
  { id: "CT-2025-014", title: "Cert expired: First Aid — 4 officers", owner: "Training Lead", due: "Last week", status: "Overdue", level: "high" },
  { id: "EQ-2025-099", title: "Body-cam not returned — MRT-07", owner: "Equipment Officer", due: "3 days ago", status: "Outstanding", level: "med" },
  { id: "SLA-2025-301", title: "Response SLA breach — Industrial Park", owner: "Control Room", due: "Today", status: "Investigating", level: "high" },
  { id: "AU-2025-011", title: "Quarterly DOB audit — pending sign-off", owner: "Compliance", due: "in 5 days", status: "Open", level: "low" },
];

const TONE_CLASS: Record<string, string> = {
  "alert-caution": "text-[hsl(var(--alert-caution))]",
  "alert-critical": "text-[hsl(var(--alert-critical))]",
  "alert-normal": "text-[hsl(var(--alert-normal))]",
  primary: "text-[hsl(var(--primary))]",
};

const Compliance = () => (
  <div className="space-y-6">
    <PageHeader
      title="Compliance Centre"
      description="Single-screen oversight of every compliance, audit, and SLA risk across operations."
      icon={ShieldCheck}
    />

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {STATS.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon className={`h-4 w-4 ${TONE_CLASS[tone] ?? ""}`} />
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground mt-1 leading-tight">{label}</div>
        </Card>
      ))}
    </div>

    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Action Queue</h2>
          <p className="text-xs text-muted-foreground">Items requiring management attention this week.</p>
        </div>
        <Badge variant="outline">{ITEMS.length} items</Badge>
      </div>
      <div className="divide-y divide-border/50">
        {ITEMS.map(it => (
          <div key={it.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-card/40 transition-colors text-sm">
            <span className="col-span-2 font-mono text-xs text-muted-foreground">{it.id}</span>
            <span className="col-span-5">{it.title}</span>
            <span className="col-span-2 text-xs text-muted-foreground">{it.owner}</span>
            <span className="col-span-2 text-xs">{it.due}</span>
            <span className="col-span-1">
              <Badge
                variant="outline"
                className={
                  it.level === "high"
                    ? "border-destructive/60 text-destructive"
                    : it.level === "med"
                    ? "border-[hsl(var(--alert-caution))] text-[hsl(var(--alert-caution))]"
                    : "border-border"
                }
              >
                {it.status}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default Compliance;
