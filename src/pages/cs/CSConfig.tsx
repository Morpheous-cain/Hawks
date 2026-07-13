import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Settings, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useCustomerService, type CSCategory } from "@/hooks/useCustomerService";

const CSConfig = () => {
  const cs = useCustomerService();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CSCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", escalation_sla_hours: 24 });

  useEffect(() => {
    // Fetch all categories (including inactive) for config view
    cs.fetchCategories();
  }, [cs.fetchCategories]);

  const openCreate = () => {
    setForm({ name: "", description: "", escalation_sla_hours: 24 });
    setCreateOpen(true);
  };

  const openEdit = (cat: CSCategory) => {
    setForm({ name: cat.name, description: cat.description ?? "", escalation_sla_hours: cat.escalation_sla_hours });
    setEditTarget(cat);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await cs.updateCategory(editTarget.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          escalation_sla_hours: Number(form.escalation_sla_hours),
        });
        setEditTarget(null);
      } else {
        await cs.createCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          escalation_sla_hours: Number(form.escalation_sla_hours),
        });
        setCreateOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: CSCategory) => {
    await cs.updateCategory(cat.id, { is_active: !cat.is_active });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="Manage ticket categories and escalation SLA rules"
        icon={Settings}
      />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Ticket Categories</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="divide-y divide-border">
          {cs.categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No categories configured. Add a category to get started.
            </div>
          ) : cs.categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{cat.name}</p>
                  {!cat.is_active && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                  )}
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Escalation SLA: <span className="font-medium text-foreground">{cat.escalation_sla_hours}h</span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground" htmlFor={`toggle-${cat.id}`}>Active</Label>
                  <Switch
                    id={`toggle-${cat.id}`}
                    checked={cat.is_active}
                    onCheckedChange={() => handleToggleActive(cat)}
                  />
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={createOpen || !!editTarget}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 resize-none h-16"
              />
            </div>
            <div>
              <Label htmlFor="cat-sla">Escalation SLA (hours)</Label>
              <Input
                id="cat-sla"
                type="number"
                min={1}
                max={720}
                value={form.escalation_sla_hours}
                onChange={(e) => setForm((p) => ({ ...p, escalation_sla_hours: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSConfig;
