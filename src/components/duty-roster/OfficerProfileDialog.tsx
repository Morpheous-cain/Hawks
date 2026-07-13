import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Phone, Mail, MapPin, Radio, Shield, Award, User, Activity, Truck,
  Heart, Fingerprint, Pencil, Save, X,
} from "lucide-react";

export interface OfficerProfile {
  role: string;
  call: string;
  name: string;
  phone: string;
  location: string;
  accent: string;
}

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase();
const seed = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

const buildProfile = (p: OfficerProfile) => {
  const k = seed(p.call);
  const yrs = 3 + (k % 12);
  const perf = 78 + (k % 22);
  const incidents = 40 + (k % 120);
  return {
    employeeId: `BH-${1000 + (k % 9000)}`,
    nationalId: `2${(10000000 + (k % 89999999)).toString().slice(0, 8)}`,
    email: `${p.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "")}@blackhawk.co.ke`,
    dob: `${1980 + (k % 25)}-0${1 + (k % 9)}-${10 + (k % 18)}`,
    gender: k % 2 ? "Male" : "Female",
    bloodType: ["O+", "A+", "B+", "O-", "AB+"][k % 5],
    address: ["Karen", "Westlands", "Kilimani", "Lavington", "Runda", "Kileleshwa"][k % 6] + ", Nairobi",
    nextOfKin: ["Spouse · Jane W.", "Father · John K.", "Sister · Anne M.", "Brother · Paul O."][k % 4],
    nextOfKinPhone: `+254 7${20 + (k % 79)} ${(100000 + (k % 899999)).toString().slice(0, 6)}`,
    languages: ["English", "Swahili"].concat(k % 3 === 0 ? ["Kikuyu"] : k % 3 === 1 ? ["Luo"] : ["Kamba"]).join(", "),
    rank: ["Sergeant", "Inspector", "Chief Inspector", "Corporal", "Constable"][k % 5],
    department: ["Operations", "Control Room", "Tactical Response", "Intelligence", "K9"][k % 5],
    badgeNo: `BH-${(2000 + (k % 7999)).toString()}`,
    clearance: ["LEVEL 1 · STANDARD", "LEVEL 2 · CONFIDENTIAL", "LEVEL 3 · SECRET"][k % 3],
    yearsOfService: yrs,
    joinDate: `${2026 - yrs}-0${1 + (k % 9)}-15`,
    contractType: ["Permanent", "Contract"][k % 2],
    salary: `KES ${(45 + (k % 80))},000`,
    performance: perf,
    attendance: 90 + (k % 10),
    sla: 88 + (k % 12),
    incidentsResolved: incidents,
    patrolsCompleted: 200 + (k % 400),
    commendations: 1 + (k % 8),
    disciplinaryActions: k % 7 === 0 ? 1 : 0,
    firearmCert: `FC-${1000 + (k % 9000)}`,
    firearmExpires: "2027-08-12",
    medicalExpires: "2026-11-04",
    firstAidExpires: "2026-04-22",
    drivingClass: "BCE",
    drivingExpires: "2028-02-10",
    healthStatus: ["Fit for duty", "Fit for duty", "Light duty"][k % 3],
    activeAssignment: `${p.location} · ${["Zone Alpha", "Zone Bravo", "Zone Charlie", "Zone Delta"][k % 4]}`,
    vehicle: k % 2 ? `BRAVO-${k % 9}` : "—",
    radioChannel: ["CMD-1", "DSP-2", "PTR-N", "EMG-911"][k % 4],
    lastSeen: `${5 + (k % 50)} min ago`,
    bodyCam: `BC-${100 + (k % 900)}`,
    recentIncidents: [
      { id: `BH-INC-${2030 + (k % 20)}`, t: "Armed intrusion · Westlands", role: "Responder", status: "Resolved" },
      { id: `BH-INC-${2030 + ((k + 3) % 20)}`, t: "Perimeter breach · Karen", role: "Lead", status: "Resolved" },
      { id: `BH-INC-${2030 + ((k + 7) % 20)}`, t: "Medical · Site #44", role: "Support", status: "Closed" },
    ],
    trainingHistory: [
      { course: "Tactical Firearms Level 2", date: "2025-09-12", score: "A" },
      { course: "Crisis Negotiation", date: "2025-06-04", score: "B+" },
      { course: "First Aid & CPR", date: "2025-02-20", score: "A" },
      { course: "Counter-Surveillance", date: "2024-11-08", score: "A-" },
    ],
    auditTrail: [
      { t: "22:14", a: "Acknowledged Incident BH-INC-2041" },
      { t: "21:50", a: "Roll-call check-in confirmed" },
      { t: "19:02", a: "Shift start · Logged into Control Room" },
      { t: "Yesterday", a: "Submitted shift handover report" },
    ],
  };
};

