import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Briefcase,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FilePlus2,
  FileSearch,
  Fingerprint,
  Flag,
  History,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/PageHeader";
import InvestigationReportForm from "@/components/InvestigationReportForm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInvestigationsData } from "@/hooks/useInvestigationsData";

interface IncidentRecord {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  incident_type: string | null;
  severity: string | null;
  status: string | null;
  location: string | null;
  assigned_to: string | null;
  occurred_at: string | null;
  created_at: string;
  updated_at: string | null;
  sla_deadline: string | null;
  sla_breached: boolean | null;
  ai_summary: string | null;
}

interface TimelineRecord {
  id: string;
  incident_id: string;
  event_at: string;
  event_type: string;
  actor_name: string | null;
  note: string | null;
  payload?: Record<string, unknown> | null;
}

interface EvidenceRecord {
  id: string;
  incident_id: string;
  evidence_type: string;
  title: string;
  description: string | null;
  collected_at: string;
  mime_type: string | null;
  storage_path: string | null;
  external_url: string | null;
}

interface AttachmentRecord {
  id: string;
  investigation_id: string;
  attachment_type: string | null;
  notes: string | null;
  attached_at: string;
  document?: {
    title?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    uploaded_at?: string | null;
  } | null;
}

interface UserSnapshot {
  id: string;
  email?: string;
}

const investigationTypes = [
  "investigation",
  "security breach",
  "theft",
  "policy breach",
  "misconduct",
  "fraud",
  "tampering",
  "intrusion",
  "assault",
];

