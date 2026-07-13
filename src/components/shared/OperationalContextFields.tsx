import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Crosshair, Hash, Users, Paperclip, Camera, X,
  Mic, MicOff, Loader2, Clock as ClockIcon,
} from "lucide-react";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { toast } from "sonner";

export interface OperationalContextValue {
  geo: { lat: number; lng: number; accuracy?: number } | null;
  tags: string[];
  witnesses: string[];
  attachments: File[];
  occurredAt?: string;
  slaMinutes?: number;
  voiceNote: string;
}

export const emptyOperationalContext = (): OperationalContextValue => ({
  geo: null,
  tags: [],
  witnesses: [],
  attachments: [],
  occurredAt: new Date().toISOString().slice(0, 16),
  slaMinutes: undefined,
  voiceNote: "",
});

interface Props {
  value: OperationalContextValue;
  onChange: (v: OperationalContextValue) => void;
  /** Show the occurred-at + SLA row */
  showTime?: boolean;
  /** Allow attachments */
  showAttachments?: boolean;
  /** Show voice-note dictation */
  showVoice?: boolean;
  /** Title — appears as a separator label */
  title?: string;
}

/**
 * Shared "operational context" form fragment used by every module dialog.
 * Adds (does NOT replace) geolocation, tags, witnesses, attachments, voice
 * note, occurred-at, SLA target — drop in at the bottom of any form.
 */
export const OperationalContextFields = ({
  value, onChange,
  showTime = true,
  showAttachments = true,
  showVoice = true,
  title = "Operational Context",
}: Props) => {
  const [tagInput, setTagInput] = useState("");
  const [witnessInput, setWitnessInput] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceToText();

  useEffect(() => {
    if (voice.transcript) {
      onChange({ ...value, voiceNote: (value.voiceNote ? value.voiceNote + " " : "") + voice.transcript });
      voice.resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript]);

  const captureGeo = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ ...value, geo: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } });
        setGeoLoading(false);
        toast.success("Location captured");
      },
      (err) => { setGeoLoading(false); toast.error(`Location failed: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !value.tags.includes(v)) onChange({ ...value, tags: [...value.tags, v] });
    setTagInput("");
  };

  const addWitness = () => {
    const v = witnessInput.trim();
    if (v && !value.witnesses.includes(v)) onChange({ ...value, witnesses: [...value.witnesses, v] });
    setWitnessInput("");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const tooBig = arr.find((f) => f.size > 25 * 1024 * 1024);
    if (tooBig) return toast.error(`${tooBig.name} exceeds 25 MB`);
    onChange({ ...value, attachments: [...value.attachments, ...arr] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Separator className="flex-1" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
        <Separator className="flex-1" />
      </div>

      {showTime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><ClockIcon className="h-3.5 w-3.5" /> Occurred at</Label>
            <Input
              type="datetime-local"
              value={value.occurredAt ?? ""}
              onChange={(e) => onChange({ ...value, occurredAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>SLA target (minutes, optional)</Label>
            <Input
              type="number"
              min={1}
              value={value.slaMinutes ?? ""}
              placeholder="e.g. 30"
              onChange={(e) => onChange({ ...value, slaMinutes: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Geolocation</Label>
          <Button type="button" size="sm" variant="outline" onClick={captureGeo} disabled={geoLoading}>
            {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Crosshair className="mr-1 h-3.5 w-3.5" /> Capture</>}
          </Button>
        </div>
        {value.geo ? (
          <p className="text-xs font-mono text-muted-foreground">
            {value.geo.lat.toFixed(6)}, {value.geo.lng.toFixed(6)}
            {value.geo.accuracy && ` · ±${Math.round(value.geo.accuracy)} m`}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No coordinates captured.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="armed, after-hours, vip…"
          />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {value.tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button type="button" onClick={() => onChange({ ...value, tags: value.tags.filter((x) => x !== t) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Witnesses / People involved</Label>
        <div className="flex gap-2">
          <Input
            value={witnessInput}
            onChange={(e) => setWitnessInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWitness(); } }}
            placeholder="Name + role/contact"
          />
          <Button type="button" variant="outline" onClick={addWitness}>Add</Button>
        </div>
        {value.witnesses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {value.witnesses.map((w) => (
              <Badge key={w} variant="outline" className="gap-1">
                {w}
                <button type="button" onClick={() => onChange({ ...value, witnesses: value.witnesses.filter((x) => x !== w) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {showAttachments && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Attachments / Evidence</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="mr-1 h-3.5 w-3.5" /> Add files
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
            >
              <Camera className="mr-1 h-3.5 w-3.5" /> Photo
            </Button>
          </div>
          {value.attachments.length > 0 && (
            <ul className="space-y-1">
              {value.attachments.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2 py-1 text-xs">
                  <span className="truncate">{f.name} <span className="text-muted-foreground">· {(f.size / 1024).toFixed(0)} KB</span></span>
                  <button type="button" onClick={() => onChange({ ...value, attachments: value.attachments.filter((_, j) => j !== i) })}>
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showVoice && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Voice note</Label>
            <Button
              type="button"
              size="sm"
              variant={voice.isListening ? "destructive" : "outline"}
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              disabled={!voice.isSupported}
            >
              {voice.isListening ? <><MicOff className="mr-1 h-3.5 w-3.5" /> Stop</> : <><Mic className="mr-1 h-3.5 w-3.5" /> Dictate</>}
            </Button>
          </div>
          <textarea
            value={value.voiceNote}
            onChange={(e) => onChange({ ...value, voiceNote: e.target.value })}
            rows={2}
            placeholder="Hands-free voice note (English / Swahili)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
};

/**
 * Helper: upload attachments to evidence-vault and return their paths.
 */
export const uploadOperationalAttachments = async (
  supabase: any,
  module: string,
  entityId: string,
  files: File[],
): Promise<string[]> => {
  const uploaded: string[] = [];
  for (const file of files) {
    const path = `${module}/${entityId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("evidence-vault").upload(path, file);
    if (!error) uploaded.push(path);
  }
  return uploaded;
};

/**
 * Helper: build the JSON payload to merge into a record's metadata column.
 */
export const buildOperationalMetadata = (
  ctx: OperationalContextValue,
  attachmentPaths: string[] = [],
) => ({
  tags: ctx.tags,
  witnesses: ctx.witnesses,
  geo: ctx.geo,
  attachments: attachmentPaths,
  voice_note: ctx.voiceNote || null,
  sla_minutes: ctx.slaMinutes ?? null,
});