type FullProfile = ReturnType<typeof buildProfile> & OfficerProfile;

const accentText: Record<string, string> = {
  cyan: "text-cyan-300", emerald: "text-emerald-300", amber: "text-amber-300",
  violet: "text-violet-300", blue: "text-blue-300", rose: "text-rose-300",
};
const accentRing: Record<string, string> = {
  cyan: "ring-cyan-400/40", emerald: "ring-emerald-400/40", amber: "ring-amber-400/40",
  violet: "ring-violet-400/40", blue: "ring-blue-400/40", rose: "ring-rose-400/40",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  officer: OfficerProfile | null;
}

const Field = ({
  label, value, mono, editing, onChange, type = "text",
}: { label: string; value: any; mono?: boolean; editing: boolean; onChange?: (v: string) => void; type?: string }) => (
  <div className="rounded border border-white/5 bg-black/30 px-2 py-1.5">
    <Label className="text-[9px] uppercase tracking-wider text-slate-500">{label}</Label>
    {editing && onChange ? (
      <Input
        value={value ?? ""}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-0.5 h-6 border-white/10 bg-black/40 px-1.5 py-0 text-[11px] text-slate-100 ${mono ? "font-mono" : ""}`}
      />
    ) : (
      <div className={`text-[11px] text-slate-200 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    )}
  </div>
);

const Metric = ({ label, value, tone }: { label: string; value: number | string; tone: string }) => (
  <div className="rounded border border-white/5 bg-black/30 px-2 py-1.5 text-center">
    <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`font-mono text-base font-bold text-${tone}-300`}>{value}</div>
  </div>
);

