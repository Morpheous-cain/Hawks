/**
 * Automated PDF Shift Report Generator
 * Generates downloadable shift reports with attendance, patrol, and incident data.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ShiftReportData {
  shiftDate: string;
  shiftType: string;
  siteName?: string;
  attendance: Array<{
    officerName: string;
    clockIn: string;
    clockOut: string | null;
    hoursWorked: string;
    status: string;
    verificationMethod: string;
  }>;
  patrolScans: Array<{
    checkpoint: string;
    scannedBy: string;
    scannedAt: string;
    status: string;
  }>;
  incidents: Array<{
    type: string;
    description: string;
    time: string;
    severity: string;
    status: string;
  }>;
  dobEntries: Array<{
    type: string;
    description: string;
    time: string;
    recordedBy: string;
  }>;
  summary: {
    totalOfficers: number;
    avgHoursWorked: string;
    checkpointsCompleted: number;
    checkpointsMissed: number;
    incidentCount: number;
    complianceScore: number;
  };
}

export const fetchShiftReportData = async (
  date: string,
  shiftType: string = 'all',
  siteName?: string
): Promise<ShiftReportData> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch attendance
  let attendanceQuery = supabase
    .from('attendance')
    .select('*, staff:staff_id(full_name)')
    .gte('check_in', startOfDay.toISOString())
    .lte('check_in', endOfDay.toISOString())
    .order('check_in');

  if (siteName) {
    attendanceQuery = attendanceQuery.eq('site', siteName);
  }

  const { data: attendanceData } = await attendanceQuery;

  // Fetch patrol checkpoints
  const { data: checkpointData } = await supabase
    .from('patrol_checkpoints')
    .select('*, checkpoints(checkpoint_name)')
    .gte('scanned_at', startOfDay.toISOString())
    .lte('scanned_at', endOfDay.toISOString())
    .order('scanned_at');

  // Fetch incidents
  const { data: incidentData } = await supabase
    .from('incidents')
    .select('*')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .order('created_at');

  // Fetch DOB entries
  const { data: dobData } = await supabase
    .from('dob_entries')
    .select('*')
    .gte('entry_time', startOfDay.toISOString())
    .lte('entry_time', endOfDay.toISOString())
    .order('entry_time');

  // Process attendance
  const attendance = (attendanceData || []).map((a: any) => {
    const checkIn = new Date(a.check_in);
    const checkOut = a.check_out ? new Date(a.check_out) : null;
    const hours = checkOut
      ? ((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(1)
      : 'Active';

    return {
      officerName: a.staff?.full_name || 'Unknown',
      clockIn: format(checkIn, 'HH:mm'),
      clockOut: checkOut ? format(checkOut, 'HH:mm') : '—',
      hoursWorked: hours,
      status: a.status || 'pending',
      verificationMethod: a.notes?.includes('Biometric: verified') ? 'Bio+Selfie' :
        a.notes?.includes('Selfie: captured') ? 'Selfie' : 'Standard',
    };
  });

  // Process checkpoints
  const patrolScans = (checkpointData || []).map((c: any) => ({
    checkpoint: c.checkpoints?.checkpoint_name || c.checkpoint_id || 'Unknown',
    scannedBy: c.scanned_by || 'Unknown',
    scannedAt: format(new Date(c.scanned_at), 'HH:mm'),
    status: 'Verified',
  }));

  // Process incidents
  const incidents = (incidentData || []).map((i: any) => ({
    type: i.incident_type || i.title || 'Unknown',
    description: (i.description || '').substring(0, 80),
    time: format(new Date(i.created_at), 'HH:mm'),
    severity: i.severity || 'medium',
    status: i.status || 'open',
  }));

  // Process DOB entries
  const dobEntries = (dobData || []).map((d: any) => ({
    type: d.entry_type || 'General',
    description: (d.description || '').substring(0, 80),
    time: format(new Date(d.entry_time), 'HH:mm'),
    recordedBy: d.recorded_by_name || 'Unknown',
  }));

  // Calculate summary
  const totalHours = attendance
    .filter(a => a.hoursWorked !== 'Active')
    .reduce((sum, a) => sum + parseFloat(a.hoursWorked), 0);
  const workedCount = attendance.filter(a => a.hoursWorked !== 'Active').length;

  return {
    shiftDate: date,
    shiftType,
    siteName,
    attendance,
    patrolScans,
    incidents,
    dobEntries,
    summary: {
      totalOfficers: attendance.length,
      avgHoursWorked: workedCount > 0 ? (totalHours / workedCount).toFixed(1) : '0',
      checkpointsCompleted: patrolScans.length,
      checkpointsMissed: 0,
      incidentCount: incidents.length,
      complianceScore: attendance.length > 0
        ? Math.round((attendance.filter(a => a.status === 'verified').length / attendance.length) * 100)
        : 100,
    },
  };
};

export const generateShiftReportPDF = (data: ShiftReportData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BLACK HAWK SOC-OS', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('SHIFT REPORT', pageWidth / 2, 22, { align: 'center' });

  // Report info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${format(new Date(data.shiftDate), 'dd MMMM yyyy')}`, 14, 32);
  doc.text(`Shift: ${data.shiftType}`, 14, 37);
  if (data.siteName) doc.text(`Site: ${data.siteName}`, 14, 42);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth - 14, 32, { align: 'right' });

  let startY = data.siteName ? 48 : 43;

  // Summary Box
  doc.setFillColor(240, 240, 240);
  doc.rect(14, startY, pageWidth - 28, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const summaryItems = [
    `Officers: ${data.summary.totalOfficers}`,
    `Avg Hours: ${data.summary.avgHoursWorked}`,
    `Checkpoints: ${data.summary.checkpointsCompleted}`,
    `Incidents: ${data.summary.incidentCount}`,
    `Compliance: ${data.summary.complianceScore}%`,
  ];
  const colWidth = (pageWidth - 28) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    doc.text(item, 16 + i * colWidth, startY + 11);
  });

  startY += 24;

  // Attendance Table
  if (data.attendance.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE', 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Officer', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Verification']],
      body: data.attendance.map(a => [
        a.officerName, a.clockIn, a.clockOut, a.hoursWorked, a.status.toUpperCase(), a.verificationMethod
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Patrol Checkpoints
  if (data.patrolScans.length > 0) {
    if (startY > 240) { doc.addPage(); startY = 15; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATROL CHECKPOINTS', 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Checkpoint', 'Scanned By', 'Time', 'Status']],
      body: data.patrolScans.map(p => [p.checkpoint, p.scannedBy, p.scannedAt, p.status]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Incidents
  if (data.incidents.length > 0) {
    if (startY > 240) { doc.addPage(); startY = 15; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENTS', 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Type', 'Description', 'Time', 'Severity', 'Status']],
      body: data.incidents.map(i => [i.type, i.description, i.time, i.severity.toUpperCase(), i.status]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [180, 30, 30] },
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // DOB Entries
  if (data.dobEntries.length > 0) {
    if (startY > 240) { doc.addPage(); startY = 15; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DAILY OCCURRENCE BOOK', 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Type', 'Description', 'Time', 'Recorded By']],
      body: data.dobEntries.map(d => [d.type, d.description, d.time, d.recordedBy]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${pageCount} — Black Hawk SOC-OS Ltd — Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadShiftReport = async (date: string, shiftType?: string, siteName?: string) => {
  const data = await fetchShiftReportData(date, shiftType, siteName);
  const doc = generateShiftReportPDF(data);
  const fileName = `BlackHawk_Shift_Report_${format(new Date(date), 'yyyy-MM-dd')}_${shiftType || 'all'}.pdf`;
  doc.save(fileName);
  return fileName;
};
