import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface AdvisoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisories: any[];
}

const AdvisoryExportDialog = ({ open, onOpenChange, advisories }: AdvisoryExportDialogProps) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Strategic Advisory Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 28);
    doc.text(`Total Incidents: ${advisories.length}`, 14, 34);
    
    // Summary statistics
    const critical = advisories.filter(a => a.severity === "CRITICAL").length;
    const caution = advisories.filter(a => a.severity === "CAUTION").length;
    const normal = advisories.filter(a => a.severity === "NORMAL").length;
    
    doc.text(`Critical: ${critical} | Caution: ${caution} | Normal: ${normal}`, 14, 40);

    // Advisories table
    const tableData = advisories.map(advisory => [
      advisory.incident_id,
      advisory.category,
      advisory.title.substring(0, 40) + (advisory.title.length > 40 ? '...' : ''),
      advisory.severity,
      advisory.status,
      format(new Date(advisory.timestamp_detected), "PP")
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['ID', 'Category', 'Title', 'Severity', 'Status', 'Detected']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Save
    doc.save(`strategic-advisory-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const generateCSV = () => {
    const headers = ['Incident ID', 'Category', 'Sub-Category', 'Title', 'Description', 'Severity', 'Status', 'Detected', 'Location', 'Recommended Action'];
    const rows = advisories.map(advisory => [
      advisory.incident_id,
      advisory.category,
      advisory.sub_category || '',
      advisory.title,
      advisory.description,
      advisory.severity,
      advisory.status,
      format(new Date(advisory.timestamp_detected), "PPpp"),
      advisory.location_scope_hierarchy?.join(' > ') || '',
      advisory.recommended_action || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategic-advisory-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Log audit trail
      const { data: { user } } = await supabase.auth.getUser();
      
      if (exportFormat === "pdf") {
        generatePDF();
      } else if (exportFormat === "csv") {
        generateCSV();
      }

      // Log export for each advisory
      await Promise.all(advisories.map(advisory => 
        supabase.from("strategic_advisory_audit").insert({
          advisory_id: advisory.id,
          action: "Exported",
          performed_by: user?.id,
          action_details: { format: exportFormat }
        })
      ));

      toast({ 
        title: "Export Complete", 
        description: `Report exported successfully in ${exportFormat.toUpperCase()} format.` 
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Export Strategic Advisory Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {exportFormat === "pdf" 
                ? "Formatted PDF report with summary statistics and incident details."
                : "Raw data export for analysis in Excel or other tools."}
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
            <p><span className="font-semibold">Total Incidents:</span> {advisories.length}</p>
            <p><span className="font-semibold">Critical:</span> {advisories.filter(a => a.severity === "CRITICAL").length}</p>
            <p><span className="font-semibold">Caution:</span> {advisories.filter(a => a.severity === "CAUTION").length}</p>
            <p><span className="font-semibold">Normal:</span> {advisories.filter(a => a.severity === "NORMAL").length}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvisoryExportDialog;