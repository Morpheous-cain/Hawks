import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "danger" | "warning" | "success";
  hint?: string;
}

const TONE: Record<string, string> = {
  default: "border-border/60 hover:border-primary/60",
  primary: "border-primary/40 bg-primary/5 hover:bg-primary/10",
  danger: "border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
  warning: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
  success: "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
};

const ICON_TONE: Record<string, string> = {
  default: "text-foreground",
  primary: "text-primary",
  danger: "text-red-500",
  warning: "text-amber-500",
  success: "text-emerald-500",
};

interface Props {
  actions: QuickAction[];
  onSelect: (id: string) => void;
}

export const QuickActionGrid = ({ actions, onSelect }: Props) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {actions.map((a, i) => (
      <motion.div
        key={a.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <Card
          onClick={() => onSelect(a.id)}
          className={cn(
            "flex min-h-[96px] cursor-pointer flex-col items-start justify-between gap-2 p-4 transition-all",
            TONE[a.tone ?? "default"]
          )}
        >
          <a.icon className={cn("h-5 w-5", ICON_TONE[a.tone ?? "default"])} />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-tight text-foreground">{a.label}</p>
            {a.hint && <p className="text-[10px] text-muted-foreground">{a.hint}</p>}
          </div>
        </Card>
      </motion.div>
    ))}
  </div>
);

export default QuickActionGrid;
