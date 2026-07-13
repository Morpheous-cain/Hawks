import { Link } from "react-router-dom";
import { Briefcase, Radio, ShieldAlert, ClipboardCheck, ClipboardList, Zap, Camera, Video, BookOpen, Bell, CreditCard, QrCode, Tablet, Wrench, Dog, Car, Search, Truck, CalendarDays, AlertTriangle, MessageSquare, Map, BarChart3, Users, UserCog, Calendar, GraduationCap, Package, Building2, ArrowRight, Activity } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Operational Command",
    items: [
      { name: "Ops Dashboard", path: "/control-dashboard", icon: Activity, desc: "Live operational posture" },
      { name: "Duty Roster Board", path: "/duty-roster", icon: ClipboardList, desc: "SOC command-centre duty roster" },
      { name: "Control Room", path: "/control-room", icon: Radio, desc: "Live ops floor" },
      { name: "War Room", path: "/war-room", icon: ShieldAlert, desc: "Crisis coordination" },
      { name: "Shift Handover", path: "/shift-handover", icon: ClipboardCheck, desc: "Daily handovers" },
      { name: "Auto-Dispatch Rules", path: "/auto-dispatch", icon: Zap, desc: "Dispatch automation" },
      { name: "Operational Map", path: "/map", icon: Map, desc: "Live geo-view" },
    ],
  },
  {
    title: "Field Operations",
    items: [
      { name: "Digital Occurrence Book", path: "/dob", icon: BookOpen, desc: "All field entries" },
      { name: "Alarm & Mobile Response", path: "/alarms", icon: Bell, desc: "QRF dispatch" },
      { name: "GPS Patrol Tracking", path: "/gps-patrol", icon: Radio, desc: "Live patrol GPS" },
      { name: "Supervision Patrol", path: "/supervision-patrol", icon: QrCode, desc: "Compliance scoring" },
      { name: "Patrol Checkpoints", path: "/patrol-checkpoints", icon: QrCode, desc: "QR/RFID logs" },
      { name: "Mobile Data Terminal", path: "/mdt", icon: Tablet, desc: "Vehicle MDT" },
      { name: "Access Control", path: "/access", icon: CreditCard, desc: "Site access" },
    ],
  },
  {
    title: "Surveillance & Evidence",
    items: [
      { name: "CCTV & Video", path: "/cctv", icon: Camera, desc: "Camera matrix" },
      { name: "Body Cam", path: "/bodycam", icon: Video, desc: "Officer cams" },
      { name: "Loss Control", path: "/loss-control", icon: BarChart3, desc: "Shrinkage analytics" },
    ],
  },
  {
    title: "Specialised Units",
    items: [
      { name: "Technical Security", path: "/technical-security", icon: Wrench, desc: "Tech ops" },
      { name: "K9 Management", path: "/k9", icon: Dog, desc: "K9 unit" },
      { name: "Escort & VIP", path: "/escort", icon: Car, desc: "Protection details" },
      { name: "Investigations", path: "/investigations", icon: Search, desc: "Case management" },
      { name: "Courier Operations", path: "/courier", icon: Truck, desc: "Logistics" },
      { name: "Event Security", path: "/event-security", icon: CalendarDays, desc: "Event ops" },
    ],
  },
  {
    title: "Incidents & Communications",
    items: [
      { name: "Incidents", path: "/incidents", icon: AlertTriangle, desc: "All incidents" },
      { name: "Communications", path: "/comms", icon: MessageSquare, desc: "Call centre" },
      { name: "Guard Monitoring", path: "/guard-monitoring", icon: ClipboardCheck, desc: "Guard tour" },
      { name: "Analytics", path: "/analytics-dashboard", icon: BarChart3, desc: "Ops analytics" },
    ],
  },
  {
    title: "Workforce & Resources",
    items: [
      { name: "Officers Management", path: "/field-officers", icon: UserCog, desc: "Field officers" },
      { name: "Staff Scheduling", path: "/staff/scheduling", icon: Calendar, desc: "Rosters" },
      { name: "Leave Management", path: "/leave", icon: CalendarDays, desc: "Leave approvals" },
      { name: "Training Drills", path: "/training-drills", icon: ShieldAlert, desc: "Live drills" },
      { name: "Equipment Issuance", path: "/equipment", icon: Package, desc: "Kit allocation" },
      { name: "Fleet Management", path: "/fleet", icon: Car, desc: "Vehicle fleet" },
      { name: "Clients", path: "/clients", icon: Building2, desc: "Client accounts" },
    ],
  },
];

const COOPlatform = () => (
  <div className="px-6 py-8 md:px-10">
    <PageHeader
      eyebrow="Executive Platform"
      icon={Briefcase}
      title="Chief Operations Officer"
      description="Full operational authority surface. Every live ops, field, surveillance, specialised unit, and workforce module the COO oversees daily."
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

export default COOPlatform;
