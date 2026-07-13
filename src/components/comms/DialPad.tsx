import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DialPadProps {
  onCall?: (number: string) => void;
  selectedSimId?: string;
}

const DialPad = ({ onCall, selectedSimId }: DialPadProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const handleNumberClick = (num: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(phoneNumber + num);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber) {
      toast({
        title: "No Number Entered",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSimId) {
      toast({
        title: "No eSIM Selected",
        description: "Please select an eSIM card first",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    toast({
      title: "Calling...",
      description: `Dialing ${phoneNumber} via eSIM ${selectedSimId}`,
    });
    
    onCall?.(phoneNumber);
  };

  const handleHangup = () => {
    setIsCalling(false);
    setPhoneNumber("");
    toast({
      title: "Call Ended",
      description: "Call disconnected",
    });
  };

  const dialPadButtons = [
    { num: "1", sub: "" },
    { num: "2", sub: "ABC" },
    { num: "3", sub: "DEF" },
    { num: "4", sub: "GHI" },
    { num: "5", sub: "JKL" },
    { num: "6", sub: "MNO" },
    { num: "7", sub: "PQRS" },
    { num: "8", sub: "TUV" },
    { num: "9", sub: "WXYZ" },
    { num: "*", sub: "" },
    { num: "0", sub: "+" },
    { num: "#", sub: "" },
  ];

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Dial Pad</h3>
        {selectedSimId && (
          <p className="text-xs text-muted-foreground">
            Using eSIM: {selectedSimId}
          </p>
        )}
      </div>

      {/* Phone Number Display */}
      <div className="relative">
        <div className="h-16 flex items-center justify-center bg-muted rounded-lg px-4">
          <span className="text-2xl font-mono tracking-wider">
            {phoneNumber || "Enter Number"}
          </span>
        </div>
        {phoneNumber && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={handleBackspace}
          >
            <Delete className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Call Status */}
      {isCalling && (
        <div className="p-3 bg-alert-normal/10 border border-alert-normal rounded-lg text-center">
          <p className="text-sm font-semibold text-alert-normal">Call in Progress</p>
        </div>
      )}

      {/* Dial Pad Grid */}
      <div className="grid grid-cols-3 gap-3">
        {dialPadButtons.map((btn) => (
          <Button
            key={btn.num}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center hover:bg-primary/10"
            onClick={() => handleNumberClick(btn.num)}
            disabled={isCalling}
          >
            <span className="text-2xl font-semibold">{btn.num}</span>
            {btn.sub && (
              <span className="text-[10px] text-muted-foreground">{btn.sub}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Call Controls */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          onClick={handleCall}
          disabled={isCalling || !phoneNumber}
          className="h-14 bg-alert-normal hover:bg-alert-normal/90"
        >
          <Phone className="mr-2 h-5 w-5" />
          Call
        </Button>
        <Button
          onClick={handleHangup}
          disabled={!isCalling}
          variant="destructive"
          className="h-14"
        >
          <PhoneOff className="mr-2 h-5 w-5" />
          End
        </Button>
      </div>
    </Card>
  );
};

export default DialPad;
