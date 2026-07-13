import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const SettingsSOPControls = () => {
  const [sopConfigs, setSopConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetchSOPConfigs();
  }, []);

  const fetchSOPConfigs = async () => {
    const { data } = await supabase
      .from('sop_configurations')
      .select('*')
      .eq('active', true)
      .order('incident_type', { ascending: true });

    setSopConfigs(data || []);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-alert-critical';
      case 'high': return 'bg-alert-caution';
      case 'medium': return 'bg-alert-caution/70';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Standard Operating Procedures (SOPs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sopConfigs.map((sop) => (
              <div
                key={sop.id}
                className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg capitalize">
                      {sop.incident_type.replace('_', ' ')}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getSeverityColor(sop.default_severity)}>
                        {sop.default_severity}
                      </Badge>
                      <Badge variant="outline">
                        Target: {sop.response_time_target_minutes}m
                      </Badge>
                      {sop.requires_supervisor_approval && (
                        <Badge variant="outline">Requires Approval</Badge>
                      )}
                    </div>
                  </div>
                  <FileText className="w-6 h-6 text-primary" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Standard Steps:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                    {Array.isArray(sop.steps) && sop.steps.map((step: any, idx: number) => (
                      <li key={idx} className="list-decimal">
                        {step.action}
                      </li>
                    ))}
                  </ol>
                </div>

                {sop.mandatory_fields && Array.isArray(sop.mandatory_fields) && sop.mandatory_fields.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-1">Mandatory Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {sop.mandatory_fields.map((field: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSOPControls;