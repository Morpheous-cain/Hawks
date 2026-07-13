import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Award, Search, Download, Calendar, Clock, AlertTriangle,
  CheckCircle2, XCircle, QrCode, Printer, Eye, RefreshCw,
  Shield, Users, Plus
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BLACK_HAWK_COURSE_CATALOG } from "./BlackHawkCourseCatalog";

// Certification validity rules from Black Hawk Training Manual
const CERTIFICATION_RULES = BLACK_HAWK_COURSE_CATALOG.map(course => ({
  course_id: course.id,
  course_name: course.name,
  validity_months: course.certification_validity_months,
  passing_score: course.passing_score,
  attendance_required: 80,
  renewal_conditions: course.is_mandatory ? "Pass refresher assessment" : "Complete updated module"
}));

// Mock certification data
const mockCertifications = [
  {
    id: "CERT-001",
    staff_id: "STF-001",
    staff_name: "John Kamau",
    position: "Senior Guard",
    course_id: "SEC-105",
    course_name: "Practical Security Procedures",
    issue_date: "2024-06-15",
    expiry_date: "2025-06-15",
    score: 92,
    certificate_number: "BH-SEC105-2024-001",
    status: "active",
    attendance: 100,
    trainer: "James Mwangi"
  },
  {
    id: "CERT-002",
    staff_id: "STF-001",
    staff_name: "John Kamau",
    position: "Senior Guard",
    course_id: "FIRE-101",
    course_name: "Fire Fighting & Emergency",
    issue_date: "2023-11-30",
    expiry_date: "2024-11-30",
    score: 78,
    certificate_number: "BH-FIRE101-2023-045",
    status: "expired",
    attendance: 95,
    trainer: "Peter Njoroge"
  },
  {
    id: "CERT-003",
    staff_id: "STF-002",
    staff_name: "Mary Wanjiku",
    position: "Patrol Officer",
    course_id: "COMM-101",
    course_name: "Radio Communication",
    issue_date: "2024-10-01",
    expiry_date: "2025-10-01",
    score: 88,
    certificate_number: "BH-COMM101-2024-023",
    status: "active",
    attendance: 100,
    trainer: "Grace Otieno"
  },
  {
    id: "CERT-004",
    staff_id: "STF-002",
    staff_name: "Mary Wanjiku",
    position: "Patrol Officer",
    course_id: "FA-101",
    course_name: "First Aid - DRSABCD",
    issue_date: "2025-01-15",
    expiry_date: "2027-01-15",
    score: 94,
    certificate_number: "BH-FA101-2025-012",
    status: "active",
    attendance: 100,
    trainer: "Dr. Sarah Kimani"
  },
  {
    id: "CERT-005",
    staff_id: "STF-003",
    staff_name: "Peter Ochieng",
    position: "Control Room Officer",
    course_id: "TERROR-101",
    course_name: "Terrorism Awareness",
    issue_date: "2024-12-01",
    expiry_date: "2025-12-01",
    score: 85,
    certificate_number: "BH-TER101-2024-008",
    status: "expiring_soon",
    attendance: 90,
    trainer: "Col. (Rtd) David Maina"
  }
];

