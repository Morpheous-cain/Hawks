import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ClipboardList,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Business Oversight",
    items: [
      { name: "Executive Dashboard", path: "/executive-dashboard", icon: BarChart3, desc: "Commercial and operational KPIs" },
      { name: "Analytics", path: "/analytics-dashboard", icon: BarChart3, desc: "Department performance and trends" },
      { name: "Client Management", path: "/clients", icon: Building2, desc: "Accounts, contracts, and service coverage" },
    ],
  },
  {
    title: "People & Delivery",
    items: [
      { name: "Staff Management", path: "/staff", icon: Users, desc: "Headcount, roles, and staff structure" },
      { name: "Staff Scheduling", path: "/staff/scheduling", icon: CalendarDays, desc: "Shift rosters and coverage" },
      { name: "Training Management", path: "/training", icon: GraduationCap, desc: "Capability and certification readiness" },
      { name: "Field Officers", path: "/field-officers", icon: ClipboardCheck, desc: "Officer deployment and supervision" },
    ],
  },
  {
    title: "Finance & Governance",
    items: [
      { name: "Billing & Invoicing", path: "/billing", icon: Wallet, desc: "Revenue, invoicing, and collections" },
      { name: "Compliance Centre", path: "/compliance", icon: ShieldCheck, desc: "Policies, controls, and compliance posture" },
      { name: "Audit Log", path: "/audit-log", icon: FileText, desc: "System-wide accountability trail" },
      { name: "Documents", path: "/documents", icon: FileText, desc: "Operational and governance records" },
    ],
  },
  {
    title: "Operational Coordination",
    items: [
      { name: "Control Room Dashboard", path: "/control-dashboard", icon: Briefcase, desc: "Live control room posture" },
      { name: "Duty Roster Board", path: "/duty-roster", icon: ClipboardList, desc: "SOC command-centre duty roster" },
      { name: "Communications", path: "/comms", icon: CreditCard, desc: "Comms and coordination workspace" },
      { name: "Strategic Advisory", path: "/strategic-advisory", icon: ShieldCheck, desc: "Risk and intelligence briefing" },
    ],
  },
];

const GMPlatform = () => (
  <div className="px-6 py-8 md:px-10">
    <PageHeader
      eyebrow="Management Platform"
      icon={Briefcase}
      title="General Manager"
      description="Commercial, workforce, compliance, and delivery oversight for the General Manager across management operations."
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
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="truncate text-xs text-text-muted">{item.desc}</div>
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

export default GMPlatform;