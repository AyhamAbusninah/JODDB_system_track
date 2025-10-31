import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type TechnicianReport } from '../types';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  roleType?: 'all' | 'technician' | 'quality';
  jobOrderCode?: string;
}

export const generateSupervisorReport = (
  reports: TechnicianReport[],
  filters?: ReportFilters
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JODDB System - Supervisor Report', 14, 20);
  
  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Aselsan Middle East', 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, 14, 33);
  
  // Report filters summary
  let yPos = 43;
  if (filters) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Filters:', 14, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (filters.startDate) {
      doc.text(`Start Date: ${filters.startDate}`, 14, yPos);
      yPos += 5;
    }
    if (filters.endDate) {
      doc.text(`End Date: ${filters.endDate}`, 14, yPos);
      yPos += 5;
    }
    if (filters.roleType && filters.roleType !== 'all') {
      doc.text(`Role Type: ${filters.roleType}`, 14, yPos);
      yPos += 5;
    }
    if (filters.jobOrderCode) {
      doc.text(`Job Order: ${filters.jobOrderCode}`, 14, yPos);
      yPos += 5;
    }
    yPos += 3;
  }
  
  // Summary Statistics
  const techReports = reports.filter(r => r.roleType === 'technician').length;
  const qaReports = reports.filter(r => r.roleType === 'quality').length;
  const totalTime = reports.reduce((sum, r) => sum + r.actualTimeSeconds, 0);
  const avgTimePerReport = reports.length > 0 ? Math.round(totalTime / reports.length) : 0;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Reports', reports.length.toString()],
    ['Technician Reports', techReports.toString()],
    ['Quality Reports', qaReports.toString()],
    ['Total Work Time', `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`],
    ['Average Time per Report', `${Math.floor(avgTimePerReport / 60)}m`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 40 }
    },
    margin: { left: 14 }
  });
  
  // Reports Table
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Reports', 14, yPos);
  yPos += 7;
  
  const tableData = reports.map(report => [
    report.id,
    report.jobOrderCode,
    report.deviceSerial,
    report.technicianName,
    report.operationName,
    report.roleType === 'technician' ? 'Tech' : 'QA',
    new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    `${Math.floor(report.actualTimeSeconds / 60)}m`,
    report.content.substring(0, 50) + (report.content.length > 50 ? '...' : '')
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['ID', 'Job Order', 'Device', 'Author', 'Operation', 'Type', 'Date', 'Time', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [59, 130, 246], 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 18 },
      7: { cellWidth: 15 },
      8: { cellWidth: 40 }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  const fileName = `supervisor_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateDetailedReport = (report: TechnicianReport) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report ID: ${report.id}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
  
  // Report Type Badge
  const roleType = report.roleType === 'technician' ? 'Technician Report' : 'Quality Inspector Report';
  doc.setFillColor(report.roleType === 'technician' ? 59 : 147, report.roleType === 'technician' ? 130 : 51, report.roleType === 'technician' ? 246 : 234);
  doc.roundedRect(14, 40, 60, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(roleType, 44, 45, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Task Information
  let yPos = 55;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Information', 14, yPos);
  yPos += 8;
  
  const taskInfo = [
    ['Job Order', report.jobOrderCode],
    ['Device Serial', report.deviceSerial],
    ['Operation', report.operationName],
    ['Author', report.technicianName],
    ['Submitted', new Date(report.createdAt).toLocaleString()]
  ];
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  taskInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 6;
  });
  
  // Timeline
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Work Timeline', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Start Time: ${report.startTime}`, 14, yPos);
  yPos += 6;
  doc.text(`End Time: ${report.endTime}`, 14, yPos);
  yPos += 6;
  const hours = Math.floor(report.actualTimeSeconds / 3600);
  const minutes = Math.floor((report.actualTimeSeconds % 3600) / 60);
  doc.text(`Duration: ${hours}h ${minutes}m`, 14, yPos);
  yPos += 6;
  
  // Report Content
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Content', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitContent = doc.splitTextToSize(report.content, 180);
  doc.text(splitContent, 14, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Aselsan Middle East - JODDB System',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  // Save
  const fileName = `report_${report.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