export default function OfficerProfileDialog({ open, onOpenChange, officer }: Props) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<FullProfile | null>(null);

  useEffect(() => {
    if (officer) setData({ ...officer, ...buildProfile(officer) } as FullProfile);
    setEditing(false);
  }, [officer]);

  if (!officer || !data) return null;
  const accent = data.accent;
  const set = <K extends keyof FullProfile>(k: K, v: FullProfile[K]) => setData((d) => (d ? { ...d, [k]: v } : d));

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated", { description: `${data.name} · changes saved.` });
  };

  const handleCancel = () => {
    if (officer) setData({ ...officer, ...buildProfile(officer) } as FullProfile);
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#0B1220] p-0 text-slate-200">
        <DialogHeader className="sr-only">
          <DialogTitle>{data.name} — Officer Profile</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 px-5 py-4">
          <div className="flex items-center gap-4">
            <Avatar className={`h-16 w-16 ring-2 ${accentRing[accent] ?? "ring-cyan-400/40"}`}>
              <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-base font-bold text-slate-200">
                {initials(data.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {editing ? (
                  <Input
                    value={data.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="h-7 max-w-xs border-white/10 bg-black/40 text-base font-bold text-slate-100"
                  />
                ) : (
                  <h2 className="truncate text-lg font-bold text-slate-100">{data.name}</h2>
                )}
                <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-300">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" /> ON DUTY
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className={`font-mono font-bold ${accentText[accent] ?? "text-cyan-300"}`}>{data.call}</span>
                <span>·</span>
                <span>{data.role}</span>
                <span>·</span>
                <span className="font-mono">{data.employeeId}</span>
                <span>·</span>
                <span>{data.rank} · {data.department}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{data.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{data.email}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{data.location}</span>
                <span className="flex items-center gap-1"><Radio className="h-3 w-3" />{data.radioChannel}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="h-7 bg-emerald-500/20 text-[10px] text-emerald-200 hover:bg-emerald-500/30">
                    <Save className="mr-1 h-3 w-3" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 border-white/10 text-[10px] text-slate-300">
                    <X className="mr-1 h-3 w-3" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => setEditing(true)} className="h-7 bg-cyan-500/20 text-[10px] text-cyan-200 hover:bg-cyan-500/30">
                    <Pencil className="mr-1 h-3 w-3" /> Edit Profile
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-amber-500/30 text-[10px] text-amber-300">
                    <Radio className="mr-1 h-3 w-3" /> Radio
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick metrics */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            <Metric label="Performance" value={`${data.performance}%`} tone="emerald" />
            <Metric label="Attendance" value={`${data.attendance}%`} tone="cyan" />
            <Metric label="SLA" value={`${data.sla}%`} tone="blue" />
            <Metric label="Incidents" value={data.incidentsResolved} tone="rose" />
            <Metric label="Patrols" value={data.patrolsCompleted} tone="violet" />
            <Metric label="Awards" value={data.commendations} tone="amber" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="px-5 pb-5 pt-3">
          <TabsList className="h-8 w-full justify-start gap-1 bg-black/40 p-1">
            {[
              ["overview", "Overview"], ["employment", "Employment"], ["certs", "Certifications"],
              ["operations", "Operations"], ["training", "Training"], ["audit", "Audit"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="h-6 px-2.5 text-[10px] uppercase tracking-wider data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="mt-3 h-[420px] pr-3">
            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-0 space-y-3">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  <User className="h-3 w-3" /> Bio Data
                </div>
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
                  <Field label="Full Name" value={data.name} editing={editing} onChange={(v) => set("name", v)} />
                  <Field label="Phone" value={data.phone} mono editing={editing} onChange={(v) => set("phone", v)} />
                  <Field label="Email" value={data.email} editing={editing} onChange={(v) => set("email", v)} />
                  <Field label="National ID" value={data.nationalId} mono editing={editing} onChange={(v) => set("nationalId", v)} />
                  <Field label="Date of Birth" value={data.dob} mono editing={editing} onChange={(v) => set("dob", v)} type="date" />
                  <Field label="Gender" value={data.gender} editing={editing} onChange={(v) => set("gender", v)} />
                  <Field label="Blood Type" value={data.bloodType} mono editing={editing} onChange={(v) => set("bloodType", v)} />
                  <Field label="Address" value={data.address} editing={editing} onChange={(v) => set("address", v)} />
                  <Field label="Languages" value={data.languages} editing={editing} onChange={(v) => set("languages", v)} />
                  <Field label="Next of Kin" value={data.nextOfKin} editing={editing} onChange={(v) => set("nextOfKin", v)} />
                  <Field label="NoK Phone" value={data.nextOfKinPhone} mono editing={editing} onChange={(v) => set("nextOfKinPhone", v)} />
                  <Field label="Location" value={data.location} editing={editing} onChange={(v) => set("location", v)} />
                </div>
              </div>
              <Separator className="bg-white/5" />
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  <Activity className="h-3 w-3" /> Current Status
                </div>
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                  <Field label="Active Assignment" value={data.activeAssignment} editing={editing} onChange={(v) => set("activeAssignment", v)} />
                  <Field label="Vehicle" value={data.vehicle} mono editing={editing} onChange={(v) => set("vehicle", v)} />
                  <Field label="Body Cam" value={data.bodyCam} mono editing={editing} onChange={(v) => set("bodyCam", v)} />
                  <Field label="Radio Channel" value={data.radioChannel} mono editing={editing} onChange={(v) => set("radioChannel", v)} />
                  <Field label="Health" value={data.healthStatus} editing={editing} onChange={(v) => set("healthStatus", v)} />
                  <Field label="Clearance" value={data.clearance} editing={editing} onChange={(v) => set("clearance", v)} />
                </div>
              </div>
            </TabsContent>

            {/* EMPLOYMENT */}
            <TabsContent value="employment" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
                <Field label="Badge No." value={data.badgeNo} mono editing={editing} onChange={(v) => set("badgeNo", v)} />
                <Field label="Rank" value={data.rank} editing={editing} onChange={(v) => set("rank", v)} />
                <Field label="Department" value={data.department} editing={editing} onChange={(v) => set("department", v)} />
                <Field label="Role" value={data.role} editing={editing} onChange={(v) => set("role", v)} />
                <Field label="Call Sign" value={data.call} mono editing={editing} onChange={(v) => set("call", v)} />
                <Field label="Contract" value={data.contractType} editing={editing} onChange={(v) => set("contractType", v)} />
                <Field label="Join Date" value={data.joinDate} mono editing={editing} onChange={(v) => set("joinDate", v)} type="date" />
                <Field label="Years of Service" value={data.yearsOfService} editing={editing} onChange={(v) => set("yearsOfService", Number(v) as any)} type="number" />
                <Field label="Salary Grade" value={data.salary} mono editing={editing} onChange={(v) => set("salary", v)} />
                <Field label="Clearance" value={data.clearance} editing={editing} onChange={(v) => set("clearance", v)} />
              </div>
              <Separator className="bg-white/5" />
              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Performance Indicators</div>
                {[
                  { l: "Performance Score", k: "performance" as const, v: data.performance },
                  { l: "Attendance Rate", k: "attendance" as const, v: data.attendance },
                  { l: "SLA Adherence", k: "sla" as const, v: data.sla },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{m.l}</span>
                      {editing ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={m.v}
                          onChange={(e) => set(m.k, Number(e.target.value) as any)}
                          className="h-6 w-20 border-white/10 bg-black/40 px-1.5 py-0 text-right text-[11px] text-emerald-300"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-emerald-300">{m.v}%</span>
                      )}
                    </div>
                    <Progress value={m.v} className="h-1 bg-white/5" />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* CERTIFICATIONS */}
            <TabsContent value="certs" className="mt-0 space-y-2">
              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                <Field label="Firearm Cert #" value={data.firearmCert} mono editing={editing} onChange={(v) => set("firearmCert", v)} />
                <Field label="Firearm Expires" value={data.firearmExpires} mono editing={editing} onChange={(v) => set("firearmExpires", v)} type="date" />
                <Field label="Medical Expires" value={data.medicalExpires} mono editing={editing} onChange={(v) => set("medicalExpires", v)} type="date" />
                <Field label="First Aid Expires" value={data.firstAidExpires} mono editing={editing} onChange={(v) => set("firstAidExpires", v)} type="date" />
                <Field label="Driving Class" value={data.drivingClass} editing={editing} onChange={(v) => set("drivingClass", v)} />
                <Field label="Driving Expires" value={data.drivingExpires} mono editing={editing} onChange={(v) => set("drivingExpires", v)} type="date" />
              </div>
              <Separator className="bg-white/5" />
              {[
                { icon: Shield, label: "Firearm Certificate", num: data.firearmCert, exp: data.firearmExpires, status: "Valid", tone: "emerald" },
                { icon: Heart, label: "Medical Fitness", num: "—", exp: data.medicalExpires, status: "Valid", tone: "emerald" },
                { icon: Heart, label: "First Aid & CPR", num: "—", exp: data.firstAidExpires, status: "Valid", tone: "emerald" },
                { icon: Truck, label: "Driving License", num: `Class ${data.drivingClass}`, exp: data.drivingExpires, status: "Valid", tone: "emerald" },
                { icon: Fingerprint, label: "Biometric Enrolment", num: "Active", exp: "—", status: "Active", tone: "cyan" },
                { icon: Award, label: "PSRA Security Licence", num: `PSRA-${5000 + (seed(data.call) % 9999)}`, exp: "2027-12-31", status: "Valid", tone: "emerald" },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between rounded-md border border-white/5 bg-black/30 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <c.icon className={`h-4 w-4 text-${c.tone}-300`} />
                    <div>
                      <div className="text-xs font-medium text-slate-200">{c.label}</div>
                      <div className="font-mono text-[10px] text-slate-500">{c.num}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Expires</div>
                      <div className="font-mono text-[11px] text-slate-300">{c.exp}</div>
                    </div>
                    <Badge className={`border border-${c.tone}-500/30 bg-${c.tone}-500/10 text-[9px] text-${c.tone}-300`}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* OPERATIONS */}
            <TabsContent value="operations" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
                <Metric label="Incidents Resolved" value={data.incidentsResolved} tone="rose" />
                <Metric label="Patrols" value={data.patrolsCompleted} tone="violet" />
                <Metric label="Commendations" value={data.commendations} tone="amber" />
                <Metric label="Disciplinary" value={data.disciplinaryActions} tone={data.disciplinaryActions ? "rose" : "emerald"} />
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Recent Incidents</div>
                <div className="space-y-1.5">
                  {data.recentIncidents.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded border-l-2 border-cyan-500 bg-white/[0.02] px-2.5 py-1.5">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-semibold text-slate-100">{i.id}</div>
                        <div className="truncate text-[11px] text-slate-400">{i.t}</div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <Badge variant="outline" className="border-white/10 text-slate-400">{i.role}</Badge>
                        <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">{i.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TRAINING */}
            <TabsContent value="training" className="mt-0">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-2 py-1.5">Course</th>
                    <th className="px-2 py-1.5">Date</th>
                    <th className="px-2 py-1.5">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trainingHistory.map((t) => (
                    <tr key={t.course} className="border-b border-white/[0.03]">
                      <td className="px-2 py-1.5 text-slate-200">{t.course}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-400">{t.date}</td>
                      <td className="px-2 py-1.5">
                        <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300">{t.score}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>

            {/* AUDIT */}
            <TabsContent value="audit" className="mt-0 space-y-1.5">
              {data.auditTrail.map((a, i) => (
                <div key={i} className="flex gap-2 rounded border border-white/5 bg-black/30 px-2.5 py-1.5 text-[11px]">
                  <span className="font-mono text-slate-500">{a.t}</span>
                  <span className="text-slate-300">{a.a}</span>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
