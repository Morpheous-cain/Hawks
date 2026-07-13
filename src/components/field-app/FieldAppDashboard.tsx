import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock, MapPin, Shield, AlertCircle, CheckCircle,
  Calendar, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface FieldAppDashboardProps {
  userName: string;
  userRole: string;
  assignedSites: any[];
  assignedPatrols: any[];
  assignedDispatches: any[];
  modulesCount: number;
}

export const FieldAppDashboard = ({
  userName,
  userRole,
  assignedSites,
  assignedPatrols,
  assignedDispatches,
  modulesCount
}: FieldAppDashboardProps) => {
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? "Good Morning" :
                   currentTime.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  const [shiftStart, setShiftStart] = useState<string>("--:--");
  const [onDuty, setOnDuty] = useState(false);

  useEffect(() => {
    const loadShift = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const sb: any = supabase;
      const { data: staff } = await sb
        .from("staff")
        .select("id")
        .eq("email", u.user.email!)
        .maybeSingle();
      if (!staff?.id) return;
      const { data } = await sb
        .from("attendance")
        .select("check_in, check_out")
        .eq("staff_id", staff.id)
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.check_in) {
        setShiftStart(format(new Date(data.check_in), "HH:mm"));
        setOnDuty(true);
      }
    };
    loadShift();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-xl p-6 border border-primary/20">
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold mt-1">{userName}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="bg-primary/10">
            <Shield className="h-3 w-3 mr-1" />
            {userRole}
          </Badge>
          <Badge
            variant="outline"
            className={onDuty ? "text-green-500 border-green-500/30" : "text-muted-foreground border-muted-foreground/30"}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {onDuty ? "On Duty" : "Off Duty"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shiftStart}</p>
                <p className="text-xs text-muted-foreground">Shift Started</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedSites?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Assigned Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedDispatches?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{modulesCount}</p>
                <p className="text-xs text-muted-foreground">Platforms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Assignments
        </h2>
        
        {assignedPatrols && assignedPatrols.length > 0 ? (
          <div className="space-y-3">
            {assignedPatrols.map((patrol: any, index: number) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{patrol.patrol_id || `Patrol #${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {patrol.site_name || "Assigned Site"}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      patrol.status === "active" ? "text-green-500 border-green-500/30" :
                      patrol.status === "pending" ? "text-amber-500 border-amber-500/30" :
                      "text-muted-foreground"
                    }>
                      {patrol.status || "Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">No Active Assignments</p>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up! Check back later for new assignments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assigned Dispatches */}
      {assignedDispatches && assignedDispatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Pending Dispatches
          </h2>
          <div className="space-y-3">
            {assignedDispatches.map((dispatch: any, index: number) => (
              <Card key={index} className="bg-card/50 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dispatch.request_number || `Dispatch #${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {dispatch.location || "Location TBD"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dispatch.description || dispatch.dispatch_type}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        dispatch.priority === "high" ? "text-red-500 border-red-500/30" :
                        dispatch.priority === "medium" ? "text-amber-500 border-amber-500/30" :
                        "text-blue-500 border-blue-500/30"
                      }
                    >
                      {dispatch.priority || "Normal"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
