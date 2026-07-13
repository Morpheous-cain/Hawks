import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BroadcastComposer = () => {
  const [form, setForm] = useState({ title: "", body: "", severity: "medium", requires_ack: true });

  const send = async () => {
    if (!form.title || !form.body) return toast.error("Title and body required");
    const { error } = await (supabase as any).from("hq_broadcasts").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Broadcast sent to field");
    setForm({ title: "", body: "", severity: "medium", requires_ack: true });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4 text-primary" /> Broadcast Composer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Message</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <div>
          <Label>Severity</Label>
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={send} className="w-full gap-2"><Send className="h-4 w-4" /> Send Broadcast</Button>
      </CardContent>
    </Card>
  );
};

export default BroadcastComposer;