const CertificationEngine = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch certifications from database
  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['staff-certifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select(`
          *,
          staff:staff_id (id, full_name, position)
        `)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch staff for dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list-certs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, position')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    }
  });

  const getCertificateStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: "active", color: "bg-alert-normal/20 text-alert-normal", label: "Active" };
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, new Date());
    
    if (isPast(expiry)) return { status: "expired", color: "bg-alert-critical/20 text-alert-critical", label: "Expired" };
    if (daysUntilExpiry <= 30) return { status: "expiring_soon", color: "bg-alert-caution/20 text-alert-caution", label: "Expiring Soon" };
    return { status: "active", color: "bg-alert-normal/20 text-alert-normal", label: "Active" };
  };

  const filteredCertifications = certifications.filter((cert: any) => {
    const staffName = cert.staff?.full_name || '';
    const matchesSearch = staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.certification_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.certification_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    
    const certStatus = getCertificateStatus(cert.expiry_date);
    return matchesSearch && certStatus.status === statusFilter;
  });

  // Stats
  const totalCerts = certifications.length;
  const activeCerts = certifications.filter((c: any) => getCertificateStatus(c.expiry_date).status === "active").length;
  const expiringSoon = certifications.filter((c: any) => getCertificateStatus(c.expiry_date).status === "expiring_soon").length;
  const expiredCerts = certifications.filter((c: any) => getCertificateStatus(c.expiry_date).status === "expired").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Certificates</p>
                <p className="text-xl font-bold">{totalCerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/20">
                <CheckCircle2 className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-alert-normal">{activeCerts}</p>
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
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className="text-xl font-bold text-alert-caution">{expiringSoon}</p>
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
                <p className="text-xl font-bold text-alert-critical">{expiredCerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, course, or certificate #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Award className="w-4 h-4" />
              Issue Certificate
            </Button>
          </div>
        </div>
      </Card>

      {/* Certification Rules Reference */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Black Hawk Certification Validity Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATION_RULES.slice(0, 6).map(rule => (
              <Badge 
                key={rule.course_id} 
                variant="outline" 
                className="text-xs py-1"
              >
                {rule.course_name.split(' ').slice(0, 2).join(' ')}: {rule.validity_months}mo
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications Table */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Issued Certificates
            <Badge variant="secondary" className="ml-2">{filteredCertifications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Staff Member</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Certificate #</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No certificates found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertifications.map((cert: any) => {
                  const statusInfo = getCertificateStatus(cert.expiry_date);
                  const daysLeft = cert.expiry_date ? differenceInDays(new Date(cert.expiry_date), new Date()) : 999;
                  const staffName = cert.staff?.full_name || 'Unknown';
                  const position = cert.staff?.position || '';
                  
                  return (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {staffName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{staffName}</p>
                            <p className="text-xs text-muted-foreground">{position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{cert.certification_type}</p>
                          <p className="text-xs text-muted-foreground">{cert.issuing_authority || 'Black Hawk SOC-OS'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{cert.certification_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{cert.issue_date ? format(new Date(cert.issue_date), 'MMM dd, yyyy') : '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{cert.expiry_date ? format(new Date(cert.expiry_date), 'MMM dd, yyyy') : 'No Expiry'}</span>
                          {daysLeft > 0 && daysLeft <= 60 && (
                            <p className="text-xs text-alert-caution">{daysLeft} days left</p>
                          )}
                          {daysLeft < 0 && (
                            <p className="text-xs text-alert-critical">{Math.abs(daysLeft)} days ago</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          {statusInfo.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {statusInfo.status === "expiring_soon" && <Clock className="w-3 h-3 mr-1" />}
                          {statusInfo.status === "expired" && <XCircle className="w-3 h-3 mr-1" />}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setSelectedCert(cert)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Certificate Details</DialogTitle>
                              </DialogHeader>
                              {selectedCert && (
                                <div className="space-y-6">
                                  {/* Certificate Preview */}
                                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
                                    <div className="text-center space-y-4">
                                      <div className="flex justify-center">
                                        <div className="p-4 rounded-full bg-primary/20">
                                          <Award className="w-12 h-12 text-primary" />
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold">Certificate of Completion</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Black Hawk SOC-OS
                                        </p>
                                      </div>
                                      <div className="py-4 border-t border-b border-primary/20">
                                        <p className="text-sm text-muted-foreground">This is to certify that</p>
                                        <p className="text-2xl font-bold text-primary my-2">{selectedCert.staff_name}</p>
                                        <p className="text-sm text-muted-foreground">has successfully completed</p>
                                        <p className="text-lg font-semibold mt-2">{selectedCert.course_name}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Issue Date</p>
                                          <p className="font-medium">{format(new Date(selectedCert.issue_date), 'MMMM dd, yyyy')}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Valid Until</p>
                                          <p className="font-medium">{format(new Date(selectedCert.expiry_date), 'MMMM dd, yyyy')}</p>
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground font-mono">
                                        {selectedCert.certificate_number}
                                      </div>
                                    </div>
                                  </Card>

                                  {/* Details */}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Score Achieved</p>
                                      <p className="font-bold text-lg">{selectedCert.score}%</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Attendance</p>
                                      <p className="font-bold text-lg">{selectedCert.attendance}%</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Trainer</p>
                                      <p className="font-medium">{selectedCert.trainer}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Status</p>
                                      <Badge className={getCertificateStatus(selectedCert.expiry_date).color}>
                                        {getCertificateStatus(selectedCert.expiry_date).label}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 gap-2">
                                      <QrCode className="w-4 h-4" />
                                      Verify QR
                                    </Button>
                                    <Button variant="outline" className="flex-1 gap-2">
                                      <Printer className="w-4 h-4" />
                                      Print
                                    </Button>
                                    <Button className="flex-1 gap-2">
                                      <Download className="w-4 h-4" />
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <QrCode className="w-4 h-4" />
                          </Button>
                          {statusInfo.status === "expired" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-alert-caution">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificationEngine;
