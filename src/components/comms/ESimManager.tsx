import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle2, XCircle, Signal, SignalHigh, SignalLow, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ESimCard {
  id: string;
  name: string;
  carrier: string;
  phoneNumber: string;
  status: "active" | "inactive" | "disconnected";
  signalStrength: "excellent" | "good" | "poor";
  dataUsed: string;
  dataLimit: string;
}

interface ESimManagerProps {
  onSimSelect?: (simId: string) => void;
}

const ESimManager = ({ onSimSelect }: ESimManagerProps) => {
  const { toast } = useToast();
  const [selectedSim, setSelectedSim] = useState<string | null>("esim-1");
  const [simCards] = useState<ESimCard[]>([
    {
      id: "esim-1",
      name: "Primary Line",
      carrier: "Safaricom",
      phoneNumber: "+254 712 345 678",
      status: "active",
      signalStrength: "excellent",
      dataUsed: "2.3 GB",
      dataLimit: "10 GB",
    },
    {
      id: "esim-2",
      name: "Backup Line",
      carrier: "Airtel",
      phoneNumber: "+254 733 456 789",
      status: "active",
      signalStrength: "good",
      dataUsed: "1.1 GB",
      dataLimit: "5 GB",
    },
    {
      id: "esim-3",
      name: "Emergency Line",
      carrier: "Telkom",
      phoneNumber: "+254 777 567 890",
      status: "inactive",
      signalStrength: "poor",
      dataUsed: "0.5 GB",
      dataLimit: "3 GB",
    },
  ]);

  const handleSimSelect = (simId: string) => {
    const sim = simCards.find((s) => s.id === simId);
    if (sim?.status === "active") {
      setSelectedSim(simId);
      onSimSelect?.(simId);
      toast({
        title: "eSIM Selected",
        description: `Now using ${sim.name} - ${sim.carrier}`,
      });
    } else {
      toast({
        title: "eSIM Unavailable",
        description: "This eSIM is currently inactive",
        variant: "destructive",
      });
    }
  };

  const getSignalIcon = (strength: string) => {
    switch (strength) {
      case "excellent":
        return <Signal className="h-4 w-4 text-alert-normal" />;
      case "good":
        return <SignalHigh className="h-4 w-4 text-alert-caution" />;
      case "poor":
        return <SignalLow className="h-4 w-4 text-alert-critical" />;
      default:
        return <SignalLow className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-alert-normal/20 text-alert-normal border-alert-normal">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          eSIM Management
        </h3>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {simCards.map((sim) => (
          <Card
            key={sim.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedSim === sim.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => handleSimSelect(sim.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{sim.name}</h4>
                  {selectedSim === sim.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{sim.carrier}</p>
              </div>
              {getStatusBadge(sim.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Number:</span>
                <span className="font-mono">{sim.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signal:</span>
                <div className="flex items-center gap-1">
                  {getSignalIcon(sim.signalStrength)}
                  <span className="capitalize">{sim.signalStrength}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Usage:</span>
                <span>
                  {sim.dataUsed} / {sim.dataLimit}
                </span>
              </div>

              {selectedSim === sim.id && (
                <div className="mt-3 p-2 bg-primary/10 rounded text-xs text-center font-semibold text-primary">
                  Currently Active
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="pt-4 border-t space-y-2">
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Smartphone className="mr-2 h-4 w-4" />
          Add New eSIM
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Configure Settings
        </Button>
      </div>
    </Card>
  );
};

export default ESimManager;
