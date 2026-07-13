/**
 * Digital Occurrence Book — primary control-room console.
 *
 * Architecture (template pattern — replicable):
 *   ┌──────────────────────────────────────────────┐
 *   │  Page (this file) — UI + local UI state      │
 *   │     ├── useDOBEntries() ── Supabase + RT     │
 *   │     ├── DOBEntryForm     — create dialog     │
 *   │     ├── DOBEditDialog    — update dialog     │
 *   │     └── DOBDetailDrawer  — read-only view    │
 *   └──────────────────────────────────────────────┘
 *
 * To clone for a new module: copy this file + useDOBEntries.ts, rename, and
 * swap the table + row mapper. Filters, stats, bulk-ops and pagination are
 * all driven by the hook so they come along for free.
 */
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DOBEntryForm from "@/components/DOBEntryForm";
import OperationsTeamOBPanel from "@/components/dob/OperationsTeamOBPanel";
import FieldOpsOBPanel from "@/components/dob/FieldOpsOBPanel";
import DOBEditDialog from "@/components/dob/DOBEditDialog";
import DOBDetailDrawer from "@/components/dob/DOBDetailDrawer";
import {
  BookOpen, Plus, Search, Download, FileText, FileJson, Trash2,
  Users, Shield, Eye, Pencil, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportToCSV, exportToJSON, exportToPDF } from "@/utils/exportData";
import { toast } from "@/hooks/use-toast";
import useDOBEntries, { DOB_TYPE_CONFIG, type DOBEntry, type DOBEntryType } from "@/hooks/useDOBEntries";

const PAGE_SIZE = 25;

