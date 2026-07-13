import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export interface KpiTile { label: string; value: string | number; hint?: string; }

interface Props {
  title: string;
  description?: string;
  icon: LucideIcon;
  kpis?: KpiTile[];
  actions?: ReactNode;
  onExport?: () => void;
  children: ReactNode;
}

/**
 * Consistent layout for new HR/Finance/Payroll/Governance/System modules.
 * Page header → KPI row → action row → main content (table + dialogs).
 */
export const ModuleScaffold = ({
  title, description, icon, kpis = [], actions, onExport, children,
}: Props) => (
  <div className="min-h-screen bg-background">
    <PageHeader title={title} description={description} icon={icon} />
    <main className="container mx-auto px-4 py-6 space-y-6">
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-semibold mt-1">{k.value}</div>
              {k.hint && <div className="text-[11px] text-muted-foreground mt-1">{k.hint}</div>}
            </Card>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">{actions}</div>
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        )}
      </div>
      {children}
    </main>
  </div>
);

export default ModuleScaffold;
