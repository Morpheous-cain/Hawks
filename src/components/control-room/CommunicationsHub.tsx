import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Radio, MessageSquare, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CommunicationsHub = () => {
  const [commsRecords, setCommsRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchCommsRecords();
  }, []);

  const fetchCommsRecords = async () => {
    const { data } = await supabase
      .from('comms_records')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    setCommsRecords(data || []);
  };

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'radio': return <Radio className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'radio': return 'bg-primary';
      case 'call': return 'bg-alert-normal';
      case 'sms': return 'bg-alert-caution';
      case 'whatsapp': return 'bg-alert-normal';
      case 'email': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Communication Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {commsRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No communication records</p>
            ) : (
              commsRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-3 bg-muted/30 rounded-lg border border-primary/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(record.type)}>
                        {getCommIcon(record.type)}
                        <span className="ml-1">{record.type}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {record.message_summary && (
                    <p className="text-sm text-foreground">{record.message_summary}</p>
                  )}
                  {record.recording_url && (
                    <p className="text-xs text-primary mt-2">📹 Recording available</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationsHub;