import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, Flame, Radio, Users, Heart, Eye, Building2, 
  Target, AlertTriangle, CheckCircle2, XCircle, Clock,
  Search, Download, Filter, TrendingUp
} from "lucide-react";

// Officer Competency Framework from Black Hawk Training Manual
export const COMPETENCY_FRAMEWORK = {
  core: [
    { id: "patrolling", name: "Patrolling", icon: Target, courses: ["SEC-103", "SEC-105"] },
    { id: "searching", name: "Searching", icon: Search, courses: ["SEC-105"] },
    { id: "reporting", name: "Reporting/OB", icon: Shield, courses: ["SEC-103", "SEC-105"] },
    { id: "customer_care", name: "Customer Care", icon: Users, courses: ["CS-101"] },
    { id: "fire_response", name: "Fire Response", icon: Flame, courses: ["FIRE-101"] },
    { id: "radio_comms", name: "Radio Communication", icon: Radio, courses: ["COMM-101"] },
    { id: "emergency", name: "Emergency Procedures", icon: AlertTriangle, courses: ["FIRE-101", "FA-101"] }
  ],
  specialized: [
    { id: "embassy", name: "Embassy Security", icon: Building2, courses: ["DIP-101"] },
    { id: "access_control", name: "Access Control Equipment", icon: Shield, courses: ["DIP-101"] },
    { id: "terrorism", name: "Terrorism Detection", icon: AlertTriangle, courses: ["TERROR-101"] },
    { id: "surveillance", name: "Surveillance Detection", icon: Eye, courses: ["SURV-101"] },
    { id: "first_aid", name: "First Aid/CPR", icon: Heart, courses: ["FA-101"] }
  ]
};

interface StaffCompetency {
  staff_id: string;
  staff_name: string;
  position: string;
  department?: string;
  competencies: {
    competency_id: string;
    status: "certified" | "expired" | "in_progress" | "not_started";
    expiry_date?: string;
    score?: number;
  }[];
}

// Mock data for demonstration
const mockStaffCompetencies: StaffCompetency[] = [
  {
    staff_id: "STF-001",
    staff_name: "John Kamau",
    position: "Senior Guard",
    department: "Operations",
    competencies: [
      { competency_id: "patrolling", status: "certified", expiry_date: "2025-06-15", score: 92 },
      { competency_id: "searching", status: "certified", expiry_date: "2025-06-15", score: 88 },
      { competency_id: "reporting", status: "certified", expiry_date: "2025-06-15", score: 95 },
      { competency_id: "customer_care", status: "certified", expiry_date: "2026-03-20", score: 85 },
      { competency_id: "fire_response", status: "expired", expiry_date: "2024-11-30", score: 78 },
      { competency_id: "radio_comms", status: "certified", expiry_date: "2025-08-10", score: 90 },
      { competency_id: "emergency", status: "in_progress", score: 0 },
      { competency_id: "embassy", status: "not_started" },
      { competency_id: "first_aid", status: "certified", expiry_date: "2026-01-15", score: 94 }
    ]
  },
  {
    staff_id: "STF-002",
    staff_name: "Mary Wanjiku",
    position: "Patrol Officer",
    department: "Field Operations",
    competencies: [
      { competency_id: "patrolling", status: "certified", expiry_date: "2025-09-20", score: 88 },
      { competency_id: "searching", status: "in_progress", score: 0 },
      { competency_id: "reporting", status: "certified", expiry_date: "2025-09-20", score: 82 },
      { competency_id: "customer_care", status: "certified", expiry_date: "2026-05-10", score: 90 },
      { competency_id: "fire_response", status: "certified", expiry_date: "2025-04-15", score: 86 },
      { competency_id: "radio_comms", status: "expired", expiry_date: "2024-10-01", score: 75 },
      { competency_id: "emergency", status: "not_started" },
      { competency_id: "surveillance", status: "certified", expiry_date: "2026-02-28", score: 91 },
      { competency_id: "first_aid", status: "in_progress", score: 0 }
    ]
  },
  {
    staff_id: "STF-003",
    staff_name: "Peter Ochieng",
    position: "Control Room Officer",
    department: "Control Room",
    competencies: [
      { competency_id: "patrolling", status: "not_started" },
      { competency_id: "searching", status: "not_started" },
      { competency_id: "reporting", status: "certified", expiry_date: "2025-07-30", score: 96 },
      { competency_id: "customer_care", status: "certified", expiry_date: "2026-01-20", score: 88 },
      { competency_id: "fire_response", status: "certified", expiry_date: "2025-05-15", score: 82 },
      { competency_id: "radio_comms", status: "certified", expiry_date: "2025-11-20", score: 98 },
      { competency_id: "emergency", status: "certified", expiry_date: "2025-08-30", score: 90 },
      { competency_id: "terrorism", status: "certified", expiry_date: "2025-12-01", score: 85 },
      { competency_id: "surveillance", status: "certified", expiry_date: "2026-03-15", score: 92 }
    ]
  }
];

