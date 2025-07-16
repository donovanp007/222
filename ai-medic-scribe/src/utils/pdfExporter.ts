import { jsPDF } from 'jspdf';
import { Patient, Session } from '@/types';

interface PDFExportOptions {
  includeHeader?: boolean;
  includeBranding?: boolean;
  includeTimestamp?: boolean;
  pageFormat?: 'A4' | 'Letter';
}

export class PDFExporter {
  private pdf: jsPDF;
  private currentY: number;
  private margin: number;
  private pageHeight: number;
  private pageWidth: number;

  constructor(options: PDFExportOptions = {}) {
    const {
      pageFormat = 'A4',
      includeHeader = true,
      includeBranding = true,
      includeTimestamp = true
    } = options;

    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageFormat
    });

    this.margin = 20;
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margin;
  }

  private checkPageBreak(additionalHeight: number): boolean {
    if (this.currentY + additionalHeight > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  private addHeader(patient: Patient, session: Session): void {
    // AI Medical Scribe Branding
    this.pdf.setFillColor(0, 122, 255); // Blue
    this.pdf.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Logo placeholder and title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('AI Medical Scribe Platform', this.margin, 15);
    
    // Date and time
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const now = new Date();
    this.pdf.text(
      `Generated: ${now.toLocaleDateString('en-ZA')} ${now.toLocaleTimeString('en-ZA')}`,
      this.pageWidth - this.margin - 50,
      15
    );

    this.currentY = 35;

    // Patient Header
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F');
    
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PATIENT INFORMATION', this.margin + 5, this.currentY + 7);
    
    this.currentY += 25;

    // Patient details in two columns
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    const leftColumn = this.margin + 5;
    const rightColumn = this.pageWidth / 2;
    
    this.pdf.text(`Name: ${patient.name} ${patient.surname}`, leftColumn, this.currentY);
    this.pdf.text(`Age: ${patient.age} years`, rightColumn, this.currentY);
    this.currentY += 5;
    
    if (patient.contact) {
      this.pdf.text(`Contact: ${patient.contact}`, leftColumn, this.currentY);
    }
    if (patient.medicalAid) {
      this.pdf.text(`Medical Aid: ${patient.medicalAid.provider}`, rightColumn, this.currentY);
    }
    this.currentY += 5;
    
    if (patient.idNumber) {
      this.pdf.text(`ID Number: ${patient.idNumber}`, leftColumn, this.currentY);
    }
    if (patient.medicalAid?.memberNumber) {
      this.pdf.text(`Member No: ${patient.medicalAid.memberNumber}`, rightColumn, this.currentY);
    }
    
    this.currentY += 15;
  }

  private addSessionHeader(session: Session): void {
    this.checkPageBreak(25);
    
    // Session header
    this.pdf.setFillColor(0, 122, 255);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('MEDICAL SESSION NOTES', this.margin + 5, this.currentY + 10);
    
    this.currentY += 20;
    this.pdf.setTextColor(0, 0, 0);

    // Session details
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    const visitDate = session.visitDate ? new Date(session.visitDate) : new Date(session.createdAt);
    this.pdf.text(`Session Title: ${session.title}`, this.margin + 5, this.currentY);
    this.currentY += 5;
    
    this.pdf.text(`Visit Date: ${visitDate.toLocaleDateString('en-ZA')} ${visitDate.toLocaleTimeString('en-ZA')}`, this.margin + 5, this.currentY);
    this.currentY += 5;
    
    this.pdf.text(`Session Type: ${session.sessionType}`, this.margin + 5, this.currentY);
    this.currentY += 5;
    
    if (session.doctorId) {
      this.pdf.text(`Doctor: ${session.doctorId}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    }
    
    if (session.duration) {
      this.pdf.text(`Duration: ${session.duration} minutes`, this.margin + 5, this.currentY);
      this.currentY += 5;
    }

    this.currentY += 5;
  }

  private addDiagnosis(session: Session): void {
    if (!session.diagnosis || session.diagnosis.length === 0) return;

    this.checkPageBreak(20);
    
    this.pdf.setFillColor(220, 255, 220); // Light green
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DIAGNOSIS', this.margin + 5, this.currentY + 8);
    
    this.currentY += 17;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    session.diagnosis.forEach((diag, index) => {
      this.checkPageBreak(5);
      this.pdf.text(`${index + 1}. ${diag}`, this.margin + 10, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 5;
  }

  private addTemplateData(session: Session): void {
    if (!session.templateData || Object.keys(session.templateData).length === 0) return;

    this.checkPageBreak(20);
    
    this.pdf.setFillColor(240, 248, 255); // Light blue
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('STRUCTURED MEDICAL NOTES', this.margin + 5, this.currentY + 8);
    
    this.currentY += 17;

    Object.entries(session.templateData).forEach(([sectionId, content]) => {
      // Safely convert content to string and check if it's empty
      const contentStr = content != null ? String(content).trim() : '';
      if (!contentStr) return;

      this.checkPageBreak(15);
      
      // Section title
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      const sectionTitle = sectionId.replace(/_/g, ' ').toUpperCase();
      this.pdf.text(sectionTitle, this.margin + 5, this.currentY);
      this.currentY += 7;
      
      // Section content
      this.pdf.setFont('helvetica', 'normal');
      const lines = this.pdf.splitTextToSize(contentStr, this.pageWidth - 2 * this.margin - 10);
      
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.pdf.text(line, this.margin + 10, this.currentY);
        this.currentY += 5;
      });
      
      this.currentY += 3;
    });
  }

  private addRawTranscription(session: Session): void {
    if (!session.content || session.content.trim() === '') return;

    this.checkPageBreak(20);
    
    this.pdf.setFillColor(255, 248, 220); // Light yellow
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('RAW TRANSCRIPTION', this.margin + 5, this.currentY + 8);
    
    this.currentY += 17;
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    const lines = this.pdf.splitTextToSize(session.content, this.pageWidth - 2 * this.margin - 10);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(4);
      this.pdf.text(line, this.margin + 10, this.currentY);
      this.currentY += 4;
    });
  }

  private addFooter(): void {
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Footer line
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(128, 128, 128);
      
      this.pdf.text('AI Medical Scribe Platform - Confidential Medical Document', this.margin, this.pageHeight - 10);
      this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 20, this.pageHeight - 10);
      
      // Confidentiality notice
      this.pdf.text('This document contains confidential patient information and should be handled according to HIPAA/POPIA guidelines.', 
        this.margin, this.pageHeight - 5);
    }
  }

  public generateSessionPDF(patient: Patient, session: Session): Uint8Array {
    // Add header with patient info
    this.addHeader(patient, session);
    
    // Add session information
    this.addSessionHeader(session);
    
    // Add diagnosis if present
    this.addDiagnosis(session);
    
    // Add structured template data
    this.addTemplateData(session);
    
    // Add raw transcription
    this.addRawTranscription(session);
    
    // Add footer to all pages
    this.addFooter();
    
    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  public downloadSessionPDF(patient: Patient, session: Session): void {
    this.generateSessionPDF(patient, session);
    
    const fileName = `${patient.surname}_${patient.name}_${session.sessionType}_${new Date(session.visitDate || session.createdAt).toISOString().split('T')[0]}.pdf`;
    
    this.pdf.save(fileName);
  }
}

// Utility function for easy use
export const exportSessionToPDF = (patient: Patient, session: Session): void => {
  const exporter = new PDFExporter();
  exporter.downloadSessionPDF(patient, session);
};

export const generateSessionPDFBlob = (patient: Patient, session: Session): Blob => {
  const exporter = new PDFExporter();
  const pdfData = exporter.generateSessionPDF(patient, session);
  return new Blob([pdfData], { type: 'application/pdf' });
};