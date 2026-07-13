import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Summarise the last 24h of incidents.",
  "Draft a client advisory for a perimeter breach.",
  "Which sites are at highest risk right now?",
  "Write a DOB entry for an alarm response at Westlands.",
];

export const CopilotDrawer = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Black Hawk Co-Pilot online. Ask me about incidents, draft advisories, or summarise operations." },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("copilot-assistant", {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(m => [...m, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch (e: any) {
      toast.error(e.message || "Co-Pilot error");
      setMessages(m => [...m, { role: "assistant", content: `⚠️ ${e.message || "Request failed."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Black Hawk Co-Pilot"
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-0.5"
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold hidden sm:inline">Co-Pilot</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-primary/30">
          <SheetHeader className="px-5 py-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                Black Hawk Co-Pilot
              </SheetTitle>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">AI assistant for security operations · Gemini 2.5 Flash</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-card border border-border/60"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Co-Pilot is thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-2 py-1 rounded-full border border-border/60 hover:border-primary/60 hover:text-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-border/60 p-3 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Co-Pilot…"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CopilotDrawer;
