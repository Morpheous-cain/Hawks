import { Card } from "@/components/ui/card";
import {
  ShieldCheck, Lock, KeyRound, FileLock2, Globe, Fingerprint, Database, ScrollText,
} from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "AES-256 at rest" },
  { icon: Lock, label: "TLS 1.3 in transit" },
  { icon: KeyRound, label: "RBAC + RLS" },
  { icon: FileLock2, label: "SHA-256 evidence hashing" },
  { icon: ScrollText, label: "Immutable audit chain" },
  { icon: Globe, label: "Kenya DPA aligned" },
  { icon: Fingerprint, label: "SSO / Biometric ready" },
  { icon: Database, label: "Tenant-isolated data" },
];

export const SecurityStrip = () => (
  <Card className="p-7">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ITEMS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-background/40 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  </Card>
);
