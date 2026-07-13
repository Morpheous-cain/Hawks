import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardList, Plus, UserPlus2, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/utils/exportData";

interface Post { id: string; post_name: string; post_code: string|null; client_id: string|null; site_id: string|null; shift_type: string; shift_start: string; shift_end: string; required_count: number; required_rank: string|null; active: boolean; }
interface Assn { id: string; post_id: string; staff_id: string; assignment_date: string; status: string; reported_at: string|null; on_post_at: string|null; off_post_at: string|null; }
interface Staff { id: string; full_name: string; duty_category: string|null; status: string|null; }

const STATUS_TONE: Record<string,string> = {
  scheduled: "bg-blue-500/15 text-blue-600",
  reported:  "bg-cyan-500/15 text-cyan-600",
  on_post:   "bg-emerald-500/15 text-emerald-600",
  relief_pending:"bg-amber-500/15 text-amber-600",
  no_show:   "bg-red-500/15 text-red-600",
  absent:    "bg-red-500/15 text-red-600",
  completed: "bg-slate-500/15 text-slate-600",
};

export default function DeploymentBoard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [assns, setAssns] = useState<Assn[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [openPost, setOpenPost] = useState(false);
  const [openAssign, setOpenAssign] = useState<Post|null>(null);

  const reload = async () => {
    const [p, a, s] = await Promise.all([
      supabase.from("deployment_posts" as any).select("*").eq("active", true).order("post_name"),
      supabase.from("deployment_assignments" as any).select("*").eq("assignment_date", date),
      supabase.from("staff").select("id, full_name, duty_category, status").eq("status","active").order("full_name").limit(500),
    ]);
    setPosts((p.data as any) || []);
    setAssns((a.data as any) || []);
    setStaff((s.data as any) || []);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */}, [date]);

  useEffect(() => {
    const ch = supabase.channel("deployment-live")
      .on("postgres_changes", { event:"*", schema:"public", table:"deployment_posts" }, reload)
      .on("postgres_changes", { event:"*", schema:"public", table:"deployment_assignments" }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [date]);

  // KPIs
  const totalRequired = posts.reduce((s,p)=>s+p.required_count, 0);
  const filled = assns.filter(a => ["scheduled","reported","on_post"].includes(a.status)).length;
  const noShow = assns.filter(a => a.status === "no_show" || a.status === "absent").length;
  const relief = assns.filter(a => a.status === "relief_pending").length;
  const fillRate = totalRequired ? Math.round((filled/totalRequired)*100) : 0;

  const assnByPost = useMemo(() => {
    const map: Record<string, Assn[]> = {};
    for (const a of assns) (map[a.post_id] ||= []).push(a);
    return map;
  }, [assns]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "reported") patch.reported_at = new Date().toISOString();
    if (status === "on_post")  patch.on_post_at  = new Date().toISOString();
    if (status === "completed") patch.off_post_at = new Date().toISOString();
    const { error } = await (supabase.from("deployment_assignments" as any) as any).update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Marked ${status.replace("_"," ")}`);
  };

  const autoFillRelief = async (assn: Assn) => {
    // mark current as relief_pending, find next available active staff not already assigned today
    const busy = new Set(assns.map(a => a.staff_id));
    const candidate = staff.find(s => !busy.has(s.id));
    if (!candidate) { toast.error("No relief candidates available"); return; }
    await (supabase.from("deployment_assignments" as any) as any).update({ status: "relief_pending" }).eq("id", assn.id);
    const { error } = await (supabase.from("deployment_assignments" as any) as any).insert({
      post_id: assn.post_id, staff_id: candidate.id, assignment_date: date,
      status: "scheduled", relief_for_id: assn.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Relief dispatched: ${candidate.full_name}`);
      // SLA event
      await (supabase.from("sla_events" as any) as any).insert({
        source_table: "deployment_assignments", source_id: assn.id,
        category: "relief", severity: "high", target_minutes: 30, assigned_team: "Operations",
      });
    }
  };

  const createPost = async (form: FormData) => {
    const { error } = await (supabase.from("deployment_posts" as any) as any).insert({
      post_name: form.get("post_name"),
      post_code: form.get("post_code") || null,
      shift_type: form.get("shift_type") || "day",
      shift_start: form.get("shift_start") || "06:00",
      shift_end: form.get("shift_end") || "18:00",
      required_count: Number(form.get("required_count") || 1),
      required_rank: form.get("required_rank") || "guard",
    });
    if (error) toast.error(error.message); else { toast.success("Post created"); setOpenPost(false); }
  };

  const assignStaff = async (post: Post, staff_id: string) => {
    const { error } = await (supabase.from("deployment_assignments" as any) as any).insert({
      post_id: post.id, staff_id, assignment_date: date, status: "scheduled",
    });
    if (error) toast.error(error.message); else { toast.success("Assigned"); setOpenAssign(null); }
  };

  return (
    <ModuleScaffold
      title="Deployment Board"
      description="Real-time post coverage, relief dispatch, and SLA-tracked assignments."
      icon={ClipboardList}
      kpis={[
        { label: "Posts", value: posts.length, hint: "Active" },
        { label: "Fill Rate", value: `${fillRate}%`, hint: `${filled}/${totalRequired}` },
        { label: "Relief Pending", value: relief, hint: "Awaiting cover" },
        { label: "No-Show / Absent", value: noShow, hint: "Today" },
      ]}
      onExport={() => exportToCSV(assns, `deployment-${date}.csv`)}
      actions={
        <>
          <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-40" />
          <Dialog open={openPost} onOpenChange={setOpenPost}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2"/>New Post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deployment Post</DialogTitle></DialogHeader>
              <form onSubmit={(e)=>{ e.preventDefault(); createPost(new FormData(e.currentTarget)); }} className="space-y-3">
                <div><Label>Post Name</Label><Input name="post_name" required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Post Code</Label><Input name="post_code" /></div>
                  <div><Label>Required Count</Label><Input name="required_count" type="number" defaultValue={1} min={1}/></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Shift Start</Label><Input name="shift_start" type="time" defaultValue="06:00"/></div>
                  <div><Label>Shift End</Label><Input name="shift_end" type="time" defaultValue="18:00"/></div>
                </div>
                <div><Label>Required Rank</Label><Input name="required_rank" defaultValue="guard"/></div>
                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(post => {
          const list = assnByPost[post.id] || [];
          const filledCount = list.filter(a => ["scheduled","reported","on_post"].includes(a.status)).length;
          const gap = Math.max(0, post.required_count - filledCount);
          return (
            <Card key={post.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{post.post_name}</div>
                  <div className="text-xs text-muted-foreground">{post.post_code || "—"} · {post.shift_start.slice(0,5)}–{post.shift_end.slice(0,5)} · {post.shift_type}</div>
                </div>
                <Badge variant={gap===0?"secondary":"destructive"}>{filledCount}/{post.required_count}</Badge>
              </div>
              <div className="space-y-1.5">
                {list.length===0 && <div className="text-xs text-muted-foreground italic">No assignments</div>}
                {list.map(a => {
                  const s = staff.find(x => x.id === a.staff_id);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm border rounded-md px-2 py-1.5">
                      <div className="truncate">
                        <div className="truncate font-medium">{s?.full_name || a.staff_id.slice(0,8)}</div>
                        <div className={`text-[10px] inline-block px-1.5 py-0.5 rounded ${STATUS_TONE[a.status]||""}`}>{a.status.replace("_"," ")}</div>
                      </div>
                      <div className="flex gap-1">
                        {a.status==="scheduled" && <Button size="sm" variant="outline" onClick={()=>setStatus(a.id,"reported")}>Report</Button>}
                        {a.status==="reported" && <Button size="sm" variant="outline" onClick={()=>setStatus(a.id,"on_post")}>On Post</Button>}
                        {a.status==="on_post" && <Button size="sm" variant="outline" onClick={()=>setStatus(a.id,"completed")}>End</Button>}
                        {["scheduled","reported"].includes(a.status) && (
                          <Button size="sm" variant="ghost" title="No-show" onClick={()=>{ setStatus(a.id,"no_show"); autoFillRelief(a); }}>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500"/>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Dialog open={openAssign?.id===post.id} onOpenChange={(o)=>setOpenAssign(o?post:null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full"><UserPlus2 className="h-4 w-4 mr-2"/>Assign Staff</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign to {post.post_name}</DialogTitle></DialogHeader>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {staff.filter(s => !assns.some(a => a.staff_id === s.id && a.assignment_date === date))
                      .slice(0,100)
                      .map(s => (
                      <button key={s.id} onClick={()=>assignStaff(post, s.id)}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground"/>
                        <span>{s.full_name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{s.duty_category||"-"}</span>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          );
        })}
        {posts.length===0 && (
          <Card className="p-8 text-center text-muted-foreground col-span-full">
            No deployment posts yet. Create your first post to start scheduling.
          </Card>
        )}
      </div>
    </ModuleScaffold>
  );
}
