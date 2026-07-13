import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, PhoneOff, Pause, Play, FileText, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DialPad from "./DialPad";
import ESimManager from "./ESimManager";

const CallHandlingScreen = () => {
  const { toast } = useToast();
  const [callData, setCallData] = useState({
    caller_name: "",
    caller_number: "",
    source_line: "Main Hotline",
    purpose: "",
    priority: "normal",
    notes: "",
  });

  const [onCall, setOnCall] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [selectedSimId, setSelectedSimId] = useState<string>("");

  const handleDialPadCall = (number: string) => {
    setCallData({ ...callData, caller_number: number });
    setOnCall(true);
  };

  const handleAnswerCall = () => {
    setOnCall(true);
    toast({
      title: "Call Connected",
      description: "You are now connected to the caller",
    });
  };

  const handleEndCall = async () => {
    if (!callData.caller_number) {
      toast({
        title: "Missing Information",
        description: "Please fill in caller details before ending",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("calls").insert([{
        call_number: '',
        caller_name: callData.caller_name,
        caller_number: callData.caller_number,
        source_line: callData.source_line,
        purpose: callData.purpose,
        priority: callData.priority as "low" | "normal" | "high" | "emergency",
        notes: callData.notes,
        status: "ended" as const,
        answered_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast({
        title: "Call Ended",
        description: "Call logged successfully",
      });
      
      setOnCall(false);
      setCallData({
        caller_name: "",
        caller_number: "",
        source_line: "Main Hotline",
        purpose: "",
        priority: "normal",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
    }
  };

  const handleCreateTicket = async () => {
    try {
      const { error } = await supabase.from("communication_tickets").insert([{
        ticket_number: '',
        channel: "phone" as const,
        sender_name: callData.caller_name,
        sender_contact: callData.caller_number,
        subject: callData.purpose || "Phone Call",
        message: callData.notes,
        priority: callData.priority as "low" | "normal" | "high" | "emergency",
        status: "new" as const,
      }]);

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: "Communication ticket opened successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* eSIM and Dial Pad Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ESimManager onSimSelect={setSelectedSimId} />
        <DialPad onCall={handleDialPadCall} selectedSimId={selectedSimId} />
      </div>

      {/* Call Handling Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Call Control Panel */}
      <Card className="p-6 lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Call Handling Workspace
          </h3>
          <div className="flex gap-2">
            {!onCall ? (
              <Button onClick={handleAnswerCall} className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Answer Call
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setOnHold(!onHold)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {onHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {onHold ? "Resume" : "Hold"}
                </Button>
                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              </>
            )}
          </div>
        </div>

        {onCall && (
          <div className="p-4 bg-alert-normal/10 border-2 border-alert-normal rounded-lg">
            <p className="text-center font-semibold text-alert-normal">
              {onHold ? "CALL ON HOLD" : "CALL IN PROGRESS"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="caller_name">Caller Name</Label>
            <Input
              id="caller_name"
              value={callData.caller_name}
              onChange={(e) => setCallData({ ...callData, caller_name: e.target.value })}
              placeholder="Enter caller name"
            />
          </div>
          <div>
            <Label htmlFor="caller_number">Caller Number</Label>
            <Input
              id="caller_number"
              value={callData.caller_number}
              onChange={(e) => setCallData({ ...callData, caller_number: e.target.value })}
              placeholder="+254..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="source_line">Source Line</Label>
            <Select value={callData.source_line} onValueChange={(v) => setCallData({ ...callData, source_line: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main Hotline">Main Hotline</SelectItem>
                <SelectItem value="Client Line 1">Client Line 1</SelectItem>
                <SelectItem value="Client Line 2">Client Line 2</SelectItem>
                <SelectItem value="Patrol Line">Patrol Line</SelectItem>
                <SelectItem value="Emergency Line">Emergency Line</SelectItem>
                <SelectItem value="Radio Bridge">Radio Bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={callData.priority} onValueChange={(v) => setCallData({ ...callData, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="purpose">Purpose / Issue</Label>
          <Input
            id="purpose"
            value={callData.purpose}
            onChange={(e) => setCallData({ ...callData, purpose: e.target.value })}
            placeholder="Brief description of the call purpose"
          />
        </div>

        <div>
          <Label htmlFor="notes">Call Notes</Label>
          <Textarea
            id="notes"
            value={callData.notes}
            onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
            placeholder="Detailed notes about the conversation..."
            rows={6}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreateTicket} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Ticket
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Dispatch
          </Button>
        </div>
      </Card>

      {/* Quick Actions & Reference */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Link to Client Record
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Link to Site
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Create DOB Entry
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Trigger Alarm Response
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Request Patrol
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-3">Emergency Protocols</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="font-semibold text-alert-critical">RED:</span>
              <span>Life threat - immediate dispatch + police</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-alert-caution">AMBER:</span>
              <span>Security breach - dispatch response team</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-alert-normal">GREEN:</span>
              <span>Routine - log and assign to patrol</span>
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default CallHandlingScreen;