const DOB = () => {
  // ── UI state ───────────────────────────────────────────────────────────
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editing, setEditing] = useState<DOBEntry | null>(null);
  const [viewing, setViewing] = useState<DOBEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<DOBEntryType | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  // ── Data ───────────────────────────────────────────────────────────────
  const { entries, loading, stats, actions, error } = useDOBEntries({
    search: searchQuery, type: filterType, from: fromDate, to: toDate,
  });

  // Pagination derived from filtered entries.
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount - 1);
  const pageRows  = useMemo(
    () => entries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [entries, safePage],
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAllOnPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  };
  const clearFilters = () => {
    setSearchQuery(""); setFilterType("all"); setFromDate(""); setToDate(""); setPage(0);
  };
  const runDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (Array.isArray(confirmDelete)) {
        await actions.removeMany(confirmDelete);
        setSelected(new Set());
      } else {
        await actions.remove(confirmDelete);
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

  /** Exports always operate on the *currently filtered* set. */
  const handleExport = (fmt: "csv" | "json" | "pdf") => {
    const exportData = entries.map((e) => ({
      "Entry No": e.entryNo, Date: e.date, Time: e.time,
      Officer: e.officer, Nature: e.nature, Signature: e.signature,
      Site: e.site, Type: DOB_TYPE_CONFIG[e.type].label,
    }));
    if (exportData.length === 0) {
      toast({ title: "Nothing to export", description: "No entries match the current filters." });
      return;
    }
    if (fmt === "csv")  exportToCSV(exportData, "OB_Entries");
    if (fmt === "json") exportToJSON(exportData, "OB_Entries");
    if (fmt === "pdf")  exportToPDF(exportData, "OB_Entries", "Black Hawk SOC-OS — Occurrence Book Entries");
    toast({ title: "Export complete", description: `${exportData.length} entries exported as ${fmt.toUpperCase()}.` });
  };

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Occurrence Book (OB) / Incident Entry Log"
        description="Black Hawk SOC-OS — standard operational procedure for OB entries"
        icon={BookOpen}
      />

      <Tabs defaultValue="occurrence-book" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="occurrence-book" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Occurrence Book
          </TabsTrigger>
          <TabsTrigger value="operations-team" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Operations Team O.B
          </TabsTrigger>
          <TabsTrigger value="field-ops" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Field Ops O.B
          </TabsTrigger>
        </TabsList>

        <TabsContent value="occurrence-book" className="space-y-6">
          {/* Real stats — derived from data, no placeholder percentages. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Today's Entries"   value={stats.todayTotal} />
            <StatCard label="Last 24h"          value={stats.last24Total} />
            <StatCard label="Handover Events"   value={stats.handovers} />
            <StatCard label="Critical Incidents" value={stats.critical} accent />
          </div>

          {/* Filters */}
          <Card className="p-4 border-border">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  placeholder="Search by ID, officer, site, details…"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                />
              </div>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v as any); setPage(0); }}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(Object.entries(DOB_TYPE_CONFIG) as [DOBEntryType, { label: string }][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} className="w-full lg:w-[150px]" aria-label="From date" />
              <Input type="date" value={toDate}   onChange={(e) => { setToDate(e.target.value);   setPage(0); }} className="w-full lg:w-[150px]" aria-label="To date" />
              {(searchQuery || filterType !== "all" || fromDate || toDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => actions.refresh()} title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="w-4 h-4 mr-2" /> PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}><FileText className="w-4 h-4 mr-2" /> CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}><FileJson className="w-4 h-4 mr-2" /> JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2 bg-gradient-command" onClick={() => setIsNewEntryOpen(true)}>
                <Plus className="w-4 h-4" /> New Entry
              </Button>
            </div>
            {selected.size > 0 && (
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="font-medium">{selected.size} selected</span>
                <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(Array.from(selected))}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </Card>

          {/* Table */}
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(c) => toggleAllOnPage(Boolean(c))}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead className="w-20">Entry No.</TableHead>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-20">Time</TableHead>
                    <TableHead className="min-w-[180px]">Officer</TableHead>
                    <TableHead className="min-w-[280px]">Nature of Occurrence</TableHead>
                    <TableHead className="min-w-[160px]">Site</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Loading entries…</TableCell></TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No entries found. {searchQuery || filterType !== "all" || fromDate || toDate ? "Try adjusting your filters." : "Add your first entry to get started."}
                    </TableCell></TableRow>
                  ) : (
                    pageRows.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-secondary/50">
                        <TableCell>
                          <Checkbox checked={selected.has(entry.id)} onCheckedChange={() => toggleRow(entry.id)} aria-label={`Select ${entry.entryNo}`} />
                        </TableCell>
                        <TableCell className="font-bold">{entry.entryNo}</TableCell>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.time}</TableCell>
                        <TableCell>{entry.officer}</TableCell>
                        <TableCell className="max-w-md truncate" title={entry.nature}>{entry.nature}</TableCell>
                        <TableCell className="truncate max-w-[200px]" title={entry.site}>{entry.site}</TableCell>
                        <TableCell>
                          <Badge className={`border ${DOB_TYPE_CONFIG[entry.type].color}`}>{DOB_TYPE_CONFIG[entry.type].label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewing(entry)} title="View"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditing(entry)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(entry.id)} title="Delete" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination footer */}
            {!loading && entries.length > 0 && (
              <div className="flex items-center justify-between p-3 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, entries.length)} of {entries.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {safePage + 1} / {pageCount}</span>
                  <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Dialogs */}
          <DOBEntryForm
            open={isNewEntryOpen}
            onOpenChange={setIsNewEntryOpen}
            onSubmit={() => actions.refresh()}
            nextEntryNumber={String(stats.total + 1).padStart(3, "0")}
          />
          <DOBEditDialog
            entry={editing}
            onOpenChange={(o) => !o && setEditing(null)}
            onSave={async (id, patch) => { await actions.update(id, patch); setEditing(null); }}
          />
          <DOBDetailDrawer entry={viewing} onOpenChange={(o) => !o && setViewing(null)} />

          <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {Array.isArray(confirmDelete) ? `${confirmDelete.length} entries` : "this entry"}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. The entry will be permanently removed from the occurrence book.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={runDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="operations-team"><OperationsTeamOBPanel /></TabsContent>
        <TabsContent value="field-ops"><FieldOpsOBPanel /></TabsContent>
      </Tabs>
    </div>
  );
};

/** Small presentational stat card — kept inline so the page is self-contained. */
const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <Card className="p-4 border-border">
    <p className="text-sm font-semibold text-primary mb-1">{label}</p>
    <p className={`text-3xl font-bold ${accent ? "text-destructive" : "text-foreground"}`}>{value}</p>
  </Card>
);

export default DOB;
