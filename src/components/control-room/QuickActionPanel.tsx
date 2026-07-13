import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Radio, Phone, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IncidentCreateDialog } from "./IncidentCreateDialog";
import { RadioCallDialog } from "./RadioCallDialog";
import { RequestBackupDialog } from "./RequestBackupDialog";

interface QuickActionPanelProps {
  onRefresh?: () => void;
}

const QuickActionPanel = ({ onRefresh }: QuickActionPanelProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showRadioDialog, setShowRadioDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const currentPlatform = (() => {
    if (typeof window === "undefined") return null;
    const match = window.location.pathname.match(/^\/platform\/([^/]+)/);
    return match?.[1] ?? null;
  })();

  const quickActions = [
    {
      label: "Create Incident",
      icon: AlertTriangle,
      color: "bg-alert-critical hover:bg-alert-critical/90",
      action: () => setShowIncidentDialog(true)
    },
    {
      label: "Dispatch Unit",
      icon: Radio,
      color: "bg-primary hover:bg-primary/90",
      action: () => navigate(currentPlatform ? `/platform/${currentPlatform}/m/mdt` : "/mdt")
    },
    {
      label: "Log Radio Call",
      icon: Phone,
      color: "bg-alert-caution hover:bg-alert-caution/90",
      action: () => setShowRadioDialog(true)
    },
    {
      label: "Request Backup",
      icon: Users,
      color: "bg-alert-normal hover:bg-alert-normal/90",
      action: () => setShowBackupDialog(true)
    }
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className={cn(
          "flex flex-col-reverse gap-3 transition-all duration-300",
          isExpanded ? "mb-3" : "mb-0"
        )}>
          {isExpanded && quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={cn(
                "w-56 justify-start gap-3 shadow-glow-strong",
                action.color
              )}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-14 h-14 rounded-full shadow-glow-strong",
            isExpanded ? "bg-muted hover:bg-muted/90" : "bg-gradient-command hover:bg-primary"
          )}
        >
          <Plus className={cn(
            "w-6 h-6 transition-transform duration-300",
            isExpanded ? "rotate-45" : "rotate-0"
          )} />
        </Button>
      </div>

      <IncidentCreateDialog
        open={showIncidentDialog}
        onOpenChange={setShowIncidentDialog}
        onSuccess={() => {
          onRefresh?.();
          setShowIncidentDialog(false);
        }}
      />
      <RadioCallDialog open={showRadioDialog} onOpenChange={setShowRadioDialog} onSuccess={onRefresh} />
      <RequestBackupDialog open={showBackupDialog} onOpenChange={setShowBackupDialog} onSuccess={onRefresh} />
    </>
  );
};

export default QuickActionPanel;
