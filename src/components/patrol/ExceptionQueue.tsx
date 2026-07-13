import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Camera, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ExceptionRecord {
  id: string;
  officerName: string;
  site: string;
  eventType: string;
  timestamp: string;
  reason: string;
  gpsDistance?: number;
  thumbnailUrl?: string;
  status: 'pending' | 'approved' | 'declined';
  notes?: string;
}

const ExceptionQueue = () => {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ExceptionRecord | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      // Fetch attendance records with rejected or pending status
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          check_in,
          check_out,
          site,
          status,
          notes,
          shift_type,
          staff:staff_id (
            id,
            full_name
          )
        `)
        .in('status', ['pending', 'rejected', 'manual_request'])
        .order('check_in', { ascending: false })
        .limit(50);

      if (error) throw error;

      const exceptionRecords: ExceptionRecord[] = (data || []).map((record: any) => {
        // Parse GPS distance from notes if available
        let gpsDistance;
        if (record.notes) {
          const match = record.notes.match(/Accuracy:\s*(\d+)m/);
          if (match) gpsDistance = parseInt(match[1]);
        }

        return {
          id: record.id,
          officerName: record.staff?.full_name || 'Unknown',
          site: record.site,
          eventType: record.check_out ? 'CLOCK_OUT' : 'CLOCK_IN',
          timestamp: record.check_in,
          reason: record.status === 'rejected' ? 'Outside geofence' : 'Manual verification requested',
          gpsDistance,
          status: record.status === 'verified' ? 'approved' : record.status === 'rejected' ? 'declined' : 'pending',
          notes: record.notes
        };
      });

      setExceptions(exceptionRecords);
    } catch (error) {
      console.error("Error fetching exceptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: ExceptionRecord) => {
    setSelectedItem(item);
    setReviewComment("");
    setShowReviewDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: 'verified',
          notes: `${selectedItem.notes || ''} | APPROVED: ${reviewComment} | Approved at: ${new Date().toISOString()}`
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success("Exception approved successfully");
      setShowReviewDialog(false);
      fetchExceptions();
    } catch (error) {
      console.error("Error approving exception:", error);
      toast.error("Failed to approve exception");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: 'rejected',
          notes: `${selectedItem.notes || ''} | DECLINED: ${reviewComment} | Declined at: ${new Date().toISOString()}`
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success("Exception declined");
      setShowReviewDialog(false);
      fetchExceptions();
    } catch (error) {
      console.error("Error declining exception:", error);
      toast.error("Failed to decline exception");
    } finally {
      setProcessing(false);
    }
  };

  const filteredExceptions = exceptions.filter(e =>
    filterStatus === 'all' || e.status === filterStatus
  );

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Exception Queue
          </h2>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filterStatus === 'declined' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('declined')}
          >
            Declined
          </Button>
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
        </div>
      </div>

      {/* Exception Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredExceptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">No exceptions in queue</h3>
            <p className="text-muted-foreground">All attendance records are verified</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExceptions.map((item) => (
            <Card key={item.id} className={`
              ${item.status === 'pending' ? 'border-amber-500/50' : ''}
              ${item.status === 'approved' ? 'border-green-500/50 opacity-75' : ''}
              ${item.status === 'declined' ? 'border-red-500/50 opacity-75' : ''}
            `}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{item.officerName}</p>
                      <Badge variant={item.eventType === 'CLOCK_IN' ? 'default' : 'secondary'}>
                        {item.eventType}
                      </Badge>
                      <Badge variant={
                        item.status === 'pending' ? 'outline' :
                        item.status === 'approved' ? 'default' : 'destructive'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.site}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                      {item.gpsDistance && (
                        <span className="text-amber-500">
                          {item.gpsDistance}m from site
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-amber-600 font-medium">{item.reason}</p>
                  </div>

                  {/* Actions */}
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                        onClick={() => handleReview(item)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                        onClick={() => handleReview(item)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Exception</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Officer</Label>
                  <p className="font-medium">{selectedItem.officerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Site</Label>
                  <p className="font-medium">{selectedItem.site}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Type</Label>
                  <p className="font-medium">{selectedItem.eventType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">GPS Distance</Label>
                  <p className="font-medium">{selectedItem.gpsDistance || 'N/A'}m</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-lg">
                <p className="text-sm font-medium text-amber-600">{selectedItem.reason}</p>
              </div>

              <div>
                <Label htmlFor="comment">Verification Comment (required)</Label>
                <Textarea
                  id="comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter your verification notes..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
              onClick={handleDecline}
              disabled={!reviewComment.trim() || processing}
            >
              Decline
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={!reviewComment.trim() || processing}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExceptionQueue;
