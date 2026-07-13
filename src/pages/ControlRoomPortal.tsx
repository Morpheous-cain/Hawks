import { Link } from "react-router-dom";
import { MonitorDot, Radio, Bell, AlertTriangle, Camera, Video, Tablet, MessageSquare, Map, BookOpen, QrCode, ClipboardCheck, ClipboardList, Zap, ShieldAlert, CreditCard, Truck, Car, Search, Dog, CalendarDays, Wrench, BarChart3, FileText, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Live Monitoring",
    items: [
      { name: "Control Room Dashboard", path: "/control-dashboard", icon: MonitorDot, desc: "Operator command surface" },
      { name: "Duty Roster Board", path: "/duty-roster", icon: ClipboardList, desc: "SOC command-centre duty roster" },
      { name: "Control Room", path: "/control-room", icon: Radio, desc: "Live ops floor" },
      { name: "Operational Map", path: "/map", icon: Map, desc: "Live geo-view" },
      { name: "CCTV & Video", path: "/cctv", icon: Camera, desc: "Camera matrix" },
      { name: "Body Cam", path: "/bodycam", icon: Video, desc: "Officer livestreams" },
    ],
  },
  {
    title: "Dispatch & Response",
    items: [
      { name: "Alarm & Mobile Response", path: "/alarms", icon: Bell, desc: "Alarm panel & QRF" },
      { name: "Mobile Data Terminal", path: "/mdt", icon: Tablet, desc: "Vehicle MDT control" },
      { name: "Auto-Dispatch Rules", path: "/auto-dispatch", icon: Zap, desc: "Dispatch automation" },
      { name: "Communications", path: "/comms", icon: MessageSquare, desc: "Calls, radio, SMS" },
      { name: "Crisis Management Centre", path: "/war-room", icon: ShieldAlert, desc: "Major-incident command (Gold/Silver/Bronze)" },
    ],
  },
  {
    title: "Field Oversight",
    items: [
      { name: "GPS Patrol Tracking", path: "/gps-patrol", icon: Radio, desc: "Live patrol GPS" },
      { name: "Supervision Patrol", path: "/supervision-patrol", icon: QrCode, desc: "Compliance scoring" },
      { name: "Patrol Checkpoints", path: "/patrol-checkpoints", icon: QrCode, desc: "QR/RFID feed" },
      { name: "Guard Monitoring", path: "/guard-monitoring", icon: ClipboardCheck, desc: "Tour reports" },
      { name: "Access Control", path: "/access", icon: CreditCard, desc: "Site access events" },
    ],
  },
  {
    title: "Incident & Reporting",
    items: [
      { name: "Incidents", path: "/incidents", icon: AlertTriangle, desc: "Active incidents" },
      { name: "Digital Occurrence Book", path: "/dob", icon: BookOpen, desc: "Control O.B" },
      { name: "Shift Handover", path: "/shift-handover", icon: ClipboardCheck, desc: "Operator handover" },
      { name: "Audit Log", path: "/audit-log", icon: FileText, desc: "All system events" },
      { name: "Analytics", path: "/analytics-dashboard", icon: BarChart3, desc: "Operator metrics" },
    ],
  },
  {
    title: "Specialised Coordination",
    items: [
      { name: "Escort & VIP", path: "/escort", icon: Car, desc: "Active missions" },
      { name: "K9 Operations", path: "/k9", icon: Dog, desc: "K9 deployment" },
      { name: "Courier Operations", path: "/courier", icon: Truck, desc: "Live deliveries" },
      { name: "Investigations", path: "/investigations", icon: Search, desc: "Active cases" },
      { name: "Event Security", path: "/event-security", icon: CalendarDays, desc: "Event monitoring" },
      { name: "Technical Security", path: "/technical-security", icon: Wrench, desc: "Tech alerts" },
    ],
  },
];

const ControlRoomPortal = () => (
  <div className="px-6 py-8 md:px-10">
    <PageHeader
      eyebrow="Operator Platform"
      icon={MonitorDot}
      title="Control Room Portal"
      description="Unified 24/7 operator surface. Every live monitoring, dispatch, field oversight, incident, and coordination module needed to run the floor."
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

export default ControlRoomPortal;