interface CompetencyMatrixProps {
  staffData?: StaffCompetency[];
}

const CompetencyMatrix = ({ staffData = mockStaffCompetencies }: CompetencyMatrixProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const allCompetencies = [...COMPETENCY_FRAMEWORK.core, ...COMPETENCY_FRAMEWORK.specialized];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "certified":
        return <Badge className="bg-alert-normal/20 text-alert-normal border-alert-normal/30 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Certified</Badge>;
      case "expired":
        return <Badge className="bg-alert-critical/20 text-alert-critical border-alert-critical/30 text-xs"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case "in_progress":
        return <Badge className="bg-alert-caution/20 text-alert-caution border-alert-caution/30 text-xs"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Not Started</Badge>;
    }
  };

  const calculateCompetencyScore = (staff: StaffCompetency) => {
    const certified = staff.competencies.filter(c => c.status === "certified").length;
    return Math.round((certified / staff.competencies.length) * 100);
  };

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    const hasStatus = staff.competencies.some(c => c.status === filterStatus);
    return matchesSearch && hasStatus;
  });

  // Summary stats
  const totalCertified = staffData.reduce((sum, staff) => 
    sum + staff.competencies.filter(c => c.status === "certified").length, 0);
  const totalExpired = staffData.reduce((sum, staff) => 
    sum + staff.competencies.filter(c => c.status === "expired").length, 0);
  const totalInProgress = staffData.reduce((sum, staff) => 
    sum + staff.competencies.filter(c => c.status === "in_progress").length, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/20">
                <CheckCircle2 className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certified</p>
                <p className="text-xl font-bold text-alert-normal">{totalCertified}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-critical/10 to-alert-critical/5 border-alert-critical/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-critical/20">
                <XCircle className="w-5 h-5 text-alert-critical" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-xl font-bold text-alert-critical">{totalExpired}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-caution/20">
                <Clock className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-alert-caution">{totalInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Competency</p>
                <p className="text-xl font-bold text-primary">
                  {Math.round(staffData.reduce((sum, s) => sum + calculateCompetencyScore(s), 0) / staffData.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="certified">Certified</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Matrix
          </Button>
        </div>
      </Card>

      {/* Competency Matrix Table */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Officer Competency Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 bg-card z-10">Officer</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  {allCompetencies.slice(0, 7).map(comp => {
                    const Icon = comp.icon;
                    return (
                      <TableHead key={comp.id} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{comp.name}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => {
                  const score = calculateCompetencyScore(staff);
                  return (
                    <TableRow key={staff.staff_id}>
                      <TableCell className="sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {staff.staff_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{staff.staff_name}</p>
                            <p className="text-xs text-muted-foreground">{staff.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-bold text-sm ${
                            score >= 80 ? 'text-alert-normal' : 
                            score >= 60 ? 'text-alert-caution' : 'text-alert-critical'
                          }`}>
                            {score}%
                          </span>
                          <Progress 
                            value={score} 
                            className="w-12 h-1.5"
                          />
                        </div>
                      </TableCell>
                      {allCompetencies.slice(0, 7).map(comp => {
                        const competency = staff.competencies.find(c => c.competency_id === comp.id);
                        return (
                          <TableCell key={comp.id} className="text-center">
                            {competency ? (
                              <div className="flex flex-col items-center gap-1">
                                {competency.status === "certified" ? (
                                  <CheckCircle2 className="w-5 h-5 text-alert-normal" />
                                ) : competency.status === "expired" ? (
                                  <XCircle className="w-5 h-5 text-alert-critical" />
                                ) : competency.status === "in_progress" ? (
                                  <Clock className="w-5 h-5 text-alert-caution" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                                {competency.score && competency.score > 0 && (
                                  <span className="text-xs text-muted-foreground">{competency.score}%</span>
                                )}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 mx-auto" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <span className="text-sm text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-alert-normal" />
            <span className="text-xs">Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-alert-critical" />
            <span className="text-xs">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-alert-caution" />
            <span className="text-xs">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
            <span className="text-xs">Not Started</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompetencyMatrix;
