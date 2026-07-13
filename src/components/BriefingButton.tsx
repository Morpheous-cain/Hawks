import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const BriefingButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBriefing = async () => {
    setIsGenerating(true);
    toast.info("Generating 24-hour intelligence briefing...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-briefing', {
        body: {}
      });

      if (error) {
        console.error('Briefing generation error:', error);
        
        // Check if it's a 402 payment required error
        if (error.message?.includes('credits') || error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add credits in Settings → Workspace → Usage to continue using AI features.', {
            duration: 8000
          });
        } else {
          toast.error('Failed to generate briefing');
        }
        return;
      }

      if (data?.success && data?.html) {
        // Open briefing in new window for printing/saving
        const briefingWindow = window.open('', '_blank');
        if (briefingWindow) {
          briefingWindow.document.write(data.html);
          briefingWindow.document.close();
          
          // Wait a moment for content to load, then trigger print dialog
          setTimeout(() => {
            briefingWindow.print();
          }, 500);
          
          toast.success(`Briefing generated with ${data.stats.total} advisories`);
        } else {
          toast.error('Please allow pop-ups to view the briefing');
        }
      }
    } catch (err) {
      console.error('Exception generating briefing:', err);
      toast.error('An error occurred while generating the briefing');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateBriefing}
      disabled={isGenerating}
      variant="outline"
      className="gap-2"
    >
      <FileText className="w-4 h-4" />
      {isGenerating ? 'Generating...' : '24hr Briefing PDF'}
    </Button>
  );
};

export default BriefingButton;
