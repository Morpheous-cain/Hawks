import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MapPin, Paperclip, Mic, MicOff, X, Users, Hash, Camera, Crosshair,
  Clock as ClockIcon, AlertTriangle, Loader2,
} from "lucide-react";
import { useVoiceToText } from "@/hooks/useVoiceToText";

interface IncidentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SLA_PRESET = { critical: 15, high: 30, medium: 60, low: 120 } as const;

export const IncidentCreateDialog = ({ open, onOpenChange, onSuccess }: IncidentCreateDialogProps) => {
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [witnessInput, setWitnessInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    site_id: "",
    incident_type: "",
    severity: "medium",
    location: "",
    description: "",
    status: "open",
    occurred_at: new Date().toISOString().slice(0, 16),
    assigned_to: "",
    sop_type: "",
    sla_target_minutes: 60,
    tags: [] as string[],
    witnesses: [] as string[],
    geo: null as { lat: number; lng: number; accuracy?: number } | null,
  });

  const voice = useVoiceToText();
  useEffect(() => {
    if (voice.transcript) {
      setFormData((p) => ({ ...p, description: (p.description ? p.description + " " : "") + voice.transcript }));
      voice.resetTranscript();
    }
  }, [voice.transcript]);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchStaff();
    }
  }, [open]);

  useEffect(() => {
    if (formData.client_id) fetchSites(formData.client_id);
  }, [formData.client_id]);

  useEffect(() => {
    setFormData((p) => ({ ...p, sla_target_minutes: SLA_PRESET[p.severity as keyof typeof SLA_PRESET] ?? 60 }));
  }, [formData.severity]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, legal_name").eq("status", "active").order("legal_name");
    setClients(data || []);
  };

  const fetchSites = async (clientId: string) => {
    const { data } = await supabase.from("sites").select("id, site_name").eq("client_id", clientId).order("site_name");
    setSites(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name, employee_id").eq("status", "active").order("full_name").limit(500);
    setStaff(data || []);
  };

  const captureGeo = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((p) => ({
          ...p,
          geo: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        }));
        setGeoLoading(false);
        toast.success("Location captured");
      },
      (err) => {
        setGeoLoading(false);
        toast.error(`Location failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !formData.tags.includes(v)) {
      setFormData({ ...formData, tags: [...formData.tags, v] });
    }
    setTagInput("");
  };

  const addWitness = () => {
    const v = witnessInput.trim();
    if (v && !formData.witnesses.includes(v)) {
      setFormData({ ...formData, witnesses: [...formData.witnesses, v] });
    }
    setWitnessInput("");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const tooBig = arr.find((f) => f.size > 25 * 1024 * 1024);
    if (tooBig) return toast.error(`${tooBig.name} exceeds 25 MB`);
    setAttachments((prev) => [...prev, ...arr]);
  };

  const uploadAttachments = async (incidentId: string) => {
    const uploaded: string[] = [];
    for (const file of attachments) {
      const path = `incidents/${incidentId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("evidence-vault").upload(path, file);
      if (!error) uploaded.push(path);
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        setSubmitting(false);
        return;
      }

      const slaDeadline = new Date(formData.occurred_at);
      slaDeadline.setMinutes(slaDeadline.getMinutes() + formData.sla_target_minutes);

      const { data: created, error } = await supabase
        .from("incidents")
        .insert([{
          incident_number: `INC-${new Date().getFullYear()}-${Date.now()}`,
          title: `${formData.incident_type} at ${formData.location}`,
          client_id: formData.client_id,
          site_id: formData.site_id || null,
          incident_type: formData.incident_type,
          severity: formData.severity,
          location: formData.location,
          description: formData.description,
          status: formData.status,
          occurred_at: new Date(formData.occurred_at).toISOString(),
          sla_target_minutes: formData.sla_target_minutes,
          sla_deadline: slaDeadline.toISOString(),
          reported_by: user.id,
          assigned_to: formData.assigned_to || null,
          sop_type: formData.sop_type || null,
          mandatory_fields_data: {
            tags: formData.tags,
            witnesses: formData.witnesses,
            geo: formData.geo,
            attachments: [] as string[],
          },
        }])
        .select("id")
        .single();

      if (error) throw error;

      if (created && attachments.length > 0) {
        const paths = await uploadAttachments(created.id);
        if (paths.length) {
          await supabase
            .from("incidents")
            .update({
              mandatory_fields_data: {
                tags: formData.tags,
                witnesses: formData.witnesses,
                geo: formData.geo,
                attachments: paths,
              },
            })
            .eq("id", created.id);
        }
      }

      toast.success("Incident created successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        client_id: "", site_id: "", incident_type: "", severity: "medium",
        location: "", description: "", status: "open",
        occurred_at: new Date().toISOString().slice(0, 16),
        assigned_to: "", sop_type: "", sla_target_minutes: 60,
        tags: [], witnesses: [], geo: null,
      });
      setAttachments([]);
    } catch (error: any) {
      console.error("Error creating incident:", error);
      toast.error(error.message || "Failed to create incident");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Create New Incident
          </DialogTitle>
          <DialogDescription>
            Capture full operational context — location, evidence, witnesses and SLA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ---- Core ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v, site_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Site *</Label>
              <Select value={formData.site_id} onValueChange={(v) => setFormData({ ...formData, site_id: v })} disabled={!formData.client_id}>
                <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={formData.incident_type} onValueChange={(v) => setFormData({ ...formData, incident_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="intrusion">Intrusion</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="technical">Technical Fault</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Specific location within site" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description *</Label>
              <Button type="button" size="sm" variant={voice.isListening ? "destructive" : "outline"} onClick={voice.isListening ? voice.stopListening : voice.startListening} disabled={!voice.isSupported}>
                {voice.isListening ? <><MicOff className="mr-1 h-3.5 w-3.5" /> Stop</> : <><Mic className="mr-1 h-3.5 w-3.5" /> Voice</>}
              </Button>
            </div>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed description of the incident" rows={4} required />
          </div>

          <Separator />

          {/* ---- Operational context ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ClockIcon className="h-3.5 w-3.5" /> Occurred at</Label>
              <Input type="datetime-local" value={formData.occurred_at} onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>SLA target (minutes)</Label>
              <Input type="number" min={1} value={formData.sla_target_minutes} onChange={(e) => setFormData({ ...formData, sla_target_minutes: Number(e.target.value) || 60 })} />
            </div>

            <div className="space-y-2">
              <Label>Assign to officer</Label>
              <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} {s.employee_id ? `· ${s.employee_id}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SOP type</Label>
              <Select value={formData.sop_type} onValueChange={(v) => setFormData({ ...formData, sop_type: v })}>
                <SelectTrigger><SelectValue placeholder="Optional SOP playbook" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="armed_response">Armed Response</SelectItem>
                  <SelectItem value="medical_evac">Medical Evac</SelectItem>
                  <SelectItem value="fire_drill">Fire Evacuation</SelectItem>
                  <SelectItem value="bomb_threat">Bomb Threat</SelectItem>
                  <SelectItem value="vip_escort">VIP Escort</SelectItem>
                  <SelectItem value="lockdown">Site Lockdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ---- Geo ---- */}
          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Geolocation</Label>
              <Button type="button" size="sm" variant="outline" onClick={captureGeo} disabled={geoLoading}>
                {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Crosshair className="mr-1 h-3.5 w-3.5" /> Capture</>}
              </Button>
            </div>
            {formData.geo ? (
              <p className="text-xs font-mono text-muted-foreground">
                {formData.geo.lat.toFixed(6)}, {formData.geo.lng.toFixed(6)}
                {formData.geo.accuracy && ` · ±${Math.round(formData.geo.accuracy)} m`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No coordinates captured.</p>
            )}
          </div>

          {/* ---- Tags ---- */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="armed, after-hours, vip…" />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ---- Witnesses ---- */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Witnesses / People involved</Label>
            <div className="flex gap-2">
              <Input value={witnessInput} onChange={(e) => setWitnessInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWitness(); } }} placeholder="Name + role/contact" />
              <Button type="button" variant="outline" onClick={addWitness}>Add</Button>
            </div>
            {formData.witnesses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.witnesses.map((w) => (
                  <Badge key={w} variant="outline" className="gap-1">
                    {w}
                    <button type="button" onClick={() => setFormData({ ...formData, witnesses: formData.witnesses.filter((x) => x !== w) })}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ---- Attachments ---- */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Evidence attachments</Label>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-1 h-3.5 w-3.5" /> Add files
              </Button>
              <Button type="button" variant="outline" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}>
                <Camera className="mr-1 h-3.5 w-3.5" /> Photo
              </Button>
            </div>
            {attachments.length > 0 && (
              <ul className="space-y-1">
                {attachments.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2 py-1 text-xs">
                    <span className="truncate">{f.name} <span className="text-muted-foreground">· {(f.size / 1024).toFixed(0)} KB</span></span>
                    <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Creating…</> : "Create Incident"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
