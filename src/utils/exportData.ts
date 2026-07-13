import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: any[], filename: string, title: string = 'Report') => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(33, 150, 243);
  doc.text(title, 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  
  // Prepare table data
  const headers = Object.keys(data[0]);
  const tableData = data.map(row => headers.map(header => row[header]));
  
  // Add table
  autoTable(doc, {
    head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1))],
    body: tableData,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
