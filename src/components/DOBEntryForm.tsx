import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "@/hooks/use-toast";

interface OBEntry {
  entryNo: string;
  date: string;
  time: string;
  officer: string;
  nature: string;
  signature: string;
  remarks: string;
  type: string;
}

interface DOBEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: OBEntry) => void;
  nextEntryNumber: string;
}

const DOBEntryForm = ({ open, onOpenChange, onSubmit, nextEntryNumber }: DOBEntryFormProps) => {
  const [formData, setFormData] = useState({
    entryNumber: nextEntryNumber,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    officerName: "",
    entryType: "",
    natureOfOccurrence: "",
    signature: "",
    remarks: "",
  });

  // Update entry number when prop changes
  useState(() => {
    setFormData(prev => ({ ...prev, entryNumber: nextEntryNumber }));
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, entryType: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format date to DD/MM/YYYY
    const [year, month, day] = formData.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    // Format time to 12-hour format
    const [hours, minutes] = formData.time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;

    const newEntry: OBEntry = {
      entryNo: formData.entryNumber,
      date: formattedDate,
      time: formattedTime,
      officer: formData.officerName,
      nature: formData.natureOfOccurrence,
      signature: formData.signature,
      remarks: formData.remarks,
      type: formData.entryType,
    };

    onSubmit(newEntry);

    // Reset form
    setFormData({
      entryNumber: String(parseInt(nextEntryNumber) + 1).padStart(3, '0'),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      officerName: "",
      entryType: "",
      natureOfOccurrence: "",
      signature: "",
      remarks: "",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New OB Entry</DialogTitle>
          <DialogDescription>
            Create a new Occurrence Book entry. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryNumber">Entry Number *</Label>
              <Input
                id="entryNumber"
                name="entryNumber"
                value={formData.entryNumber}
                onChange={handleInputChange}
                placeholder="e.g., 001, 002, 003"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select
                value={formData.entryType}
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taking_over">Taking Over (Start of shift)</SelectItem>
                  <SelectItem value="handover">Handover (End of shift)</SelectItem>
                  <SelectItem value="closing">Midnight Closing (23:59)</SelectItem>
                  <SelectItem value="opening">Opening (00:01)</SelectItem>
                  <SelectItem value="late_entry">Late Entry of OB</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="normal">Normal Occurrence</SelectItem>
                  <SelectItem value="supervisor_patrol">Supervisor Patrol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="officerName">Name of Officer Making Entry *</Label>
            <Input
              id="officerName"
              name="officerName"
              value={formData.officerName}
              onChange={handleInputChange}
              placeholder="e.g., Sgt. Hassan / Sgt. Wekesa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="natureOfOccurrence">Nature of Occurrence / Details *</Label>
            <Textarea
              id="natureOfOccurrence"
              name="natureOfOccurrence"
              value={formData.natureOfOccurrence}
              onChange={handleInputChange}
              placeholder="Describe the occurrence in detail..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Signature of the Officer Making Entry *</Label>
            <Input
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              placeholder="Officer's signature/initials"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Additional remarks or observations..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-command">
              Create Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DOBEntryForm;
