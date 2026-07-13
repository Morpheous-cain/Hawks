import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { downloadShiftReport } from "@/utils/shiftReportGenerator";
import { toast } from "sonner";
import { format } from "date-fns";

const ShiftReportGenerator = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shiftType, setShiftType] = useState('all');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const fileName = await downloadShiftReport(date, shiftType);
      toast.success(`Report downloaded: ${fileName}`);
    } catch (err) {
      console.error('Report generation error:', err);
      toast.error('Failed to generate shift report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Automated Shift Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a comprehensive PDF report including attendance, patrol checkpoints, incidents, and DOB entries.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Report Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Shift</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="day">Day Shift</SelectItem>
                <SelectItem value="night">Night Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShiftReportGenerator;
