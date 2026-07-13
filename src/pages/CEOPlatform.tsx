import { Link } from "react-router-dom";
import { Crown, TrendingUp, Wallet, Building2, Users, ShieldCheck, Globe, BarChart3, FileText, AlertTriangle, GraduationCap, Briefcase, Activity, ArrowRight, ClipboardList } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Strategic Oversight",
    items: [
      { name: "Executive Dashboard", path: "/", icon: Activity, desc: "Group-wide KPIs & live posture" },
      { name: "Duty Roster Board", path: "/duty-roster", icon: ClipboardList, desc: "SOC command-centre duty roster" },
      { name: "Strategic Advisory", path: "/strategic-advisory", icon: Globe, desc: "Geo-political & threat intel" },
      { name: "Analytics", path: "/analytics-dashboard", icon: BarChart3, desc: "Cross-departmental analytics" },
      { name: "War Room", path: "/war-room", icon: AlertTriangle, desc: "Crisis command" },
    ],
  },
  {
    title: "Financial Authority",
    items: [
      { name: "Billing & Revenue", path: "/billing", icon: Wallet, desc: "Revenue, AR, profitability" },
      { name: "Loss Control", path: "/loss-control", icon: TrendingUp, desc: "Shrinkage & risk costs" },
      { name: "Tenants (SaaS)", path: "/tenants", icon: Building2, desc: "Multi-tenant portfolio" },
    ],
  },
  {
    title: "Governance & Compliance",
    items: [
      { name: "Compliance Centre", path: "/compliance", icon: ShieldCheck, desc: "Regulatory posture" },
      { name: "Audit Log", path: "/audit-log", icon: FileText, desc: "System-wide audit trail" },
      { name: "Documents", path: "/documents", icon: FileText, desc: "Corporate records" },
    ],
  },
  {
    title: "Organisation",
    items: [
      { name: "Client Portfolio", path: "/clients", icon: Building2, desc: "All client accounts" },
      { name: "Staff Management", path: "/staff", icon: Users, desc: "HR overview" },
      { name: "Training & Capability", path: "/training", icon: GraduationCap, desc: "Workforce readiness" },
      { name: "Field Officers", path: "/field-officers", icon: Briefcase, desc: "Operational manpower" },
    ],
  },
];

const CEOPlatform = () => (
  <div className="px-6 py-8 md:px-10">
    <PageHeader
      eyebrow="Director Platform"
      icon={Crown}
      title="Chief Executive Officer"
      description="Strategic command surface. Group performance, financial posture, governance, and global advisory — every module the CEO requires for board-level decisions."
    />
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-3 text-2xs font-bold uppercase tracking-[0.2em] text-text-muted">{section.title}</h3>
          <div className="grid grid-cols-1 gap-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Card className="group flex items-center gap-3 p-4 transition-colors hover:border-primary/40 hover:bg-surface-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-text-muted truncate">{item.desc}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CEOPlatform;
