import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Send } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Required").max(200),
  description: z.string().max(2000).optional(),
  directive_type: z.enum(["general", "dispatch", "sop", "escalation", "broadcast"]),
  priority: z.enum(["low", "normal", "high", "critical"]),
  target_user_id: z.string().uuid().optional().or(z.literal("")),
  target_role: z.string().optional(),
  source_module: z.string().optional(),
  sla_target_minutes: z.coerce.number().int().positive().optional().or(z.nan()),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultSource?: string;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export const IssueDirectiveDialog = ({ defaultSource, onCreated, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      directive_type: "general",
      priority: "normal",
      target_user_id: "",
      target_role: "",
      source_module: defaultSource || "control-room",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("You must be logged in to issue a directive");
      return;
    }
    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description || null,
      directive_type: values.directive_type,
      priority: values.priority,
      source_module: values.source_module || null,
      target_user_id: values.target_user_id || null,
      target_role: values.target_role || null,
      sla_target_minutes: Number.isFinite(values.sla_target_minutes) ? values.sla_target_minutes : null,
      issued_by: user.id,
    };
    const { error } = await supabase.from("directives" as any).insert(payload);
    if (error) {
      toast.error(`Failed to issue directive: ${error.message}`);
      return;
    }
    toast.success("Directive issued and logged");
    form.reset();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Issue Directive
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue New Directive</DialogTitle>
          <DialogDescription>
            Every command is timestamped and recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...form.register("title")} placeholder="e.g. Reposition Unit Alpha to Gate 3" />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...form.register("description")} rows={3}
              placeholder="Full instructions, context, SOP references…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                defaultValue="general"
                onValueChange={(v) => form.setValue("directive_type", v as FormValues["directive_type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="dispatch">Dispatch</SelectItem>
                  <SelectItem value="sop">SOP Action</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                defaultValue="normal"
                onValueChange={(v) => form.setValue("priority", v as FormValues["priority"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target user ID (optional)</Label>
              <Input {...form.register("target_user_id")} placeholder="auth user UUID" />
            </div>
            <div>
              <Label>Target role (optional)</Label>
              <Input {...form.register("target_role")} placeholder="e.g. patrol_officer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source module</Label>
              <Input {...form.register("source_module")} />
            </div>
            <div>
              <Label>SLA (minutes)</Label>
              <Input type="number" min={1} {...form.register("sla_target_minutes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={form.formState.isSubmitting}>
              <Send className="w-4 h-4" /> Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDirectiveDialog;
