import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const EvidenceVault = () => {
  const { staffRecord } = useOfficerAssignments();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!staffRecord?.id) return setItems([]);
    const { data } = await (supabase as any).storage.from("evidence-vault").list(staffRecord.id, { limit: 50, sortBy: { column: "created_at", order: "desc" } });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [staffRecord?.id]);

  const upload = async (files: FileList | null) => {
    if (!files || !staffRecord?.id) return;
    for (const f of Array.from(files)) {
      const path = `${staffRecord.id}/${Date.now()}-${f.name}`;
      const { error } = await (supabase as any).storage.from("evidence-vault").upload(path, f);
      if (error) toast.error(error.message); else toast.success(`Uploaded ${f.name}`);
    }
    load();
  };

  const remove = async (name: string) => {
    if (!staffRecord?.id) return;
    await (supabase as any).storage.from("evidence-vault").remove([`${staffRecord.id}/${name}`]);
    load();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Camera className="h-4 w-4 text-red-500" /> Evidence Vault</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => upload(e.target.files)} />
        <Button className="w-full gap-2" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload Photo / Video
        </Button>
        <p className="text-[10px] text-muted-foreground">Files are private to you and chain-of-custody logged.</p>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-xs text-muted-foreground">No evidence yet.</p>}
          {items.map((i: any) => (
            <div key={i.name} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <span className="truncate">{i.name}</span>
              <Button size="sm" variant="ghost" onClick={() => remove(i.name)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceVault;
