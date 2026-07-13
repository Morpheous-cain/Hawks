/**
 * DailyOfficerInspection
 * ----------------------
 * Lets a supervisor run a structured daily check on every officer in their team.
 *
 * Architectural pattern (reusable for other modules):
 *   1. Local typed state holds the per-officer checklist (Record<officerId, Result>)
 *   2. A pure CHECKLIST array drives the rendered controls (data → UI, not UI → data)
 *   3. Handlers are small, single-purpose, and all return early on invalid input
 *   4. Submission is mocked via toast today, but the `persist()` seam is the single
 *      place to wire Supabase (insert into `officer_daily_inspections` later).
 *
 * To replicate for a new "X daily check" module, copy this file and only change:
 *   - the CHECKLIST constant
 *   - the persist() body (table name / payload shape)
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, ClipboardCheck, ShieldCheck, AlertOctagon, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface InspectionOfficer {
  id: string;
  name: string;
  assignedSite: string;
  role: string;
}

type CheckId =
  | "punctual"
  | "uniform"
  | "id_visible"
  | "radio_working"
  | "alert"
  | "post_knowledge"
  | "briefing_ack"
  | "site_clean";

const CHECKLIST: { id: CheckId; label: string; weight: number }[] = [
  { id: "punctual",       label: "Reported on time",                weight: 15 },
  { id: "uniform",        label: "Full uniform & presentable",      weight: 15 },
  { id: "id_visible",     label: "ID / appointment card visible",   weight: 10 },
  { id: "radio_working",  label: "Radio tested & working",          weight: 10 },
  { id: "alert",          label: "Alert & attentive on post",       weight: 15 },
  { id: "post_knowledge", label: "Knows post orders & SOPs",        weight: 15 },
  { id: "briefing_ack",   label: "Acknowledged shift briefing",     weight: 10 },
  { id: "site_clean",     label: "Post / sentry box in order",      weight: 10 },
];

type Outcome = "pass" | "warn" | "fail";
interface Result {
  checks: Record<CheckId, boolean>;
  notes: string;
  outcome: Outcome;
  submittedAt?: string;
}

const emptyResult = (): Result => ({
  checks: CHECKLIST.reduce((acc, c) => ({ ...acc, [c.id]: false }), {} as Record<CheckId, boolean>),
  notes: "",
  outcome: "pass",
});

const scoreOf = (r: Result) =>
  CHECKLIST.reduce((sum, c) => sum + (r.checks[c.id] ? c.weight : 0), 0);

const gradeOf = (score: number) =>
  score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

interface Props {
  officers: InspectionOfficer[];
  supervisorName: string;
}

export default function DailyOfficerInspection({ officers, supervisorName }: Props) {
  const [results, setResults] = useState<Record<string, Result>>(() =>
    officers.reduce((acc, o) => ({ ...acc, [o.id]: emptyResult() }), {}),
  );
  const [activeId, setActiveId] = useState<string>(officers[0]?.id ?? "");

  const active = officers.find((o) => o.id === activeId);
  const activeResult = results[activeId] ?? emptyResult();

  /** Toggle a single checklist row for the current officer */
  const toggleCheck = (cid: CheckId, value: boolean) => {
    if (!active) return;
    setResults((prev) => ({
      ...prev,
      [active.id]: { ...prev[active.id], checks: { ...prev[active.id].checks, [cid]: value } },
    }));
  };

  /** Persistence seam — swap this body for a Supabase insert when ready */
  const persist = async (officerId: string, payload: Result) => {
    // Example future wiring:
    // await supabase.from("officer_daily_inspections").insert({
    //   officer_id: officerId, supervisor_name: supervisorName, ...payload,
    // });
    console.info("[Inspection] persist", { officerId, supervisorName, payload });
  };

  const handleSubmit = async () => {
    if (!active) return;
    const score = scoreOf(activeResult);
    const payload: Result = { ...activeResult, submittedAt: new Date().toISOString() };
    await persist(active.id, payload);
    setResults((prev) => ({ ...prev, [active.id]: payload }));
    toast({
      title: `Inspection saved · ${active.name}`,
      description: `Score ${score}/100 (${gradeOf(score)}) — outcome: ${payload.outcome.toUpperCase()}`,
    });
  };

  const handleReset = () => {
    if (!active) return;
    setResults((prev) => ({ ...prev, [active.id]: emptyResult() }));
    toast({ title: "Checklist reset", description: `${active.name}'s checks cleared.` });
  };

  /** Summary numbers for the supervisor's roll-up bar */
  const summary = useMemo(() => {
    const done = Object.values(results).filter((r) => r.submittedAt).length;
    const failed = Object.values(results).filter((r) => r.submittedAt && r.outcome === "fail").length;
    const avg = (() => {
      const submitted = Object.values(results).filter((r) => r.submittedAt);
      if (!submitted.length) return 0;
      return Math.round(submitted.reduce((s, r) => s + scoreOf(r), 0) / submitted.length);
    })();
    return { done, failed, avg, total: officers.length };
  }, [results, officers.length]);

  if (!active) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No officers assigned to this supervisor yet.
        </CardContent>
      </Card>
    );
  }

  const score = scoreOf(activeResult);
  const grade = gradeOf(score);

  return (
    <div className="space-y-4">
      {/* Roll-up bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold">{summary.done}/{summary.total}</div>
          <div className="text-xs text-muted-foreground">Inspected today</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.avg}</div>
          <div className="text-xs text-muted-foreground">Avg score</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-destructive">{summary.failed}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold">{Math.max(0, summary.total - summary.done)}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Officer list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Officers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[420px] pr-2">
              <div className="space-y-1.5">
                {officers.map((o) => {
                  const r = results[o.id];
                  const submitted = !!r?.submittedAt;
                  const s = r ? scoreOf(r) : 0;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setActiveId(o.id)}
                      className={`w-full text-left p-2 rounded-md border transition-colors ${
                        activeId === o.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {o.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{o.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{o.assignedSite}</div>
                        </div>
                        {submitted ? (
                          <Badge variant="outline" className="text-[10px]">
                            {s}·{gradeOf(s)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Checklist editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {active.name} <span className="text-xs text-muted-foreground">· {active.assignedSite}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="text-xs">{score}/100</Badge>
                <Badge variant={grade === "F" ? "destructive" : "outline"} className="text-xs">
                  Grade {grade}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={activeResult.checks[c.id]}
                    onCheckedChange={(v) => toggleCheck(c.id, !!v)}
                  />
                  <span className="text-sm flex-1">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">{c.weight}pt</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div className="sm:col-span-2">
                <Textarea
                  placeholder="Supervisor notes (corrective actions, observations, follow-ups)…"
                  value={activeResult.notes}
                  onChange={(e) =>
                    setResults((prev) => ({
                      ...prev,
                      [active.id]: { ...prev[active.id], notes: e.target.value },
                    }))
                  }
                  className="min-h-[88px]"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Outcome</label>
                <Select
                  value={activeResult.outcome}
                  onValueChange={(v: Outcome) =>
                    setResults((prev) => ({
                      ...prev,
                      [active.id]: { ...prev[active.id], outcome: v },
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="warn">Warning issued</SelectItem>
                    <SelectItem value="fail">Fail — escalate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button onClick={handleSubmit} className="flex-1">
                <Save className="h-4 w-4 mr-2" /> Save inspection
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              {activeResult.outcome === "fail" && (
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast({
                      title: "Escalation raised",
                      description: `${active.name} flagged to Operations Manager.`,
                    })
                  }
                >
                  <AlertOctagon className="h-4 w-4 mr-2" /> Escalate
                </Button>
              )}
              {activeResult.submittedAt && (
                <Badge variant="outline" className="self-center text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  Saved {new Date(activeResult.submittedAt).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