const statusOptions = ["open", "assigned", "investigating", "in_progress", "under_review", "resolved", "closed"];
const severityOptions = ["critical", "high", "medium", "low"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatRelativeDays = (value?: string | null) => {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return `${diffDays}d active`;
};

const titleCase = (value?: string | null) => {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const investigationProgress = (status?: string | null) => {
  switch (status) {
    case "open":
      return 15;
    case "assigned":
      return 28;
    case "investigating":
      return 52;
    case "in_progress":
      return 68;
    case "under_review":
      return 84;
    case "resolved":
      return 96;
    case "closed":
      return 100;
    default:
      return 22;
  }
};

const statusTone = (status?: string | null) => {
  switch (status) {
    case "resolved":
    case "closed":
      return "bg-alert-normal/15 text-alert-normal border-alert-normal/30";
    case "under_review":
      return "bg-accent/20 text-accent-foreground border-accent/40";
    case "investigating":
    case "in_progress":
      return "bg-primary/15 text-primary border-primary/30";
    case "assigned":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-alert-caution/15 text-alert-caution border-alert-caution/30";
  }
};

const severityTone = (severity?: string | null) => {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "high":
      return "bg-alert-caution/15 text-alert-caution border-alert-caution/30";
    case "medium":
      return "bg-primary/15 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const isInvestigationCase = (incident: IncidentRecord) => {
  const incidentType = (incident.incident_type ?? "").toLowerCase();
  const title = (incident.title ?? "").toLowerCase();
  const incidentNumber = (incident.incident_number ?? "").toLowerCase();

  return (
    incidentNumber.startsWith("inv-") ||
    incident.status === "investigating" ||
    investigationTypes.some((entry) => incidentType.includes(entry) || title.includes(entry))
  );
};

const generateCaseNumber = () => `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

const Investigations = () => {
  const { toast } = useToast();
  // ─── Data layer (hook-owned) ───
  const { data, loading, actions } = useInvestigationsData<IncidentRecord, TimelineRecord, EvidenceRecord, AttachmentRecord>(
    isInvestigationCase,
    {
      onLoadError: (error) =>
        toast({
          title: "Unable to load investigations",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        }),
    },
  );
  const { cases, timeline, evidence, attachments, currentUser } = data;
  const loadData = actions.refresh;

  // ─── UI state (page-owned) ───
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("investigating");
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  // Queue power-features
  const [quickFilter, setQuickFilter] = useState<"all" | "mine" | "unassigned" | "overdue" | "critical">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<"case" | "severity" | "status" | "evidence">("case");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Assignment dialog
  const [investigators, setInvestigators] = useState<Array<{ id: string; full_name: string; email: string | null }>>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<IncidentRecord | "bulk" | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [newCase, setNewCase] = useState({
    incident_number: generateCaseNumber(),
    title: "",
    incident_type: "Investigation",
    severity: "medium",
    location: "",
    description: "",
  });
  const [newEvidence, setNewEvidence] = useState({
    evidence_type: "note",
    title: "",
    description: "",
    external_url: "",
  });

  // Seed initial selection once cases arrive.
  useEffect(() => {
    if (cases.length && !selectedId) {
      setSelectedId(cases[0].id);
      setSelectedStatus(cases[0].status ?? "investigating");
    }
  }, [cases, selectedId]);

  // Load investigator pool (any profile can be assigned a case)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (!cancelled && !error && data) setInvestigators(data as any);
    })();
    return () => { cancelled = true; };
  }, []);




  const evidenceCountByIncident = useMemo(() => {
    return evidence.reduce<Record<string, number>>((acc, item) => {
      acc[item.incident_id] = (acc[item.incident_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [evidence]);

  const timelineCountByIncident = useMemo(() => {
    return timeline.reduce<Record<string, number>>((acc, item) => {
      acc[item.incident_id] = (acc[item.incident_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [timeline]);

  const attachmentCountByCaseNumber = useMemo(() => {
    return attachments.reduce<Record<string, number>>((acc, item) => {
      acc[item.investigation_id] = (acc[item.investigation_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [attachments]);

  const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const statusRank: Record<string, number> = {
    open: 1, assigned: 2, investigating: 3, in_progress: 4, under_review: 5, resolved: 6, closed: 7,
  };

  const filteredCases = useMemo(() => {
    const now = Date.now();
    const base = cases.filter((incident) => {
      const searchBlob = [incident.incident_number, incident.title, incident.location, incident.incident_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuick =
        quickFilter === "all" ||
        (quickFilter === "mine" && incident.assigned_to === currentUser?.id) ||
        (quickFilter === "unassigned" && !incident.assigned_to) ||
        (quickFilter === "critical" && incident.severity === "critical" && !["resolved", "closed"].includes(incident.status ?? "")) ||
        (quickFilter === "overdue" && (incident.sla_breached || (incident.sla_deadline && new Date(incident.sla_deadline).getTime() < now && !["resolved", "closed"].includes(incident.status ?? ""))));

      return (
        matchesQuick &&
        (!searchTerm || searchBlob.includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" || incident.status === statusFilter) &&
        (severityFilter === "all" || incident.severity === severityFilter)
      );
    });

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "case") {
        cmp = (a.occurred_at ?? a.created_at ?? "").localeCompare(b.occurred_at ?? b.created_at ?? "");
      } else if (sortKey === "severity") {
        cmp = (severityRank[a.severity ?? ""] ?? 0) - (severityRank[b.severity ?? ""] ?? 0);
      } else if (sortKey === "status") {
        cmp = (statusRank[a.status ?? ""] ?? 0) - (statusRank[b.status ?? ""] ?? 0);
      } else if (sortKey === "evidence") {
        cmp = (evidenceCountByIncident[a.id] ?? 0) - (evidenceCountByIncident[b.id] ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [cases, searchTerm, statusFilter, severityFilter, quickFilter, currentUser?.id, sortKey, sortDir, evidenceCountByIncident]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const allVisibleSelected = filteredCases.length > 0 && filteredCases.every((c) => selectedIds.has(c.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredCases.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      filteredCases.forEach((c) => next.add(c.id));
      return next;
    });
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());


  const selectedCase = useMemo(
    () => filteredCases.find((incident) => incident.id === selectedId) ?? cases.find((incident) => incident.id === selectedId) ?? filteredCases[0] ?? cases[0],
    [cases, filteredCases, selectedId],
  );

  useEffect(() => {
    if (selectedCase) {
      setSelectedId(selectedCase.id);
      setSelectedStatus(selectedCase.status ?? "investigating");
    }
  }, [selectedCase?.id]);

  const selectedTimeline = useMemo(
    () => timeline.filter((item) => item.incident_id === selectedCase?.id).slice(0, 8),
    [timeline, selectedCase?.id],
  );

  const selectedEvidence = useMemo(
    () => evidence.filter((item) => item.incident_id === selectedCase?.id).slice(0, 10),
    [evidence, selectedCase?.id],
  );

  const selectedAttachments = useMemo(
    () => attachments.filter((item) => item.investigation_id === selectedCase?.incident_number).slice(0, 10),
    [attachments, selectedCase?.incident_number],
  );

  const summary = useMemo(() => {
    const activeCases = cases.filter((item) => !["resolved", "closed"].includes(item.status ?? ""));
    const urgentCases = cases.filter((item) => ["critical", "high"].includes(item.severity ?? "") && !["resolved", "closed"].includes(item.status ?? ""));
    const closedCases = cases.filter((item) => ["resolved", "closed"].includes(item.status ?? ""));
    const closureRate = cases.length ? Math.round((closedCases.length / cases.length) * 100) : 0;

    return {
      total: cases.length,
      active: activeCases.length,
      urgent: urgentCases.length,
      evidence: evidence.length,
      closureRate,
    };
  }, [cases, evidence.length]);

  const workload = useMemo(() => {
    const groups = cases.reduce<Record<string, number>>((acc, item) => {
      const key = item.assigned_to ? "Assigned" : "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return [
      { label: "Assigned", value: groups.Assigned ?? 0 },
      { label: "Unassigned", value: groups.Unassigned ?? 0 },
      { label: "Under review", value: cases.filter((item) => item.status === "under_review").length },
    ];
  }, [cases]);

  const displayName = currentUser?.email?.split("@")[0] ?? "Operations Desk";

  const updateCase = async (payload: Partial<IncidentRecord>, successTitle: string, timelineNote?: string) => {
    if (!selectedCase) return;
    setBusyAction(successTitle);
    try {
      const { error } = await supabase.from("incidents").update(payload).eq("id", selectedCase.id);
      if (error) throw error;

      if (timelineNote) {
        await supabase.from("incident_timeline").insert({
          incident_id: selectedCase.id,
          event_type: "investigation_update",
          actor_id: currentUser?.id,
          actor_name: displayName,
          note: timelineNote,
          payload,
        });
      }

      toast({ title: successTitle, description: `${selectedCase.incident_number} updated successfully.` });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message ?? "You may not have permission for this action.",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  // ─── Row-level quick actions ───
  const quickRowAction = async (
    incident: IncidentRecord,
    payload: Partial<IncidentRecord>,
    successTitle: string,
    timelineNote?: string,
  ) => {
    setBusyAction(`${successTitle}-${incident.id}`);
    try {
      const { error } = await supabase.from("incidents").update(payload).eq("id", incident.id);
      if (error) throw error;
      if (timelineNote) {
        await supabase.from("incident_timeline").insert({
          incident_id: incident.id,
          event_type: "investigation_update",
          actor_id: currentUser?.id,
          actor_name: displayName,
          note: timelineNote,
          payload,
        });
      }
      toast({ title: successTitle, description: `${incident.incident_number} updated.` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Action failed", description: error.message ?? "Try again.", variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  };

  const escalateSeverity = (incident: IncidentRecord) => {
    const order = ["low", "medium", "high", "critical"];
    const idx = order.indexOf(incident.severity ?? "medium");
    const next = order[Math.min(order.length - 1, idx + 1)];
    if (next === incident.severity) {
      toast({ title: "Already critical", description: `${incident.incident_number} is at the highest severity.` });
      return;
    }
    return quickRowAction(incident, { severity: next }, "Severity escalated", `Severity escalated to ${titleCase(next)}.`);
  };

  const copyCaseNumber = async (incident: IncidentRecord) => {
    try {
      await navigator.clipboard.writeText(incident.incident_number);
      toast({ title: "Copied", description: `${incident.incident_number} copied to clipboard.` });
    } catch {
      toast({ title: "Unable to copy", variant: "destructive" });
    }
  };

  // ─── Assignment to other investigators ───
  const openAssignDialog = (target: IncidentRecord | "bulk") => {
    setAssignTarget(target);
    setAssignSearch("");
    setAssignDialogOpen(true);
  };

  const assignTo = async (assignee: { id: string; full_name: string; email: string | null }) => {
    if (!assignTarget) return;
    const note = `Case assigned to ${assignee.full_name || assignee.email || "investigator"}.`;
    setBusyAction(`assign-${assignee.id}`);
    try {
      if (assignTarget === "bulk") {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        const { error } = await supabase.from("incidents").update({ assigned_to: assignee.id, status: "assigned" }).in("id", ids);
        if (error) throw error;
        await supabase.from("incident_timeline").insert(
          ids.map((id) => ({
            incident_id: id,
            event_type: "assigned",
            actor_id: currentUser?.id,
            actor_name: displayName,
            note,
            payload: { assigned_to: assignee.id },
          })),
        );
        toast({ title: "Bulk assignment complete", description: `${ids.length} case${ids.length === 1 ? "" : "s"} → ${assignee.full_name}.` });
        clearSelection();
      } else {
        const incident = assignTarget;
        const { error } = await supabase
          .from("incidents")
          .update({ assigned_to: assignee.id, status: incident.status === "open" ? "assigned" : incident.status })
          .eq("id", incident.id);
        if (error) throw error;
        await supabase.from("incident_timeline").insert({
          incident_id: incident.id,
          event_type: "assigned",
          actor_id: currentUser?.id,
          actor_name: displayName,
          note,
          payload: { assigned_to: assignee.id },
        });
        toast({ title: "Case assigned", description: `${incident.incident_number} → ${assignee.full_name}.` });
      }
      setAssignDialogOpen(false);
      setAssignTarget(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Assignment failed", description: error.message ?? "Try again.", variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  };

  const filteredInvestigators = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return investigators;
    return investigators.filter((p) =>
      [p.full_name, p.email].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [investigators, assignSearch]);



  // ─── Bulk actions ───
  const bulkUpdate = async (payload: Partial<IncidentRecord>, label: string, note: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBusyAction(`bulk-${label}`);
    try {
      const { error } = await supabase.from("incidents").update(payload).in("id", ids);
      if (error) throw error;
      await supabase.from("incident_timeline").insert(
        ids.map((id) => ({
          incident_id: id,
          event_type: "investigation_update",
          actor_id: currentUser?.id,
          actor_name: displayName,
          note,
          payload,
        })),
      );
      toast({ title: `${label} applied`, description: `${ids.length} case${ids.length === 1 ? "" : "s"} updated.` });
      clearSelection();
      await loadData();
    } catch (error: any) {
      toast({ title: "Bulk action failed", description: error.message ?? "Try again.", variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  };

  const exportQueueCsv = () => {
    const rows = (selectedIds.size > 0 ? filteredCases.filter((c) => selectedIds.has(c.id)) : filteredCases);
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "Adjust filters or select cases first." });
      return;
    }
    const header = ["Case #", "Title", "Status", "Severity", "Type", "Location", "Assigned", "Opened", "SLA Deadline", "Evidence", "Reports"];
    const lines = rows.map((c) => [
      c.incident_number,
      (c.title ?? "").replace(/"/g, '""'),
      c.status ?? "",
      c.severity ?? "",
      c.incident_type ?? "",
      (c.location ?? "").replace(/"/g, '""'),
      c.assigned_to ? "yes" : "no",
      c.occurred_at ?? c.created_at ?? "",
      c.sla_deadline ?? "",
      evidenceCountByIncident[c.id] ?? 0,
      attachmentCountByCaseNumber[c.incident_number] ?? 0,
    ].map((v) => `"${String(v)}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investigation-queue-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Queue exported", description: `${rows.length} case${rows.length === 1 ? "" : "s"} saved as CSV.` });
  };

  const handleCreateCase = async () => {
    if (!newCase.title || !newCase.location) {
      toast({
        title: "Missing case details",
        description: "Title and location are required.",
        variant: "destructive",
      });
      return;
    }

    setBusyAction("create-case");
    try {
      const { data, error } = await supabase
        .from("incidents")
        .insert({
          incident_number: newCase.incident_number,
          title: newCase.title,
          incident_type: newCase.incident_type,
          severity: newCase.severity,
          status: "open",
          location: newCase.location,
          description: newCase.description,
          occurred_at: new Date().toISOString(),
          reported_by: currentUser?.id ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("incident_timeline").insert({
        incident_id: data.id,
        event_type: "case_created",
        actor_id: currentUser?.id,
        actor_name: displayName,
        note: "Investigation case created from Investigation Management workspace.",
        payload: { source: "investigations" },
      });

      toast({ title: "Case created", description: `${newCase.incident_number} is now in the queue.` });
      setCreateCaseOpen(false);
      setNewCase({
        incident_number: generateCaseNumber(),
        title: "",
        incident_type: "Investigation",
        severity: "medium",
        location: "",
        description: "",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Unable to create case",
        description: error.message ?? "Please verify your access and try again.",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogNote = async () => {
    if (!selectedCase || !noteText.trim()) return;
    setBusyAction("log-note");
    try {
      const { error } = await supabase.from("incident_timeline").insert({
        incident_id: selectedCase.id,
        event_type: "investigation_note",
        actor_id: currentUser?.id,
        actor_name: displayName,
        note: noteText.trim(),
        payload: { module: "investigations" },
      });
      if (error) throw error;

      toast({ title: "Timeline updated", description: `New case note logged for ${selectedCase.incident_number}.` });
      setNoteDialogOpen(false);
      setNoteText("");
      await loadData();
    } catch (error: any) {
      toast({
        title: "Unable to log note",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedCase || !newEvidence.title.trim()) {
      toast({
        title: "Evidence title required",
        description: "Add a title before saving evidence.",
        variant: "destructive",
      });
      return;
    }

    setBusyAction("add-evidence");
    try {
      const { error } = await supabase.from("incident_evidence").insert({
        incident_id: selectedCase.id,
        evidence_type: newEvidence.evidence_type,
        title: newEvidence.title.trim(),
        description: newEvidence.description.trim() || null,
        external_url: newEvidence.external_url.trim() || null,
        collected_by: currentUser?.id ?? null,
        chain_of_custody: [
          {
            event: "collected",
            actor: displayName,
            at: new Date().toISOString(),
            source: "investigations",
          },
        ],
      });
      if (error) throw error;

      toast({ title: "Evidence logged", description: `${newEvidence.title} added to ${selectedCase.incident_number}.` });
      setEvidenceDialogOpen(false);
      setNewEvidence({ evidence_type: "note", title: "", description: "", external_url: "" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Unable to add evidence",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation Management"
        description="Full investigation command workspace for case intake, evidence control, reporting, and review."
        icon={FileSearch}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Open caseload</p>
              <p className="text-3xl font-bold text-foreground">{summary.active}</p>
              <p className="text-xs text-muted-foreground">{summary.total} tracked investigations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Flag className="h-8 w-8 text-alert-caution" />
            <div>
              <p className="text-sm text-muted-foreground">Urgent queue</p>
              <p className="text-3xl font-bold text-foreground">{summary.urgent}</p>
              <p className="text-xs text-muted-foreground">High or critical unresolved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Evidence logged</p>
              <p className="text-3xl font-bold text-foreground">{summary.evidence}</p>
              <p className="text-xs text-muted-foreground">Chain-of-custody records</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-accent-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Workflow movement</p>
              <p className="text-3xl font-bold text-foreground">{timeline.length}</p>
              <p className="text-xs text-muted-foreground">Latest action feed entries</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-alert-normal" />
            <div>
              <p className="text-sm text-muted-foreground">Closure rate</p>
              <p className="text-3xl font-bold text-foreground">{summary.closureRate}%</p>
              <p className="text-xs text-muted-foreground">Resolved and closed cases</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="command" className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 xl:max-w-[640px]">
            <TabsTrigger value="command">Case command board</TabsTrigger>
            <TabsTrigger value="evidence">Evidence & reports</TabsTrigger>
            <TabsTrigger value="activity">Activity & workload</TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={() => setCreateCaseOpen(true)}>
              <Plus className="h-4 w-4" />
              New case
            </Button>
            <Button className="gap-2" onClick={() => setReportFormOpen(true)} disabled={!selectedCase}>
              <FilePlus2 className="h-4 w-4" />
              Open report workspace
            </Button>
          </div>
        </div>

        <TabsContent value="command" className="space-y-4">
          <Card className="p-4 border-border">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1.6fr,0.8fr,0.8fr]">
              <div className="space-y-2">
                <Label htmlFor="investigation-search">Search cases</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="investigation-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Case number, title, location, type"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity filter</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severity</SelectItem>
                    {severityOptions.map((option) => (
                      <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <Card className="border-border overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <h3 className="font-semibold text-foreground">Investigation queue</h3>
                  <p className="text-xs text-muted-foreground">Prioritise by risk, evidence depth, and workflow status.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{filteredCases.length} cases</Badge>
                  <Button size="sm" variant="outline" className="gap-2" onClick={exportQueueCsv}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Quick filter chips */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-2">
                {([
                  { key: "all", label: `All (${cases.length})` },
                  { key: "mine", label: `My cases (${cases.filter((c) => c.assigned_to === currentUser?.id).length})` },
                  { key: "unassigned", label: `Unassigned (${cases.filter((c) => !c.assigned_to).length})` },
                  { key: "overdue", label: `Overdue SLA (${cases.filter((c) => c.sla_breached || (c.sla_deadline && new Date(c.sla_deadline).getTime() < Date.now() && !["resolved", "closed"].includes(c.status ?? ""))).length})` },
                  { key: "critical", label: `Critical (${cases.filter((c) => c.severity === "critical" && !["resolved", "closed"].includes(c.status ?? "")).length})` },
                ] as const).map((chip) => (
                  <Button
                    key={chip.key}
                    size="sm"
                    variant={quickFilter === chip.key ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setQuickFilter(chip.key)}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>

              {/* Bulk action toolbar */}
              {selectedIds.size > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/5 px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge>{selectedIds.size} selected</Badge>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={clearSelection}>
                      <X className="h-3 w-3" /> Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={!currentUser || busyAction !== null}
                      onClick={() => bulkUpdate({ assigned_to: currentUser?.id ?? null, status: "assigned" }, "Assigned to me", `Bulk assigned to ${displayName}.`)}
                    >
                      <UserPlus className="h-3 w-3" /> Assign to me
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={busyAction !== null}
                      onClick={() => openAssignDialog("bulk")}
                    >
                      <UserPlus className="h-3 w-3" /> Assign to…
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={busyAction !== null}
                      onClick={() => bulkUpdate({ status: "investigating" }, "Marked investigating", "Bulk moved to investigating.")}
                    >
                      <FileSearch className="h-3 w-3" /> Mark investigating
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={busyAction !== null}
                      onClick={() => bulkUpdate({ status: "under_review" }, "Sent to review", "Bulk sent to supervisor review.")}
                    >
                      <Flag className="h-3 w-3" /> Send to review
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={busyAction !== null}
                      onClick={() => bulkUpdate({ status: "resolved" }, "Marked resolved", "Bulk resolved from queue.")}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Mark resolved
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="max-h-[680px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all visible cases"
                        />
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("case")}>
                          Case <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                          Status <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("severity")}>
                          Severity <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("evidence")}>
                          Evidence <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading investigation workspace…</TableCell>
                      </TableRow>
                    ) : filteredCases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No cases match the current filters.</TableCell>
                      </TableRow>
                    ) : (
                      filteredCases.map((incident) => {
                        const isOverdue = incident.sla_breached || (incident.sla_deadline && new Date(incident.sla_deadline).getTime() < Date.now() && !["resolved", "closed"].includes(incident.status ?? ""));
                        const isClosed = ["resolved", "closed"].includes(incident.status ?? "");
                        return (
                          <TableRow
                            key={incident.id}
                            className={incident.id === selectedCase?.id ? "bg-muted/40 cursor-pointer" : "cursor-pointer"}
                            onClick={() => setSelectedId(incident.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(incident.id)}
                                onCheckedChange={() => toggleSelectOne(incident.id)}
                                aria-label={`Select ${incident.incident_number}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">{incident.title}</div>
                                <div className="text-xs text-muted-foreground">{incident.incident_number} • {incident.location ?? "No location"}</div>
                                <div className="text-xs text-muted-foreground">{formatRelativeDays(incident.occurred_at ?? incident.created_at)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${statusTone(incident.status)}`}>{titleCase(incident.status)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${severityTone(incident.severity)}`}>{titleCase(incident.severity)}</Badge>
                            </TableCell>
                            <TableCell>{evidenceCountByIncident[incident.id] ?? 0}</TableCell>
                            <TableCell>{attachmentCountByCaseNumber[incident.incident_number] ?? 0}</TableCell>
                            <TableCell>
                              {isClosed ? (
                                <Badge variant="outline" className="text-xs">—</Badge>
                              ) : isOverdue ? (
                                <Badge className="border border-destructive/30 bg-destructive/10 text-destructive text-xs">Breached</Badge>
                              ) : incident.sla_deadline ? (
                                <Badge variant="outline" className="text-xs">On track</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">—</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuLabel>{incident.incident_number}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedId(incident.id); setReportFormOpen(true); }}>
                                    <Briefcase className="mr-2 h-4 w-4" /> Open report workspace
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!currentUser}
                                    onClick={() => quickRowAction(incident, { assigned_to: currentUser?.id ?? null, status: incident.status === "open" ? "assigned" : incident.status }, "Case assigned", `Case assigned to ${displayName}.`)}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" /> Assign to me
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAssignDialog(incident)}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Assign to investigator…
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => quickRowAction(incident, { status: "investigating" }, "Marked investigating", "Case moved to investigating.")}>
                                    <FileSearch className="mr-2 h-4 w-4" /> Mark investigating
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => quickRowAction(incident, { status: "under_review" }, "Sent to review", "Case sent to supervisor review.")}>
                                    <Flag className="mr-2 h-4 w-4" /> Send to review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => escalateSeverity(incident)}>
                                    <TrendingUp className="mr-2 h-4 w-4" /> Escalate severity
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => quickRowAction(incident, { status: "resolved" }, "Marked resolved", "Case resolved.")}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark resolved
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => copyCaseNumber(incident)}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy case number
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>



            <div className="space-y-4">
              <Card className="border-border p-4">
                {selectedCase ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{selectedCase.title}</h3>
                          <Badge className={`border ${statusTone(selectedCase.status)}`}>{titleCase(selectedCase.status)}</Badge>
                          <Badge className={`border ${severityTone(selectedCase.severity)}`}>{titleCase(selectedCase.severity)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedCase.incident_number} • {selectedCase.incident_type ?? "Investigation"}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setReportFormOpen(true)} className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        Report workspace
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Workflow completion</span>
                        <span className="font-medium text-foreground">{investigationProgress(selectedCase.status)}%</span>
                      </div>
                      <Progress value={investigationProgress(selectedCase.status)} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Case location</p>
                        <p className="mt-1 text-sm text-foreground">{selectedCase.location ?? "Not captured"}</p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Opened</p>
                        <p className="mt-1 text-sm text-foreground">{formatDateTime(selectedCase.occurred_at ?? selectedCase.created_at)}</p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Evidence items</p>
                        <p className="mt-1 text-sm text-foreground">{evidenceCountByIncident[selectedCase.id] ?? 0}</p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">SLA watch</p>
                        <p className="mt-1 text-sm text-foreground">
                          {selectedCase.sla_deadline ? formatDateTime(selectedCase.sla_deadline) : selectedCase.sla_breached ? "Breached" : "Monitoring"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Change workflow status</Label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="md:max-w-[240px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => updateCase({ status: selectedStatus }, "Case status updated", `Workflow moved to ${titleCase(selectedStatus)}.`)}
                          disabled={!selectedCase || busyAction !== null || selectedStatus === selectedCase.status}
                        >
                          Save status
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => updateCase({ assigned_to: currentUser?.id ?? null, status: selectedCase.status === "open" ? "assigned" : selectedCase.status }, "Case assigned", `Case assigned to ${displayName}.` )}
                        disabled={!currentUser || busyAction !== null}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign to me
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => openAssignDialog(selectedCase)}
                        disabled={busyAction !== null}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign to…
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setNoteDialogOpen(true)} disabled={busyAction !== null}>
                        <Plus className="h-4 w-4" />
                        Log note
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setEvidenceDialogOpen(true)} disabled={busyAction !== null}>
                        <Link2 className="h-4 w-4" />
                        Add evidence
                      </Button>
                    </div>

                    <div className="rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Investigation brief</p>
                      <p className="mt-2 text-sm text-foreground">
                        {selectedCase.ai_summary || selectedCase.description || "No narrative captured yet. Use the report workspace to build a formal case brief."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">Select a case to inspect its workflow, evidence and reports.</div>
                )}
              </Card>

              <Card className="border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Latest case events</h3>
                    <p className="text-xs text-muted-foreground">Recent movements for the selected investigation.</p>
                  </div>
                  <Badge variant="outline">{selectedTimeline.length}</Badge>
                </div>
                <div className="space-y-3">
                  {selectedTimeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No timeline activity recorded yet.</p>
                  ) : (
                    selectedTimeline.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{titleCase(entry.event_type)}</p>
                            <p className="text-xs text-muted-foreground">{entry.actor_name || "System"}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(entry.event_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">{entry.note || "No note attached."}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
            <Card className="border-border overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="font-semibold text-foreground">Evidence register</h3>
                  <p className="text-xs text-muted-foreground">Physical, digital and referenced evidence tied to active cases.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEvidenceDialogOpen(true)} disabled={!selectedCase}>
                  Add evidence
                </Button>
              </div>
              <div className="max-h-[620px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidence.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No evidence has been recorded yet.</TableCell>
                      </TableRow>
                    ) : (
                      evidence.map((item) => {
                        const caseRef = cases.find((incident) => incident.id === item.incident_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">{item.title}</div>
                                <div className="text-xs text-muted-foreground">{item.description || item.mime_type || "Evidence item"}</div>
                              </div>
                            </TableCell>
                            <TableCell>{caseRef?.incident_number ?? "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{titleCase(item.evidence_type)}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(item.collected_at)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Selected case evidence pack</h3>
                    <p className="text-xs text-muted-foreground">Focused evidence and reporting items for the current case.</p>
                  </div>
                  <Badge variant="outline">{selectedEvidence.length + selectedAttachments.length} items</Badge>
                </div>

                <div className="space-y-3">
                  {selectedCase ? (
                    <>
                      {selectedEvidence.length === 0 && selectedAttachments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No evidence pack assembled yet for {selectedCase.incident_number}.</p>
                      ) : null}

                      {selectedEvidence.map((item) => (
                        <div key={item.id} className="rounded-md border border-border bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{titleCase(item.evidence_type)} • {formatDateTime(item.collected_at)}</p>
                            </div>
                            {item.external_url ? (
                              <a href={item.external_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-4 hover:underline">
                                Open reference
                              </a>
                            ) : null}
                          </div>
                          {item.description ? <p className="mt-2 text-sm text-foreground">{item.description}</p> : null}
                        </div>
                      ))}

                      {selectedAttachments.map((item) => (
                        <div key={item.id} className="rounded-md border border-border bg-muted/20 p-3">
                          <p className="text-sm font-medium text-foreground">{item.document?.title || item.document?.file_name || "Attached report"}</p>
                          <p className="text-xs text-muted-foreground">{item.attachment_type || "Attachment"} • {formatDateTime(item.attached_at)}</p>
                          {item.notes ? <p className="mt-2 text-sm text-foreground">{item.notes}</p> : null}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a case to view its evidence pack.</p>
                  )}
                </div>
              </Card>

              <Card className="border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Reporting control</h3>
                    <p className="text-xs text-muted-foreground">Create or continue a formal investigation report from the selected case.</p>
                  </div>
                  <Button onClick={() => setReportFormOpen(true)} disabled={!selectedCase}>Open report</Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Report-linked docs</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{selectedAttachments.length}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Evidence logged</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{selectedEvidence.length}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest update</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{selectedTimeline[0] ? formatDateTime(selectedTimeline[0].event_at) : "No updates"}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <Card className="border-border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Operational workload</h3>
                  <p className="text-xs text-muted-foreground">Balance queue ownership and review throughput.</p>
                </div>
                <Clock3 className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                {workload.map((item) => (
                  <div key={item.label} className="rounded-md border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-semibold text-foreground">{item.value}</p>
                    </div>
                    <Progress value={summary.total ? (item.value / Math.max(summary.total, 1)) * 100 : 0} className="mt-3 h-2" />
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-alert-caution" />
                  <p className="text-sm font-medium text-foreground">SLA watchlist</p>
                </div>
                <div className="mt-3 space-y-2">
                  {cases
                    .filter((item) => item.sla_breached || (item.severity === "critical" && !["resolved", "closed"].includes(item.status ?? "")))
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.incident_number}</p>
                          <p className="text-xs text-muted-foreground">{item.title}</p>
                        </div>
                        <Badge className={`border ${severityTone(item.severity)}`}>{titleCase(item.severity)}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </Card>

            <Card className="border-border overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-semibold text-foreground">Full activity stream</h3>
                <p className="text-xs text-muted-foreground">Cross-case updates, notes and escalations.</p>
              </div>
              <div className="max-h-[680px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeline.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No activity has been logged yet.</TableCell>
                      </TableRow>
                    ) : (
                      timeline.map((item) => {
                        const caseRef = cases.find((incident) => incident.id === item.incident_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{formatDateTime(item.event_at)}</TableCell>
                            <TableCell>{caseRef?.incident_number ?? "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{titleCase(item.event_type)}</Badge>
                            </TableCell>
                            <TableCell>{item.actor_name || "System"}</TableCell>
                            <TableCell className="max-w-[320px] text-sm text-foreground">{item.note || "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createCaseOpen} onOpenChange={setCreateCaseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create investigation case</DialogTitle>
            <DialogDescription>Open a new investigation intake with core triage details and route it into the live queue.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="case-number">Case number</Label>
              <Input id="case-number" value={newCase.incident_number} onChange={(e) => setNewCase((current) => ({ ...current, incident_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={newCase.severity} onValueChange={(value) => setNewCase((current) => ({ ...current, severity: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {severityOptions.map((option) => (
                    <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="case-title">Case title</Label>
              <Input id="case-title" value={newCase.title} onChange={(e) => setNewCase((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. CCTV tampering suspected" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-type">Investigation type</Label>
              <Input id="case-type" value={newCase.incident_type} onChange={(e) => setNewCase((current) => ({ ...current, incident_type: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-location">Location</Label>
              <Input id="case-location" value={newCase.location} onChange={(e) => setNewCase((current) => ({ ...current, location: e.target.value }))} placeholder="Client site or operational zone" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="case-description">Initial brief</Label>
              <Textarea id="case-description" value={newCase.description} onChange={(e) => setNewCase((current) => ({ ...current, description: e.target.value }))} rows={5} placeholder="Facts known, complainant, scene status, and immediate risk." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateCaseOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} disabled={busyAction === "create-case"}>{busyAction === "create-case" ? "Creating…" : "Create case"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log investigation note</DialogTitle>
            <DialogDescription>Add an operational note to the case timeline for handovers, findings or supervisor review.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="timeline-note">Case note</Label>
            <Textarea id="timeline-note" rows={6} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Record witness contact, scene actions, document requests, or review decisions." />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogNote} disabled={busyAction === "log-note" || !noteText.trim()}>{busyAction === "log-note" ? "Saving…" : "Save note"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add evidence reference</DialogTitle>
            <DialogDescription>Register a new evidence item, note, or external reference under the selected investigation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Evidence type</Label>
              <Select value={newEvidence.evidence_type} onValueChange={(value) => setNewEvidence((current) => ({ ...current, evidence_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="file">File reference</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-title">Title</Label>
              <Input id="evidence-title" value={newEvidence.title} onChange={(e) => setNewEvidence((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. Interview transcript - witness A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-url">Reference URL (optional)</Label>
              <Input id="evidence-url" value={newEvidence.external_url} onChange={(e) => setNewEvidence((current) => ({ ...current, external_url: e.target.value }))} placeholder="Secure document link or vault reference" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-notes">Description</Label>
              <Textarea id="evidence-notes" rows={5} value={newEvidence.description} onChange={(e) => setNewEvidence((current) => ({ ...current, description: e.target.value }))} placeholder="Why it matters, source, and handling notes." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvidence} disabled={busyAction === "add-evidence" || !selectedCase}>{busyAction === "add-evidence" ? "Saving…" : "Add evidence"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign-to dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(o) => { setAssignDialogOpen(o); if (!o) setAssignTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Assign {assignTarget === "bulk" ? `${selectedIds.size} cases` : (assignTarget as IncidentRecord | null)?.incident_number ?? "case"}
            </DialogTitle>
            <DialogDescription>
              Pick an investigator. They will be notified through the case timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>

            {currentUser ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={busyAction !== null}
                onClick={() => assignTo({ id: currentUser.id, full_name: displayName, email: currentUser.email ?? null })}
              >
                <UserPlus className="h-4 w-4" />
                Assign to me ({displayName})
              </Button>
            ) : null}

            <div className="max-h-[320px] overflow-auto rounded-md border border-border">
              {filteredInvestigators.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No investigators match your search.</p>
              ) : (
                filteredInvestigators.map((person) => {
                  const isCurrentAssignee = assignTarget !== "bulk" && (assignTarget as IncidentRecord | null)?.assigned_to === person.id;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40 disabled:opacity-60"
                      onClick={() => assignTo(person)}
                      disabled={busyAction !== null}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{person.full_name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{person.email || "—"}</p>
                      </div>
                      {isCurrentAssignee ? (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Assign</Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {assignTarget !== "bulk" && (assignTarget as IncidentRecord | null)?.assigned_to ? (
              <Button
                variant="ghost"
                className="w-full text-destructive"
                disabled={busyAction !== null}
                onClick={async () => {
                  const inc = assignTarget as IncidentRecord;
                  setBusyAction("unassign");
                  try {
                    const { error } = await supabase.from("incidents").update({ assigned_to: null }).eq("id", inc.id);
                    if (error) throw error;
                    await supabase.from("incident_timeline").insert({
                      incident_id: inc.id,
                      event_type: "assigned",
                      actor_id: currentUser?.id,
                      actor_name: displayName,
                      note: "Case unassigned.",
                      payload: { assigned_to: null },
                    });
                    toast({ title: "Case unassigned", description: `${inc.incident_number} returned to pool.` });
                    setAssignDialogOpen(false);
                    setAssignTarget(null);
                    await loadData();
                  } catch (e: any) {
                    toast({ title: "Unassign failed", description: e.message ?? "Try again.", variant: "destructive" });
                  } finally {
                    setBusyAction(null);
                  }
                }}
              >
                Unassign current investigator
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>



      <InvestigationReportForm
        open={reportFormOpen}
        onOpenChange={setReportFormOpen}
        caseId={selectedCase?.incident_number}
      />
    </div>
  );
};

export default Investigations;