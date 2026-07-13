import jsPDF from "jspdf";
import autoTable, { RowInput, UserOptions } from "jspdf-autotable";

/**
 * Black Hawk SOC-OS — shared branded PDF report generator.
 * Use across Patrol scorecards, Investigations, Shift handovers, Incidents, etc.
 */

export interface ReportSection {
  heading: string;
  body?: string;
  /** Optional table rendered under the heading. */
  table?: { headers: string[]; rows: RowInput[]; options?: Partial<UserOptions> };
}

export interface ReportOptions {
  /** Report title shown large at top of cover. */
  title: string;
  /** Optional subtitle (e.g. case number, patrol ID). */
  subtitle?: string;
  /** Document classification banner (e.g. "CONFIDENTIAL"). */
  classification?: string;
  /** Author / generated-by line. */
  author?: string;
  /** Sections rendered top-to-bottom. */
  sections: ReportSection[];
  /** Filename used for the download (without .pdf). */
  filename: string;
  /** Optional logo data URL. */
  logoDataUrl?: string;
}

const BRAND_PRIMARY: [number, number, number] = [30, 64, 175]; // blue-800
const BRAND_DARK: [number, number, number] = [15, 23, 42]; // slate-900
const BRAND_MUTED: [number, number, number] = [100, 116, 139]; // slate-500

const fmtTimestamp = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date()) + " (Africa/Nairobi)";

const drawHeader = (doc: jsPDF, opts: ReportOptions) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, w, 22, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BLACK HAWK SOC-OS", 12, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Security Operations Centre", 12, 16);
  if (opts.classification) {
    doc.setFillColor(220, 38, 38);
    doc.rect(w - 50, 6, 38, 10, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(opts.classification, w - 31, 12.5, { align: "center" });
  }
};

const drawFooter = (doc: jsPDF, page: number, total: number) => {
  const h = doc.internal.pageSize.getHeight();
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...BRAND_MUTED);
  doc.setLineWidth(0.2);
  doc.line(12, h - 14, w - 12, h - 14);
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated ${fmtTimestamp()}`, 12, h - 8);
  doc.text(`Page ${page} of ${total}`, w - 12, h - 8, { align: "right" });
};

export const generateReport = (opts: ReportOptions): void => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawHeader(doc, opts);

  // Title block
  let y = 36;
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(opts.title, 12, y);
  y += 7;
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text(opts.subtitle, 12, y);
    y += 6;
  }
  if (opts.author) {
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_MUTED);
    doc.text(`Prepared by: ${opts.author}`, 12, y);
    y += 5;
  }
  y += 4;

  // Sections
  for (const sec of opts.sections) {
    if (y > 260) {
      doc.addPage();
      drawHeader(doc, opts);
      y = 36;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text(sec.heading, 12, y);
    y += 2;
    doc.setDrawColor(...BRAND_PRIMARY);
    doc.setLineWidth(0.3);
    doc.line(12, y, 60, y);
    y += 5;

    if (sec.body) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND_DARK);
      const lines = doc.splitTextToSize(sec.body, doc.internal.pageSize.getWidth() - 24);
      doc.text(lines, 12, y);
      y += lines.length * 4.5 + 4;
    }

    if (sec.table) {
      autoTable(doc, {
        startY: y,
        head: [sec.table.headers],
        body: sec.table.rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: BRAND_PRIMARY, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 12, right: 12 },
        ...sec.table.options,
      });
      // @ts-expect-error - lastAutoTable injected by autotable
      y = (doc.lastAutoTable?.finalY ?? y) + 8;
    }
  }

  // Footers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`${opts.filename}.pdf`);
};
