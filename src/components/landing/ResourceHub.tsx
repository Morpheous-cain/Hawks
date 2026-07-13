import { Card } from "@/components/ui/card";
import { FileText, BookOpen, FileSpreadsheet, ArrowUpRight, Building2 } from "lucide-react";

const ITEMS = [
  {
    icon: Building2,
    title: "Corporate Company Profile",
    desc: "Polished branded PDF profile for clients, prospects, tenders & investor packs.",
    tag: "PDF · 23 pages",
    href: "/BlackHawk_SOC-OS_Company_Profile_Detailed.pdf",
  },
  {
    icon: BookOpen,
    title: "System Replication Blueprint",
    desc: "Full architectural & module-level guide for replicating Black Hawk SOC-OS.",
    tag: "MD · 520 lines",
  },
  {
    icon: FileText,
    title: "Datasheet & Capability Brief",
    desc: "Compact PDF for procurement, security committees and CSO briefings.",
    tag: "PDF",
  },
  {
    icon: FileSpreadsheet,
    title: "RTSI Operations Manual",
    desc: "Real-Time Security Intelligence operations manual & SOPs.",
    tag: "MD",
  },
];

export const ResourceHub = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
    {ITEMS.map((it) => {
      const Icon = it.icon;
      const Wrapper = ({ children }: { children: React.ReactNode }) =>
        it.href ? (
          <a href={it.href} target="_blank" rel="noopener noreferrer" download className="block">
            {children}
          </a>
        ) : (
          <div>{children}</div>
        );
      return (
        <Wrapper key={it.title}>
          <Card className="p-6 h-full hover:border-primary/40 transition-colors group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="font-bold mb-1">{it.title}</h3>
            <p className="text-sm text-foreground/65 leading-relaxed mb-3">{it.desc}</p>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {it.tag}
            </span>
          </Card>
        </Wrapper>
      );
    })}
  </div>
);

export default ResourceHub;
