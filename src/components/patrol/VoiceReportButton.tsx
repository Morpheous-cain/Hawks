import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Square } from "lucide-react";
import useVoiceToText from "@/hooks/useVoiceToText";
import { useEffect } from "react";

interface VoiceReportButtonProps {
  onTranscriptChange: (text: string) => void;
  className?: string;
}

const VoiceReportButton = ({ onTranscriptChange, className }: VoiceReportButtonProps) => {
  const { isListening, transcript, interimTranscript, isSupported, startListening, stopListening, error } = useVoiceToText();

  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  if (!isSupported) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? (
            <>
              <Square className="w-4 h-4 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-1" />
              Voice
            </>
          )}
        </Button>
        {isListening && (
          <Badge variant="destructive" className="animate-pulse">
            <Mic className="w-3 h-3 mr-1" /> Recording...
          </Badge>
        )}
      </div>
      {isListening && interimTranscript && (
        <p className="text-xs text-muted-foreground mt-1 italic">{interimTranscript}</p>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default VoiceReportButton;
