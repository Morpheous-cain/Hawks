import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, RefreshCw } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface MDTCheckpointsProps {
  vehicleId: string | null;
}

const MDTCheckpoints = ({ vehicleId }: MDTCheckpointsProps) => {
  const { user } = useAuth();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patrol_checkpoints")
        .select("*, checkpoints(checkpoint_name, location_description, sites(site_name))")
        .order("scanned_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      setScans(data || []);
    } catch (e) {
      console.error(e);
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const ch = supabase
      .channel("mdt-checkpoints-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patrol_checkpoints" }, fetchScans)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const recordScan = async (qrCode: string, method: "qr_code" | "rfid" | "manual") => {
    try {
      // resolve checkpoint by qr code
      const { data: cp } = await supabase
        .from("checkpoints")
        .select("id, checkpoint_name")
        .eq("qr_code", qrCode)
        .maybeSingle();

      if (!cp) {
        toast.error("Checkpoint not recognised");
        return;
      }

      // pick latest open patrol for this user/vehicle (fallback: most recent)
      const { data: patrol } = await supabase
        .from("patrols")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await supabase.from("patrol_checkpoints").insert({
        patrol_id: patrol?.id,
        checkpoint_id: cp.id,
        scanned_by: user?.id,
        scan_method: method,
        verification_status: "verified",
        guard_on_duty_name: user?.email,
      } as any);
      if (error) throw error;
      toast.success(`Checkpoint ${cp.checkpoint_name} verified`);
      fetchScans();
    } catch (e: any) {
      toast.error(e.message || "Could not record scan");
    }
  };

  const handleRfid = async () => {
    const code = window.prompt("Tap RFID — enter card ID:");
    if (code) await recordScan(code, "rfid");
  };

  const handleScanSuccess = async (data: string) => {
    setScannerOpen(false);
    await recordScan(data, "qr_code");
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Checkpoint Verification</h2>
        <p className="text-muted-foreground mb-4">
          Scan QR codes or RFID cards at checkpoints to verify patrol routes
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setScannerOpen(true)} className="gap-2 flex-1">
            <QrCode className="w-4 h-4" /> Scan QR Code
          </Button>
          <Button variant="outline" className="gap-2 flex-1" onClick={handleRfid}>
            <CreditCard className="w-4 h-4" /> RFID Scan
          </Button>
        </div>
      </Card>

      {scannerOpen && (
        <QRScanner patrolId={null} onScanSuccess={handleScanSuccess} onClose={() => setScannerOpen(false)} />
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Recent Scans</h3>
          <Button variant="outline" size="sm" onClick={fetchScans} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No checkpoints scanned yet</p>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => (
              <div key={s.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{s.checkpoints?.checkpoint_name || "Checkpoint"}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.checkpoints?.sites?.site_name || s.checkpoints?.location_description || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.scanned_at ? format(new Date(s.scanned_at), "MMM d, HH:mm") : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{s.scan_method?.toUpperCase()}</Badge>
                  <Badge className="text-[10px]">{(s.verification_status || "verified").toUpperCase()}</Badge>
                  {s.incident_flag && <Badge variant="destructive" className="text-[10px]">FLAGGED</Badge>}
                </div>
                {s.observation && <p className="text-xs text-muted-foreground mt-2">{s.observation}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MDTCheckpoints;
