import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Lock, Download, Eye, Tag, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ClipDetailDialog from "./ClipDetailDialog";

interface EvidenceClip {
  id: string;
  evidence_id: string;
  clip_name: string;
  officer_name: string;
  site_name: string;
  clip_start: string;
  duration_seconds: number;
  status: string;
  locked_as_evidence: boolean;
  category: string;
  tags: string[];
  incident_id: string | null;
}

const EvidenceLibrary = () => {
  const { toast } = useToast();
  const [clips, setClips] = useState<EvidenceClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<EvidenceClip | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchEvidenceClips();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvidenceClips = async () => {
    const { data, error } = await supabase
      .from("body_cam_clips")
      .select(`
        id,
        evidence_id,
        clip_name,
        clip_start,
        duration_seconds,
        status,
        locked_as_evidence,
        category,
        tags,
        incident_id,
        officer:officer_id(full_name),
        site:site_id(site_name)
      `)
      .order("clip_start", { ascending: false })
      .limit(100);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load evidence clips",
        variant: "destructive",
      });
      return;
    }

    const formattedClips = data?.map((clip: any) => ({
      id: clip.id,
      evidence_id: clip.evidence_id,
      clip_name: clip.clip_name,
      officer_name: clip.officer?.full_name || "Unknown",
      site_name: clip.site?.site_name || "Unknown",
      clip_start: clip.clip_start,
      duration_seconds: clip.duration_seconds,
      status: clip.status,
      locked_as_evidence: clip.locked_as_evidence,
      category: clip.category || "Uncategorized",
      tags: clip.tags || [],
      incident_id: clip.incident_id,
    })) || [];

    setClips(formattedClips);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("evidence-clips-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "body_cam_clips",
        },
        () => {
          fetchEvidenceClips();
        }
      )
      .subscribe();

    return channel;
  };

  const filteredClips = clips.filter((clip) => {
    const matchesStatus = filterStatus === "all" || clip.status === filterStatus;
    const matchesCategory = filterCategory === "all" || clip.category === filterCategory;
    const matchesSearch =
      clip.clip_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.evidence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.officer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: string, locked: boolean) => {
    if (locked) {
      return (
        <Badge className="bg-alert-critical">
          <Lock className="w-3 h-3 mr-1" />
          Locked Evidence
        </Badge>
      );
    }
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "under_review":
        return <Badge className="bg-alert-caution">Under Review</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Card className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by evidence ID, name, or officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Assault">Assault</SelectItem>
              <SelectItem value="Trespass">Trespass</SelectItem>
              <SelectItem value="Theft">Theft</SelectItem>
              <SelectItem value="Vandalism">Vandalism</SelectItem>
              <SelectItem value="Dispute">Dispute</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Evidence Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence ID</TableHead>
                <TableHead>Clip Name</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClips.map((clip) => (
                <TableRow key={clip.id}>
                  <TableCell className="font-medium">{clip.evidence_id}</TableCell>
                  <TableCell>{clip.clip_name}</TableCell>
                  <TableCell>{clip.officer_name}</TableCell>
                  <TableCell>{clip.site_name}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(clip.clip_start).toLocaleString()}
                  </TableCell>
                  <TableCell>{formatDuration(clip.duration_seconds)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{clip.category}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(clip.status, clip.locked_as_evidence)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedClip(clip);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {clip.incident_id && (
                        <Badge variant="secondary" className="text-xs">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Linked
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredClips.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No evidence clips found</p>
          </div>
        )}
      </Card>

      {selectedClip && (
        <ClipDetailDialog
          clip={selectedClip}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </>
  );
};

export default EvidenceLibrary;
