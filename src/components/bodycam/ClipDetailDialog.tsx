import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Download, Link as LinkIcon, Tag, MapPin, Clock, User } from "lucide-react";

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

interface ClipDetailDialogProps {
  clip: EvidenceClip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClipDetailDialog = ({ clip, open, onOpenChange }: ClipDetailDialogProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const chainOfCustody = [
    {
      action: "Created",
      user: "System Auto-Generate",
      timestamp: clip.clip_start,
      details: "Clip automatically created from incident trigger",
    },
    {
      action: "Viewed",
      user: "John Kamau (Control Room)",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "Reviewed footage for incident verification",
    },
    {
      action: "Tagged",
      user: "Sarah Wanjiku (Investigator)",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      details: `Tagged as ${clip.category}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Evidence Clip Details - {clip.evidence_id}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="custody">Chain of Custody</TabsTrigger>
            <TabsTrigger value="linked">Linked Records</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Video Player Placeholder */}
            <Card className="aspect-video bg-muted flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Video Player</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Evidence ID: {clip.evidence_id}
                </p>
              </div>
            </Card>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Officer Information</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Officer Name</p>
                    <p className="font-medium">{clip.officer_name}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Location</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <p className="font-medium">{clip.site_name}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Timing</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Recorded</p>
                    <p className="font-medium">{new Date(clip.clip_start).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(clip.duration_seconds)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Classification</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{clip.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clip.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clip.locked_as_evidence ? (
                    <>
                      <Lock className="w-5 h-5 text-alert-critical" />
                      <span className="font-semibold">Locked as Evidence</span>
                      <Badge className="bg-alert-critical">Cannot be edited or deleted</Badge>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Status: {clip.status}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  {!clip.locked_as_evidence && (
                    <Button size="sm" className="bg-alert-critical">
                      <Lock className="w-4 h-4 mr-2" />
                      Lock as Evidence
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="custody" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Chain of Custody Log</h4>
              <div className="space-y-4">
                {chainOfCustody.map((entry, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{entry.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{entry.user}</p>
                      <p className="text-sm">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="linked" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Linked Records</h4>
              </div>
              {clip.incident_id ? (
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Incident Report</p>
                        <p className="text-sm text-muted-foreground">
                          Incident ID: {clip.incident_id}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Incident
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No linked records</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    Link to Incident
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClipDetailDialog;
