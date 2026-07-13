import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Download, Plus, Calculator, FileText, DollarSign, Users, 
  TrendingUp, Printer, FileSpreadsheet, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, Building, CreditCard, Wallet, 
  Clock, CheckCircle, AlertTriangle, BarChart3, Calendar,
  Banknote, Receipt, Landmark, PiggyBank, TrendingDown, Percent
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from "@/utils/exportData";

interface PayrollRecord {
  sNo: number;
  passportPhoto: string;
  empNo: string;
  employeeName: string;
  idNumber: string;
  postDesignation: string;
  accountNo: string;
  bank: string;
  phoneNo: string;
  kraPin: string;
  nssfNo: string;
  nhifNo: string;
  dateOfEmployment: string;
  noDays: number;
  grossPay: number;
  paye: number;
  nssf: number;
  nhif: number;
  housingLevy: number;
  houseAllowance: number;
  boots: number;
  surcharge: number;
  netPay: number;
  remarks: string;
  status: 'pending' | 'processed' | 'paid';
}

const PayrollManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("december-2024");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState("payroll");
  const [statusFilter, setStatusFilter] = useState("all");
  const recordsPerPage = 10;

  // Form state for new record
  const [formData, setFormData] = useState({
    empNo: "",
    employeeName: "",
    idNumber: "",
    postDesignation: "",
    accountNo: "",
    bank: "",
    phoneNo: "",
    kraPin: "",
    nssfNo: "",
    nhifNo: "",
    dateOfEmployment: "",
    noDays: 26,
    grossPay: 0,
    paye: 0,
    nssf: 720,
    nhif: 0,
    housingLevy: 0,
    houseAllowance: 0,
    boots: 0,
    surcharge: 0,
    remarks: ""
  });

  // Mock payroll data
  const payrollData: PayrollRecord[] = [
    {
      sNo: 1, passportPhoto: "", empNo: "EMP-001", employeeName: "John Kamau Mwangi",
      idNumber: "12345678", postDesignation: "Security Guard", accountNo: "1234567890",
      bank: "KCB", phoneNo: "0712345678", kraPin: "A012345678B", nssfNo: "NSF12345",
      nhifNo: "NHF12345", dateOfEmployment: "2023-01-15", noDays: 26, grossPay: 35000,
      paye: 2400, nssf: 720, nhif: 600, housingLevy: 525, houseAllowance: 3000,
      boots: 500, surcharge: 0, netPay: 33255, remarks: "Full Month", status: 'paid'
    },
    {
      sNo: 2, passportPhoto: "", empNo: "EMP-002", employeeName: "Mary Wanjiru Njeri",
      idNumber: "23456789", postDesignation: "Patrol Supervisor", accountNo: "2345678901",
      bank: "Equity", phoneNo: "0723456789", kraPin: "B023456789C", nssfNo: "NSF23456",
      nhifNo: "NHF23456", dateOfEmployment: "2022-06-20", noDays: 26, grossPay: 55000,
      paye: 6800, nssf: 720, nhif: 900, housingLevy: 825, houseAllowance: 5000,
      boots: 500, surcharge: 0, netPay: 50255, remarks: "Full Month", status: 'paid'
    },
    {
      sNo: 3, passportPhoto: "", empNo: "EMP-003", employeeName: "Peter Otieno Ouma",
      idNumber: "34567890", postDesignation: "Security Guard", accountNo: "3456789012",
      bank: "Co-op", phoneNo: "0734567890", kraPin: "C034567890D", nssfNo: "NSF34567",
      nhifNo: "NHF34567", dateOfEmployment: "2023-03-10", noDays: 20, grossPay: 26923,
      paye: 1500, nssf: 720, nhif: 500, housingLevy: 404, houseAllowance: 2308,
      boots: 500, surcharge: 1000, netPay: 24607, remarks: "Leave - 6 days", status: 'processed'
    },
    {
      sNo: 4, passportPhoto: "", empNo: "EMP-004", employeeName: "Jane Akinyi Adhiambo",
      idNumber: "45678901", postDesignation: "Control Room Operator", accountNo: "4567890123",
      bank: "NCBA", phoneNo: "0745678901", kraPin: "D045678901E", nssfNo: "NSF45678",
      nhifNo: "NHF45678", dateOfEmployment: "2022-11-05", noDays: 26, grossPay: 45000,
      paye: 4200, nssf: 720, nhif: 750, housingLevy: 675, houseAllowance: 4000,
      boots: 0, surcharge: 0, netPay: 42655, remarks: "Full Month", status: 'paid'
    },
    {
      sNo: 5, passportPhoto: "", empNo: "EMP-005", employeeName: "David Kiprop Kibet",
      idNumber: "56789012", postDesignation: "Response Officer", accountNo: "5678901234",
      bank: "Stanbic", phoneNo: "0756789012", kraPin: "E056789012F", nssfNo: "NSF56789",
      nhifNo: "NHF56789", dateOfEmployment: "2023-07-01", noDays: 26, grossPay: 40000,
      paye: 3200, nssf: 720, nhif: 700, housingLevy: 600, houseAllowance: 3500,
      boots: 500, surcharge: 500, netPay: 37280, remarks: "Surcharge: Uniform Loss", status: 'pending'
    },
    {
      sNo: 6, passportPhoto: "", empNo: "EMP-006", employeeName: "Grace Muthoni Karanja",
      idNumber: "67890123", postDesignation: "Security Guard", accountNo: "6789012345",
      bank: "ABSA", phoneNo: "0767890123", kraPin: "F067890123G", nssfNo: "NSF67890",
      nhifNo: "NHF67890", dateOfEmployment: "2024-02-01", noDays: 26, grossPay: 32000,
      paye: 1800, nssf: 720, nhif: 550, housingLevy: 480, houseAllowance: 2800,
      boots: 500, surcharge: 0, netPay: 30550, remarks: "Full Month", status: 'paid'
    },
    {
      sNo: 7, passportPhoto: "", empNo: "EMP-007", employeeName: "Samuel Ochieng Onyango",
      idNumber: "78901234", postDesignation: "K9 Handler", accountNo: "7890123456",
      bank: "DTB", phoneNo: "0778901234", kraPin: "G078901234H", nssfNo: "NSF78901",
      nhifNo: "NHF78901", dateOfEmployment: "2023-05-15", noDays: 26, grossPay: 42000,
      paye: 3600, nssf: 720, nhif: 720, housingLevy: 630, houseAllowance: 3700,
      boots: 500, surcharge: 0, netPay: 40130, remarks: "Full Month + K9 Allowance", status: 'processed'
    },
    {
      sNo: 8, passportPhoto: "", empNo: "EMP-008", employeeName: "Faith Njoki Waweru",
      idNumber: "89012345", postDesignation: "Admin Assistant", accountNo: "8901234567",
      bank: "I&M", phoneNo: "0789012345", kraPin: "H089012345I", nssfNo: "NSF89012",
      nhifNo: "NHF89012", dateOfEmployment: "2023-09-01", noDays: 26, grossPay: 38000,
      paye: 2800, nssf: 720, nhif: 650, housingLevy: 570, houseAllowance: 3300,
      boots: 0, surcharge: 0, netPay: 36560, remarks: "Full Month", status: 'pending'
    }
  ];

  // Filter payroll
  const filteredPayroll = payrollData.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.empNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.idNumber.includes(searchQuery) ||
      record.postDesignation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayroll.length / recordsPerPage);
  const paginatedData = filteredPayroll.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  // Calculate totals
  const totalGross = filteredPayroll.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNet = filteredPayroll.reduce((sum, r) => sum + r.netPay, 0);
  const totalPAYE = filteredPayroll.reduce((sum, r) => sum + r.paye, 0);
  const totalNSSF = filteredPayroll.reduce((sum, r) => sum + r.nssf, 0);
  const totalNHIF = filteredPayroll.reduce((sum, r) => sum + r.nhif, 0);
  const totalHousingLevy = filteredPayroll.reduce((sum, r) => sum + r.housingLevy, 0);
  const totalHouseAllowance = filteredPayroll.reduce((sum, r) => sum + r.houseAllowance, 0);
  const totalBoots = filteredPayroll.reduce((sum, r) => sum + r.boots, 0);
  const totalSurcharge = filteredPayroll.reduce((sum, r) => sum + r.surcharge, 0);
  const totalDeductions = totalPAYE + totalNSSF + totalNHIF + totalHousingLevy + totalBoots + totalSurcharge;

  // Status counts
  const paidCount = payrollData.filter(r => r.status === 'paid').length;
  const processedCount = payrollData.filter(r => r.status === 'processed').length;
  const pendingCount = payrollData.filter(r => r.status === 'pending').length;

  // Calculate net pay based on form data
  const calculateNetPay = () => {
    const gross = formData.grossPay + formData.houseAllowance;
    const deductions = formData.paye + formData.nssf + formData.nhif + formData.housingLevy + formData.boots + formData.surcharge;
    return gross - deductions;
  };

  // Auto-calculate statutory deductions
  const calculatePAYE = (gross: number) => {
    const taxableIncome = gross;
    let paye = 0;
    if (taxableIncome <= 24000) paye = taxableIncome * 0.10;
    else if (taxableIncome <= 32333) paye = 2400 + (taxableIncome - 24000) * 0.25;
    else if (taxableIncome <= 500000) paye = 2400 + 2083 + (taxableIncome - 32333) * 0.30;
    else if (taxableIncome <= 800000) paye = 2400 + 2083 + 140300 + (taxableIncome - 500000) * 0.325;
    else paye = 2400 + 2083 + 140300 + 97500 + (taxableIncome - 800000) * 0.35;
    paye = Math.max(0, paye - 2400);
    return Math.round(paye);
  };

  const calculateHousingLevy = (gross: number) => Math.round(gross * 0.015);

  const calculateNHIF = (gross: number) => {
    if (gross <= 5999) return 150;
    if (gross <= 7999) return 300;
    if (gross <= 11999) return 400;
    if (gross <= 14999) return 500;
    if (gross <= 19999) return 600;
    if (gross <= 24999) return 750;
    if (gross <= 29999) return 850;
    if (gross <= 34999) return 900;
    if (gross <= 39999) return 950;
    if (gross <= 44999) return 1000;
    if (gross <= 49999) return 1100;
    if (gross <= 59999) return 1200;
    if (gross <= 69999) return 1300;
    if (gross <= 79999) return 1400;
    if (gross <= 89999) return 1500;
    if (gross <= 99999) return 1600;
    return 1700;
  };

  const handleGrossPayChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      grossPay: value,
      paye: calculatePAYE(value),
      housingLevy: calculateHousingLevy(value),
      nhif: calculateNHIF(value)
    }));
  };

  const handleExportCSV = () => {
    const exportData = filteredPayroll.map(r => ({
      "S/No": r.sNo, "Emp. No.": r.empNo, "Employee Name": r.employeeName,
      "ID Number": r.idNumber, "Post/Designation": r.postDesignation,
      "Account No.": r.accountNo, "Bank": r.bank, "Phone No.": r.phoneNo,
      "KRA PIN": r.kraPin, "NSSF No": r.nssfNo, "NHIF No": r.nhifNo,
      "Date of Employment": r.dateOfEmployment, "No. Days": r.noDays,
      "Gross Pay": r.grossPay, "PAYE": r.paye, "NSSF": r.nssf, "NHIF": r.nhif,
      "Housing Levy": r.housingLevy, "House Allowance": r.houseAllowance,
      "Boots": r.boots, "Surcharge": r.surcharge, "Net Pay": r.netPay,
      "Remarks": r.remarks, "Status": r.status
    }));
    exportToCSV(exportData, `payroll_${selectedMonth}`);
    toast.success("Payroll exported to CSV");
  };

  const handleExportPDF = () => {
    const exportData = filteredPayroll.map(r => ({
      "S/No": r.sNo, "Name": r.employeeName, "Designation": r.postDesignation,
      "Days": r.noDays, "Gross": formatCurrency(r.grossPay),
      "Deductions": formatCurrency(r.paye + r.nssf + r.nhif + r.housingLevy + r.boots + r.surcharge),
      "Net Pay": formatCurrency(r.netPay), "Status": r.status
    }));
    exportToPDF(exportData, `payroll_${selectedMonth}`, `Payroll Report - ${selectedMonth.replace('-', ' ').toUpperCase()}`);
    toast.success("Payroll exported to PDF");
  };

  const handleAddRecord = () => {
    toast.success("New payroll record created successfully");
    setIsAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      empNo: "", employeeName: "", idNumber: "", postDesignation: "",
      accountNo: "", bank: "", phoneNo: "", kraPin: "", nssfNo: "", nhifNo: "",
      dateOfEmployment: "", noDays: 26, grossPay: 0, paye: 0, nssf: 720,
      nhif: 0, housingLevy: 0, houseAllowance: 0, boots: 0, surcharge: 0, remarks: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-500';
      case 'processed': return 'bg-blue-500/20 text-blue-500';
      case 'pending': return 'bg-amber-500/20 text-amber-500';
      default: return 'bg-muted';
    }
  };

  const getMonthLabel = (value: string) => {
    const months: Record<string, string> = {
      "december-2024": "December 2024", "november-2024": "November 2024",
      "october-2024": "October 2024", "september-2024": "September 2024"
    };
    return months[value] || value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payroll Management</h2>
          <p className="text-muted-foreground">Manage employee salaries, deductions, and statutory compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="december-2024">December 2024</SelectItem>
              <SelectItem value="november-2024">November 2024</SelectItem>
              <SelectItem value="october-2024">October 2024</SelectItem>
              <SelectItem value="september-2024">September 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff</p>
              <p className="text-lg font-bold">{filteredPayroll.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-alert-normal/20">
              <Banknote className="w-4 h-4 text-alert-normal" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gross Pay</p>
              <p className="text-sm font-bold">{formatCurrency(totalGross)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-alert-critical/10 to-alert-critical/5 border-alert-critical/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-alert-critical/20">
              <TrendingDown className="w-4 h-4 text-alert-critical" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deductions</p>
              <p className="text-sm font-bold">{formatCurrency(totalDeductions)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-alert-normal/20">
              <Wallet className="w-4 h-4 text-alert-normal" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Pay</p>
              <p className="text-sm font-bold">{formatCurrency(totalNet)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-alert-caution/20">
              <Landmark className="w-4 h-4 text-alert-caution" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PAYE</p>
              <p className="text-sm font-bold">{formatCurrency(totalPAYE)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <PiggyBank className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NSSF</p>
              <p className="text-sm font-bold">{formatCurrency(totalNSSF)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/20">
              <Receipt className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NHIF</p>
              <p className="text-sm font-bold">{formatCurrency(totalNHIF)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Building className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Housing</p>
              <p className="text-sm font-bold">{formatCurrency(totalHousingLevy)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, ID, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="processed">Processed ({processedCount})</SelectItem>
                <SelectItem value="paid">Paid ({paidCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-primary">
                  <Plus className="w-4 h-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-xl">Add Payroll Record</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6 py-4">
                    {/* Employee Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Employee Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Employee No. *</Label>
                          <Input placeholder="EMP-XXX" value={formData.empNo} onChange={(e) => setFormData(prev => ({ ...prev, empNo: e.target.value }))} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Employee Name *</Label>
                          <Input placeholder="Full Name" value={formData.employeeName} onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>ID Number *</Label>
                          <Input placeholder="National ID" value={formData.idNumber} onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Post/Designation *</Label>
                          <Select value={formData.postDesignation} onValueChange={(v) => setFormData(prev => ({ ...prev, postDesignation: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Security Guard">Security Guard</SelectItem>
                              <SelectItem value="Patrol Supervisor">Patrol Supervisor</SelectItem>
                              <SelectItem value="Control Room Operator">Control Room Operator</SelectItem>
                              <SelectItem value="Response Officer">Response Officer</SelectItem>
                              <SelectItem value="K9 Handler">K9 Handler</SelectItem>
                              <SelectItem value="Admin Assistant">Admin Assistant</SelectItem>
                              <SelectItem value="Site Commander">Site Commander</SelectItem>
                              <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Employment *</Label>
                          <Input type="date" value={formData.dateOfEmployment} onChange={(e) => setFormData(prev => ({ ...prev, dateOfEmployment: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Banking & Contact</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Account No. *</Label>
                          <Input placeholder="Bank Account" value={formData.accountNo} onChange={(e) => setFormData(prev => ({ ...prev, accountNo: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bank *</Label>
                          <Select value={formData.bank} onValueChange={(v) => setFormData(prev => ({ ...prev, bank: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select Bank" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KCB">KCB Bank</SelectItem>
                              <SelectItem value="Equity">Equity Bank</SelectItem>
                              <SelectItem value="Co-op">Co-operative Bank</SelectItem>
                              <SelectItem value="NCBA">NCBA Bank</SelectItem>
                              <SelectItem value="Stanbic">Stanbic Bank</SelectItem>
                              <SelectItem value="ABSA">ABSA Bank</SelectItem>
                              <SelectItem value="DTB">Diamond Trust Bank</SelectItem>
                              <SelectItem value="I&M">I&M Bank</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone No. *</Label>
                          <Input placeholder="07XXXXXXXX" value={formData.phoneNo} onChange={(e) => setFormData(prev => ({ ...prev, phoneNo: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    {/* Statutory Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Statutory Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>KRA PIN *</Label>
                          <Input placeholder="AXXXXXXXXB" value={formData.kraPin} onChange={(e) => setFormData(prev => ({ ...prev, kraPin: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>NSSF No. *</Label>
                          <Input placeholder="NSF XXXXX" value={formData.nssfNo} onChange={(e) => setFormData(prev => ({ ...prev, nssfNo: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>NHIF No. *</Label>
                          <Input placeholder="NHF XXXXX" value={formData.nhifNo} onChange={(e) => setFormData(prev => ({ ...prev, nhifNo: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    {/* Salary Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Salary & Deductions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Days Worked</Label>
                          <Input type="number" value={formData.noDays} onChange={(e) => setFormData(prev => ({ ...prev, noDays: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Gross Pay (KES) *</Label>
                          <Input type="number" placeholder="0" value={formData.grossPay || ""} onChange={(e) => handleGrossPayChange(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                          <Label>PAYE (Auto)</Label>
                          <Input type="number" value={formData.paye} className="bg-muted/50" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>NSSF</Label>
                          <Input type="number" value={formData.nssf} onChange={(e) => setFormData(prev => ({ ...prev, nssf: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>NHIF (Auto)</Label>
                          <Input type="number" value={formData.nhif} className="bg-muted/50" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Housing Levy (Auto)</Label>
                          <Input type="number" value={formData.housingLevy} className="bg-muted/50" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>House Allowance</Label>
                          <Input type="number" value={formData.houseAllowance || ""} onChange={(e) => setFormData(prev => ({ ...prev, houseAllowance: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Boots Deduction</Label>
                          <Input type="number" value={formData.boots || ""} onChange={(e) => setFormData(prev => ({ ...prev, boots: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Surcharge</Label>
                          <Input type="number" value={formData.surcharge || ""} onChange={(e) => setFormData(prev => ({ ...prev, surcharge: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-3">
                          <Label>Remarks</Label>
                          <Textarea placeholder="Any notes..." value={formData.remarks} onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    {/* Net Pay Summary */}
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Calculated Net Pay</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(calculateNetPay())}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary/50" />
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleAddRecord} className="bg-primary">Save Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="payroll" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Payroll Register
          </TabsTrigger>
          <TabsTrigger value="deductions" className="gap-2">
            <Calculator className="w-4 h-4" />
            Statutory Summary
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-4">
          <Card className="overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[1600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12 text-xs font-semibold">S/No</TableHead>
                      <TableHead className="w-16 text-xs font-semibold">Photo</TableHead>
                      <TableHead className="text-xs font-semibold">EMP NO</TableHead>
                      <TableHead className="min-w-[180px] text-xs font-semibold">NAME</TableHead>
                      <TableHead className="text-xs font-semibold">DESIGNATION</TableHead>
                      <TableHead className="text-xs font-semibold">BANK</TableHead>
                      <TableHead className="text-xs font-semibold text-right">DAYS</TableHead>
                      <TableHead className="text-xs font-semibold text-right">GROSS</TableHead>
                      <TableHead className="text-xs font-semibold text-right">PAYE</TableHead>
                      <TableHead className="text-xs font-semibold text-right">NSSF</TableHead>
                      <TableHead className="text-xs font-semibold text-right">NHIF</TableHead>
                      <TableHead className="text-xs font-semibold text-right">H.LEVY</TableHead>
                      <TableHead className="text-xs font-semibold text-right">ALLOW</TableHead>
                      <TableHead className="text-xs font-semibold text-right">DED</TableHead>
                      <TableHead className="text-xs font-semibold text-right bg-primary/10">NET PAY</TableHead>
                      <TableHead className="text-xs font-semibold">STATUS</TableHead>
                      <TableHead className="text-xs font-semibold text-center w-24">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((record, index) => (
                      <TableRow key={record.empNo} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{(currentPage - 1) * recordsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {record.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-primary">{record.empNo}</TableCell>
                        <TableCell className="text-xs font-medium">{record.employeeName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{record.postDesignation}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{record.bank}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{record.noDays}</TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-600">{formatCurrency(record.grossPay)}</TableCell>
                        <TableCell className="text-xs text-right text-amber-600">{formatCurrency(record.paye)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(record.nssf)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(record.nhif)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(record.housingLevy)}</TableCell>
                        <TableCell className="text-xs text-right text-blue-600">{formatCurrency(record.houseAllowance)}</TableCell>
                        <TableCell className="text-xs text-right text-destructive">{formatCurrency(record.boots + record.surcharge)}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-primary bg-primary/5">{formatCurrency(record.netPay)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(record.status)}`}>{record.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewRecord(record)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/80 font-semibold border-t-2">
                      <TableCell colSpan={7} className="text-xs text-right">TOTALS:</TableCell>
                      <TableCell className="text-xs text-right text-emerald-600">{formatCurrency(totalGross)}</TableCell>
                      <TableCell className="text-xs text-right text-amber-600">{formatCurrency(totalPAYE)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(totalNSSF)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(totalNHIF)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(totalHousingLevy)}</TableCell>
                      <TableCell className="text-xs text-right text-blue-600">{formatCurrency(totalHouseAllowance)}</TableCell>
                      <TableCell className="text-xs text-right text-destructive">{formatCurrency(totalBoots + totalSurcharge)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-primary bg-primary/10">{formatCurrency(totalNet)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, filteredPayroll.length)} of {filteredPayroll.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <Landmark className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total PAYE</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPAYE)}</p>
                </div>
              </div>
              <Progress value={totalPAYE / totalGross * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{((totalPAYE / totalGross) * 100).toFixed(1)}% of gross</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <PiggyBank className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total NSSF</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalNSSF)}</p>
                </div>
              </div>
              <Progress value={totalNSSF / totalGross * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{((totalNSSF / totalGross) * 100).toFixed(1)}% of gross</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Receipt className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total NHIF</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalNHIF)}</p>
                </div>
              </div>
              <Progress value={totalNHIF / totalGross * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{((totalNHIF / totalGross) * 100).toFixed(1)}% of gross</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/20">
                  <Building className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Housing Levy</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalHousingLevy)}</p>
                </div>
              </div>
              <Progress value={1.5} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">1.5% of gross (statutory)</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">Payroll Status</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{paidCount}</span>
                      <Progress value={paidCount / payrollData.length * 100} className="w-20 h-2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Processed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{processedCount}</span>
                      <Progress value={processedCount / payrollData.length * 100} className="w-20 h-2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{pendingCount}</span>
                      <Progress value={pendingCount / payrollData.length * 100} className="w-20 h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span>Gross Salaries</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(totalGross)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span>Total Allowances</span>
                    <span className="font-bold text-blue-600">{formatCurrency(totalHouseAllowance)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span>Total Deductions</span>
                    <span className="font-bold text-destructive">{formatCurrency(totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="font-semibold">Net Disbursement</span>
                    <span className="font-bold text-primary">{formatCurrency(totalNet)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Record Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Payslip</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg bg-primary/20 text-primary">
                    {viewRecord.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{viewRecord.employeeName}</h3>
                  <p className="text-muted-foreground">{viewRecord.postDesignation}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{viewRecord.empNo}</Badge>
                    <Badge className={getStatusColor(viewRecord.status)}>{viewRecord.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground">ID Number</p><p className="font-medium">{viewRecord.idNumber}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{viewRecord.phoneNo}</p></div>
                <div><p className="text-muted-foreground">Bank</p><p className="font-medium">{viewRecord.bank}</p></div>
                <div><p className="text-muted-foreground">Account</p><p className="font-medium">{viewRecord.accountNo}</p></div>
                <div><p className="text-muted-foreground">KRA PIN</p><p className="font-medium">{viewRecord.kraPin}</p></div>
                <div><p className="text-muted-foreground">Days Worked</p><p className="font-medium">{viewRecord.noDays}</p></div>
              </div>

              <Card className="p-4 bg-muted/30">
                <h4 className="font-semibold mb-3">Earnings & Deductions - {getMonthLabel(selectedMonth)}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Earnings</h5>
                    <div className="flex justify-between text-sm"><span>Gross Pay</span><span className="text-emerald-600">{formatCurrency(viewRecord.grossPay)}</span></div>
                    <div className="flex justify-between text-sm"><span>House Allowance</span><span className="text-emerald-600">{formatCurrency(viewRecord.houseAllowance)}</span></div>
                    <div className="flex justify-between text-sm font-medium border-t pt-2"><span>Total Earnings</span><span className="text-emerald-600">{formatCurrency(viewRecord.grossPay + viewRecord.houseAllowance)}</span></div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Deductions</h5>
                    <div className="flex justify-between text-sm"><span>PAYE</span><span className="text-destructive">-{formatCurrency(viewRecord.paye)}</span></div>
                    <div className="flex justify-between text-sm"><span>NSSF</span><span className="text-destructive">-{formatCurrency(viewRecord.nssf)}</span></div>
                    <div className="flex justify-between text-sm"><span>NHIF</span><span className="text-destructive">-{formatCurrency(viewRecord.nhif)}</span></div>
                    <div className="flex justify-between text-sm"><span>Housing Levy</span><span className="text-destructive">-{formatCurrency(viewRecord.housingLevy)}</span></div>
                    {viewRecord.boots > 0 && <div className="flex justify-between text-sm"><span>Boots</span><span className="text-destructive">-{formatCurrency(viewRecord.boots)}</span></div>}
                    {viewRecord.surcharge > 0 && <div className="flex justify-between text-sm"><span>Surcharge</span><span className="text-destructive">-{formatCurrency(viewRecord.surcharge)}</span></div>}
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t text-lg">
                  <span className="font-bold">Net Pay</span>
                  <span className="font-bold text-primary">{formatCurrency(viewRecord.netPay)}</span>
                </div>
              </Card>

              {viewRecord.remarks && (
                <div><p className="text-muted-foreground text-sm">Remarks</p><p className="font-medium">{viewRecord.remarks}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guidelines */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <h3 className="font-semibold text-foreground mb-2">Payroll Processing Guidelines</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Statutory deductions (PAYE, NSSF, NHIF, Housing Levy) are auto-calculated per Kenyan tax law</li>
          <li>Housing Levy is calculated at 1.5% of gross pay as per current regulations</li>
          <li>All payroll records require HR verification before final processing</li>
          <li>Export to CSV for bank uploads, PDF for records and audits</li>
        </ul>
      </Card>
    </div>
  );
};

export default PayrollManagement;
