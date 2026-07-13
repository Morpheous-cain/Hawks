import { Globe, MapPin, AlertTriangle, Shield, Cloud, Clock, ExternalLink, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdvisoryFeedListProps {
  advisories: any[];
  onAdvisoryClick: (advisory: any) => void;
  fullWidth?: boolean;
}

const getSeverityConfig = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return { bg: "bg-alert-critical/8", border: "border-l-alert-critical", badge: "bg-alert-critical text-white", dot: "bg-alert-critical" };
    case "CAUTION":
      return { bg: "bg-alert-caution/5", border: "border-l-alert-caution", badge: "bg-alert-caution text-white", dot: "bg-alert-caution" };
    default:
      return { bg: "bg-transparent", border: "border-l-alert-normal", badge: "bg-alert-normal text-white", dot: "bg-alert-normal" };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case "traffic": return <MapPin className="w-3.5 h-3.5" />;
    case "protest": return <AlertTriangle className="w-3.5 h-3.5" />;
    case "terror": return <Shield className="w-3.5 h-3.5" />;
    case "weather": return <Cloud className="w-3.5 h-3.5" />;
    case "crime": return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <Globe className="w-3.5 h-3.5" />;
  }
};

const formatTimestamp = (ts: string) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const parseStructuredDetails = (description: string) => {
  const details: { body?: string } = {};
  if (!description) return details;
  const lines = description.split('\n');
  const bodyLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip structured prefix lines (WHEN/WHERE/WHAT/HOW) — show clean narrative only
    if (/^(📅\s*WHEN:|📍\s*WHERE:|⚡\s*WHAT:|🔍\s*HOW:)/i.test(trimmed)) continue;
    // Skip "By Author" / "Published on:" meta lines
    if (/^By\s+[A-Z]/i.test(trimmed) && trimmed.length < 80) continue;
    if (/^Published\s+on:/i.test(trimmed)) continue;
    if (trimmed.length > 0) bodyLines.push(trimmed);
  }
  // Join all content — allow full narrative (up to 5000 chars)
  details.body = bodyLines.join(' ').replace(/^\[.*?\]\s*/, '');
  return details;
};

const AdvisoryFeedList = ({ advisories, onAdvisoryClick, fullWidth = false }: AdvisoryFeedListProps) => {
  if (advisories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Globe className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-xs">No advisories match your filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className={fullWidth ? "max-h-[700px]" : "h-[520px]"}>
      <div className={fullWidth ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2" : "space-y-1.5"}>
        {advisories.map((advisory) => {
          const config = getSeverityConfig(advisory.severity);
          const source = advisory.sources?.[0]?.name || "—";
          const location = advisory.location_scope_hierarchy?.[advisory.location_scope_hierarchy.length - 1] || "";
          const details = parseStructuredDetails(advisory.description);

          return (
            <div
              key={advisory.id}
              onClick={() => onAdvisoryClick(advisory)}
              className={`
                group relative cursor-pointer rounded-lg border-l-[3px] ${config.border} ${config.bg}
                border border-border/20 hover:border-border/40
                transition-all duration-150 hover:bg-card/60
              `}
            >
              <div className="px-3 py-2.5">
                {/* Row 1: Category + Severity + Time */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {getCategoryIcon(advisory.category)}
                      {advisory.category}
                    </span>
                    <Badge className={`${config.badge} text-[9px] px-1.5 py-0 h-4 font-bold rounded-sm`}>
                      {advisory.severity}
                    </Badge>
                    {advisory.priority && advisory.priority !== "P3" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-medium border-border/40">
                        {advisory.priority}
                      </Badge>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 tabular-nums" title="When the incident occurred">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimestamp(advisory.timestamp_detected)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-[13px] font-semibold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {advisory.title}
                </h4>

                {/* Full incident narrative */}
                {details.body && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-[8] mb-1.5 whitespace-pre-line">
                    {details.body}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 pt-1 border-t border-border/10">
                  <div className="flex items-center gap-2.5">
                    {location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {location}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" />
                      {source}
                    </span>
                  </div>
                  <span className="font-mono text-[9px]">{advisory.incident_id}</span>
                </div>

                {/* Action bar */}
                {advisory.recommended_action && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground/70 italic truncate">
                    <span className="not-italic font-medium text-foreground/50">→</span> {advisory.recommended_action}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default AdvisoryFeedList;
