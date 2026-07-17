import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare, Mic, MicOff, Phone, Megaphone, ShieldAlert,
  Radio, Send, CheckCircle2, AlertTriangle, Clock, MapPin, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNowStrict } from "date-fns";

// Hardcoded HQ control room number — replace via env/config when telephony connector is wired
const HQ_PHONE_NUMBER = "+254700000000";

type StatusType =
  | "available" | "patrolling" | "on_break" | "investigating"
  | "backup_needed" | "off_duty" | "responding";

const STATUS_OPTIONS: { value: StatusType; label: string; color: string }[] = [
  { value: "available", label: "Available", color: "bg-emerald-500" },
  { value: "patrolling", label: "Patrolling", color: "bg-blue-500" },
  { value: "responding", label: "Responding", color: "bg-amber-500" },
  { value: "investigating", label: "Investigating", color: "bg-indigo-500" },
  { value: "on_break", label: "On Break", color: "bg-slate-400" },
  { value: "backup_needed", label: "Backup Needed", color: "bg-red-500" },
  { value: "off_duty", label: "Off Duty", color: "bg-zinc-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500",
  normal: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-600 animate-pulse",
};

// Type interfaces for HQ tables (until types.ts regenerates)
interface HQMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  thread_key: string;
  body: string | null;
  message_type: 'text' | 'voice' | 'ptt' | 'system' | 'call_log';
  audio_url: string | null;
  duration_seconds: number | null;
  site_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  is_from_hq: boolean;
  read_at: string | null;
  created_at: string;
}

interface GuardStatusBeacon {
  user_id: string;
  staff_id: string | null;
  status: StatusType;
  status_message: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  site_id: string | null;
  battery_level: number | null;
  last_heartbeat: string;
  updated_at: string;
}

interface HQBroadcast {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  audience: string;
  requires_ack: boolean;
  expires_at: string | null;
  issued_by: string | null;
  issued_at: string;
}

interface HQBroadcastAck {
  id: string;
  broadcast_id: string;
  user_id: string;
  acknowledged_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
}

interface HQDirective {
  id: string;
  directive_number: string | null;
  title: string;
  instructions: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  assigned_to: string;
  issued_by: string | null;
  status: 'pending' | 'acknowledged' | 'executing' | 'completed' | 'escalated' | 'cancelled';
  acknowledged_at: string | null;
  executing_at: string | null;
  completed_at: string | null;
  ack_gps_lat: number | null;
  ack_gps_lng: number | null;
  completion_gps_lat: number | null;
  completion_gps_lng: number | null;
  completion_notes: string | null;
  escalated_to: string | null;
  sla_minutes: number;
  created_at: string;
}

interface HQBackupRequest {
  id: string;
  request_number: string | null;
  requested_by: string;
  reason: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  units_requested: number;
  site_id: string | null;
  location: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  status: 'pending' | 'dispatched' | 'arrived' | 'resolved' | 'cancelled';
  dispatched_unit: string | null;
  dispatched_at: string | null;
  arrived_at: string | null;
  resolved_at: string | null;
  sla_minutes: number;
  created_at: string;
}

