import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calculator, TrendingUp } from "lucide-react";

const fmt = (n: number) => "KES " + n.toLocaleString("en-KE");

export const ROICalculator = () => {
  const [sites, setSites] = useState(15);
  const [guards, setGuards] = useState(120);
  const [incidents, setIncidents] = useState(40);

  const numbers = useMemo(() => {
    const responseSavings = incidents * 4500; // shorter response → less loss per incident
    const falseAlarmSaving = incidents * 0.4 * 1500;
    const payrollEfficiency = guards * 800; // automation saves admin hours
    const auditHours = sites * 6; // hours saved on audit prep / month
    const auditValue = auditHours * 1500;
    const total = responseSavings + falseAlarmSaving + payrollEfficiency + auditValue;
    return { responseSavings, falseAlarmSaving, payrollEfficiency, auditValue, auditHours, total };
  }, [sites, guards, incidents]);

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">ROI Estimator</div>
          <h3 className="text-xl font-bold">Estimated monthly savings with Black Hawk SOC-OS</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[
            { label: "Sites under management", v: sites, set: setSites, min: 1, max: 200, step: 1 },
            { label: "Guards deployed", v: guards, set: setGuards, min: 5, max: 2000, step: 5 },
            { label: "Monthly incidents (all severities)", v: incidents, set: setIncidents, min: 0, max: 500, step: 1 },
          ].map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono font-semibold">{s.v.toLocaleString()}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step} value={s.v}
                onChange={(e) => s.set(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[
            { l: "Faster response → reduced loss", v: numbers.responseSavings },
            { l: "False-alarm cost reduction", v: numbers.falseAlarmSaving },
            { l: "Payroll & admin efficiency", v: numbers.payrollEfficiency },
            { l: `Audit hours saved (${numbers.auditHours}h × KES 1,500)`, v: numbers.auditValue },
          ].map(r => (
            <div key={r.l} className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-background/50 text-sm">
              <span className="text-foreground/80">{r.l}</span>
              <span className="font-mono">{fmt(r.v)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between p-4 rounded-md border border-primary/40 bg-primary/5">
            <div className="flex items-center gap-2 text-primary"><TrendingUp className="h-4 w-4" /> <span className="font-semibold">Estimated monthly value</span></div>
            <span className="font-mono text-xl font-bold text-primary">{fmt(numbers.total)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Indicative figures based on typical deployments. Actual outcomes depend on site mix, current tooling, and operational maturity.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ROICalculator;
