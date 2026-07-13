import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdvisoryCardProps {
  title: string;
  icon: LucideIcon;
  alerts: Array<{
    id: string;
    message: string;
    level: "normal" | "caution" | "critical";
    time: string;
  }>;
}

const AdvisoryCard = ({ title, icon: Icon, alerts = [] }: AdvisoryCardProps) => {
  const levelConfig = {
    normal: { badge: "bg-alert-normal", dot: "bg-alert-normal" },
    caution: { badge: "bg-alert-caution", dot: "bg-alert-caution" },
    critical: { badge: "bg-alert-critical", dot: "bg-alert-critical animate-pulse" },
  } as const;

  return (
    <Card className="p-4 h-full border-border">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <p className="text-sm text-foreground/70 font-medium text-center py-4">Loading advisories...</p>
        ) : (
          alerts
            .filter(alert => alert && alert.level && alert.message)
            .map((alert, index) => {
              const safeLevel = (alert.level || 'normal') as keyof typeof levelConfig;
              const config = levelConfig[safeLevel] || levelConfig.normal;
              
              return (
                <div 
                  key={alert.id || `alert-${index}`} 
                  className="flex gap-3 group animate-in fade-in-0 slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    {alert.message.includes('WhatsApp') ? (
                      <a 
                        href="https://whatsapp.com/channel/0029VaYK4yj5a240m41ucj01" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:text-accent-hover underline leading-relaxed transition-colors"
                      >
                        {alert.message}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed">{alert.message}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`${config.badge} text-primary-foreground text-xs border-0`}>
                        {safeLevel.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-foreground/70 font-medium">{alert.time || 'Now'}</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </Card>
  );
};

export default AdvisoryCard;