const HQConnect = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState("chat");

  // Chat
  const [messages, setMessages] = useState<HQMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PTT
  const [pttRecording, setPttRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pttStartRef = useRef<number>(0);

  // Status
  const [status, setStatus] = useState<StatusType>("available");
  const [statusMessage, setStatusMessage] = useState("");

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState<HQBroadcast[]>([]);
  const [acks, setAcks] = useState<Set<string>>(new Set());

  // Directives
  const [directives, setDirectives] = useState<HQDirective[]>([]);

  // Backup
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupReason, setBackupReason] = useState("");
  const [backupThreat, setBackupThreat] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [backupRequests, setBackupRequests] = useState<HQBackupRequest[]>([]);

  const threadKey = useMemo(() => (userId ? `guard:${userId}` : ""), [userId]);

  // Init
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
    })();
  }, []);

  // Initial loads + subscriptions
  useEffect(() => {
    if (!userId) return;

    const loadAll = async () => {
      const [msgs, brc, ackList, drs, bks, beacon] = await Promise.all([
        supabase.from("hq_messages").select("*").eq("thread_key", `guard:${userId}`).order("created_at"),
        supabase.from("hq_broadcasts").select("*").order("issued_at", { ascending: false }).limit(50),
        supabase.from("hq_broadcast_acks").select("broadcast_id").eq("user_id", userId),
        supabase.from("hq_directives").select("*").eq("assigned_to", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("hq_backup_requests").select("*").eq("requested_by", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("guard_status_beacons").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      if (msgs.data) setMessages(msgs.data);
      if (brc.data) setBroadcasts(brc.data);
      if (ackList.data) setAcks(new Set(ackList.data.map((a) => a.broadcast_id)));
      if (drs.data) setDirectives(drs.data);
      if (bks.data) setBackupRequests(bks.data);
      if (beacon.data) {
        setStatus(beacon.data.status as StatusType);
        setStatusMessage(beacon.data.status_message || "");
      } else {
        // create initial beacon
        await supabase.from("guard_status_beacons").upsert({ user_id: userId, status: "available" });
      }
    };
    loadAll();

    const ch = supabase
      .channel(`hq-connect-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hq_messages", filter: `thread_key=eq.guard:${userId}` },
        (p: any) => {
          if (p.eventType === "INSERT") setMessages((m) => [...m, p.new]);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hq_broadcasts" },
        (p: any) => {
          setBroadcasts((b) => [p.new, ...b]);
          if (p.new.priority === "critical" || p.new.priority === "high") {
            toast.warning(`HQ Broadcast: ${p.new.title}`);
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "hq_directives", filter: `assigned_to=eq.${userId}` },
        (p: any) => {
          if (p.eventType === "INSERT") {
            setDirectives((d) => [p.new, ...d]);
            toast.error(`New HQ Directive: ${p.new.title}`, { duration: 8000 });
          } else if (p.eventType === "UPDATE") {
            setDirectives((d) => d.map((x) => x.id === p.new.id ? p.new : x));
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "hq_backup_requests", filter: `requested_by=eq.${userId}` },
        (p: any) => {
          if (p.eventType === "INSERT") setBackupRequests((b) => [p.new, ...b]);
          else if (p.eventType === "UPDATE") setBackupRequests((b) => b.map((x) => x.id === p.new.id ? p.new : x));
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Heartbeat - update beacon every 60s
  useEffect(() => {
    if (!userId) return;
    const tick = async () => {
      let coords: { gps_lat?: number; gps_lng?: number } = {};
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        coords = { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude };
      } catch {}
      await supabase.from("guard_status_beacons").upsert({
        user_id: userId,
        status,
        status_message: statusMessage || null,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...coords,
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [userId, status, statusMessage]);

  // Send chat
  const sendMessage = async () => {
    if (!chatInput.trim() || !userId) return;
    const body = chatInput.trim();
    setChatInput("");
    let coords: any = {};
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
      coords = { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude };
    } catch {}
    const { error } = await supabase.from("hq_messages").insert({
      sender_id: userId,
      thread_key: threadKey,
      body,
      message_type: "text",
      is_from_hq: false,
      ...coords,
    });
    if (error) toast.error("Failed to send message");
  };

  // PTT - record voice burst
  const startPTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      pttStartRef.current = Date.now();
      recorder.ondataavailable = (e) => { if (e.data.size) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const dur = Math.round((Date.now() - pttStartRef.current) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        if (!userId) return;
        // Note: audio upload to storage would happen here. For now we log a PTT entry.
        await supabase.from("hq_messages").insert({
          sender_id: userId,
          thread_key: threadKey,
          body: `[PTT voice burst · ${dur}s]`,
          message_type: "ptt",
          duration_seconds: dur,
          is_from_hq: false,
        });
        toast.success(`PTT sent (${dur}s)`);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPttRecording(true);
    } catch (e: any) {
      toast.error("Microphone access denied");
    }
  };
  const stopPTT = () => {
    mediaRecorderRef.current?.stop();
    setPttRecording(false);
  };

  // Direct cellular call to HQ (uses tel: protocol via cellular eSIM)
  const callHQ = async () => {
    if (!userId) return;
    await supabase.from("hq_messages").insert({
      sender_id: userId,
      thread_key: threadKey,
      body: `[Cellular call placed to HQ ${HQ_PHONE_NUMBER}]`,
      message_type: "call_log",
      is_from_hq: false,
    });
    window.location.href = `tel:${HQ_PHONE_NUMBER}`;
  };

  // Acknowledge broadcast
  const ackBroadcast = async (broadcastId: string) => {
    if (!userId) return;
    let coords: any = {};
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
      coords = { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude };
    } catch {}
    const { error } = await supabase.from("hq_broadcast_acks").insert({
      broadcast_id: broadcastId, user_id: userId, ...coords,
    });
    if (error) toast.error("Acknowledgement failed");
    else {
      setAcks((s) => new Set(s).add(broadcastId));
      toast.success("Broadcast acknowledged");
    }
  };

  // Directive workflow
  const updateDirective = async (id: string, next: "acknowledged" | "executing" | "completed", notes?: string) => {
    const updates: any = { status: next };
    let coords: any = {};
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}
    if (next === "acknowledged") {
      updates.acknowledged_at = new Date().toISOString();
      updates.ack_gps_lat = coords.lat;
      updates.ack_gps_lng = coords.lng;
    } else if (next === "executing") {
      updates.executing_at = new Date().toISOString();
    } else if (next === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completion_gps_lat = coords.lat;
      updates.completion_gps_lng = coords.lng;
      if (notes) updates.completion_notes = notes;
    }
    const { error } = await supabase.from("hq_directives").update(updates).eq("id", id);
    if (error) toast.error("Failed to update directive");
    else toast.success(`Directive ${next}`);
  };

  // Submit backup request
  const submitBackup = async () => {
    if (!userId || !backupReason.trim()) return;
    let coords: any = {};
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      coords = { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude };
    } catch {}
    const { error } = await supabase.from("hq_backup_requests").insert({
      requested_by: userId,
      reason: backupReason,
      threat_level: backupThreat,
      ...coords,
    });
    if (error) toast.error("Backup request failed");
    else {
      toast.success("Backup requested - HQ notified");
      setBackupReason(""); setBackupOpen(false);
      // Auto-flip status
      setStatus("backup_needed");
    }
  };

  const unackedCritical = broadcasts.filter(
    (b) => b.requires_ack && !acks.has(b.id) && (b.priority === "critical" || b.priority === "high")
  );

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <Card className="border-blue-500/40 bg-gradient-to-r from-blue-950/40 to-indigo-950/30">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Radio className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">HQ Connect</h2>
              <p className="text-xs text-muted-foreground">Direct lifeline to Control Room</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as StatusType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", s.color)} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={callHQ} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              <Phone className="h-4 w-4 mr-1" /> Call HQ
            </Button>
            <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <ShieldAlert className="h-4 w-4 mr-1" /> Request Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request Backup</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Threat Level</label>
                    <Select value={backupThreat} onValueChange={(v) => setBackupThreat(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason / Situation</label>
                    <Textarea
                      value={backupReason}
                      onChange={(e) => setBackupReason(e.target.value)}
                      placeholder="Describe the threat & what's needed..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBackupOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={submitBackup} disabled={!backupReason.trim()}>
                    <ShieldAlert className="h-4 w-4 mr-1" /> Send Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Critical broadcast banner */}
      {unackedCritical.length > 0 && (
        <Card className="border-red-500/60 bg-red-950/30 animate-pulse">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <p className="font-bold">{unackedCritical[0].title}</p>
                <p className="text-sm text-muted-foreground">{unackedCritical[0].body}</p>
              </div>
            </div>
            <Button onClick={() => ackBroadcast(unackedCritical[0].id)} className="bg-red-600 hover:bg-red-700">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Acknowledge
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" />Chat</TabsTrigger>
          <TabsTrigger value="ptt"><Mic className="h-4 w-4 mr-1" />PTT</TabsTrigger>
          <TabsTrigger value="broadcasts">
            <Megaphone className="h-4 w-4 mr-1" />Broadcasts
            {broadcasts.filter((b) => b.requires_ack && !acks.has(b.id)).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {broadcasts.filter((b) => b.requires_ack && !acks.has(b.id)).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="directives">
            <ShieldAlert className="h-4 w-4 mr-1" />Directives
            {directives.filter((d) => d.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {directives.filter((d) => d.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="backup"><Activity className="h-4 w-4 mr-1" />Backup</TabsTrigger>
        </TabsList>

        {/* CHAT */}
        <TabsContent value="chat">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Chat with Control Room</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-3 mb-3 border rounded-md p-3 bg-muted/20">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No messages yet — say hi to HQ.
                  </p>
                ) : messages.map((m) => (
                  <div key={m.id} className={cn("mb-3 flex", m.is_from_hq ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[75%] rounded-lg p-3 text-sm",
                      m.is_from_hq ? "bg-blue-950/40 border border-blue-500/30" : "bg-emerald-950/30 border border-emerald-500/30"
                    )}>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                        <span className="font-medium">{m.is_from_hq ? "HQ Control Room" : "You"}</span>
                        <span>•</span>
                        <span>{format(new Date(m.created_at), "HH:mm")}</span>
                        {m.message_type !== "text" && (
                          <Badge variant="outline" className="text-[10px] h-4">{m.message_type}</Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Message Control Room..."
                />
                <Button onClick={sendMessage} disabled={!chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PTT */}
        <TabsContent value="ptt">
          <Card>
            <CardHeader><CardTitle className="text-base">Push-to-Talk Voice Burst</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center py-8 gap-4">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Hold the button to record a voice burst. Release to send instantly to HQ.
                Falls back to cellular eSIM voice if data is unavailable.
              </p>
              <Button
                size="lg"
                className={cn(
                  "h-32 w-32 rounded-full text-white",
                  pttRecording ? "bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
                )}
                onMouseDown={startPTT}
                onMouseUp={stopPTT}
                onMouseLeave={() => pttRecording && stopPTT()}
                onTouchStart={startPTT}
                onTouchEnd={stopPTT}
              >
                {pttRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
              </Button>
              <p className="text-sm font-medium">
                {pttRecording ? "RECORDING — release to send" : "Hold to talk"}
              </p>
              <Button variant="outline" onClick={callHQ}>
                <Phone className="h-4 w-4 mr-2" /> Or dial HQ over cellular
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BROADCASTS */}
        <TabsContent value="broadcasts">
          <Card>
            <CardHeader><CardTitle className="text-base">HQ Broadcasts</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] pr-3">
                {broadcasts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">No broadcasts.</p>
                ) : broadcasts.map((b) => {
                  const acked = acks.has(b.id);
                  return (
                    <div key={b.id} className={cn(
                      "mb-3 p-3 rounded-md border",
                      acked ? "bg-muted/20 border-border" : "bg-card border-blue-500/30"
                    )}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={PRIORITY_COLORS[b.priority]}>{b.priority}</Badge>
                          <p className="font-semibold">{b.title}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNowStrict(new Date(b.issued_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mb-2 whitespace-pre-wrap">{b.body}</p>
                      {b.requires_ack && (
                        acked ? (
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledged
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => ackBroadcast(b.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Acknowledge
                          </Button>
                        )
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIRECTIVES */}
        <TabsContent value="directives">
          <Card>
            <CardHeader><CardTitle className="text-base">HQ Directives — Acknowledge & Comply</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] pr-3">
                {directives.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">No active directives.</p>
                ) : directives.map((d) => (
                  <div key={d.id} className="mb-3 p-3 rounded-md border bg-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[d.priority]}>{d.priority}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{d.directive_number}</span>
                        <p className="font-semibold">{d.title}</p>
                      </div>
                      <Badge variant="outline">{d.status}</Badge>
                    </div>
                    <p className="text-sm mb-3 whitespace-pre-wrap">{d.instructions}</p>
                    <div className="flex gap-2 flex-wrap">
                      {d.status === "pending" && (
                        <Button size="sm" onClick={() => updateDirective(d.id, "acknowledged")}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Acknowledge
                        </Button>
                      )}
                      {d.status === "acknowledged" && (
                        <Button size="sm" variant="default" onClick={() => updateDirective(d.id, "executing")}>
                          <Activity className="h-4 w-4 mr-1" /> Mark Executing
                        </Button>
                      )}
                      {d.status === "executing" && (
                        <Button size="sm" variant="default"
                          onClick={() => {
                            const notes = prompt("Completion notes (optional):") || "";
                            updateDirective(d.id, "completed", notes);
                          }}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete
                        </Button>
                      )}
                      {d.acknowledged_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Ack: {format(new Date(d.acknowledged_at), "HH:mm")}
                        </span>
                      )}
                      {d.ack_gps_lat && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> GPS logged
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                My Backup Requests
                <Button size="sm" variant="destructive" onClick={() => setBackupOpen(true)}>
                  <ShieldAlert className="h-4 w-4 mr-1" /> New Request
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] pr-3">
                {backupRequests.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">No backup requests yet.</p>
                ) : backupRequests.map((r) => (
                  <div key={r.id} className="mb-3 p-3 rounded-md border bg-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[r.threat_level]}>{r.threat_level}</Badge>
                        <span className="font-mono text-xs">{r.request_number}</span>
                      </div>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                    <p className="text-sm mb-2">{r.reason}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}</span>
                      {r.dispatched_unit && <span>Unit: {r.dispatched_unit}</span>}
                      {r.gps_lat && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />GPS</span>}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HQConnect;
