import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Patient, Consultation } from '@/types';

interface PDFTemplateOptions {
  template: 'clinical' | 'specialist' | 'discharge' | 'prescription' | 'referral';
  includeLetterhead?: boolean;
  includeBranding?: boolean;
  includeSignature?: boolean;
  includeWatermark?: boolean;
  pageFormat?: 'A4' | 'Letter';
  colorScheme?: 'blue' | 'green' | 'gray' | 'medical';
  fontSize?: 'small' | 'medium' | 'large';
}

interface LetterheadConfig {
  hospitalName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  practiceNumber?: string;
  hpcsaNumber?: string;
}

interface DoctorSignature {
  name: string;
  title: string;
  credentials: string;
  signature?: string; // Base64 image data
  stamp?: string; // Base64 image data
}

export class EnhancedPDFExporter {
  private pdf: jsPDF;
  private currentY: number;
  private margin: number;
  private pageHeight: number;
  private pageWidth: number;
  private options: PDFTemplateOptions;
  private colors: Record<string, string>;
  private fonts: Record<string, number>;

  constructor(options: PDFTemplateOptions = { template: 'clinical' }) {
    this.options = {
      pageFormat: 'A4',
      includeLetterhead: true,
      includeBranding: true,
      includeSignature: true,
      includeWatermark: false,
      colorScheme: 'medical',
      fontSize: 'medium',
      ...options
    };

    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: this.options.pageFormat
    });

    this.margin = 20;
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margin;

    this.setupColors();
    this.setupFonts();
  }

  private setupColors(): void {
    switch (this.options.colorScheme) {
      case 'blue':
        this.colors = {
          primary: '#007AFF',
          secondary: '#5AC8FA',
          accent: '#FF9500',
          text: '#1C1C1E',
          lightGray: '#F2F2F7',
          darkGray: '#8E8E93'
        };
        break;
      case 'green':
        this.colors = {
          primary: '#34C759',
          secondary: '#30D158',
          accent: '#FF9500',
          text: '#1C1C1E',
          lightGray: '#F2F2F7',
          darkGray: '#8E8E93'
        };
        break;
      case 'medical':
        this.colors = {
          primary: '#0066CC',
          secondary: '#006699',
          accent: '#FF6B35',
          text: '#2C3E50',
          lightGray: '#F8F9FA',
          darkGray: '#6C757D'
        };
        break;
      default:
        this.colors = {
          primary: '#495057',
          secondary: '#6C757D',
          accent: '#17A2B8',
          text: '#212529',
          lightGray: '#F8F9FA',
          darkGray: '#6C757D'
        };
    }
  }

  private setupFonts(): void {
    switch (this.options.fontSize) {
      case 'small':
        this.fonts = { title: 16, heading: 12, body: 9, caption: 7 };
        break;
      case 'large':
        this.fonts = { title: 20, heading: 16, body: 12, caption: 10 };
        break;
      default:
        this.fonts = { title: 18, heading: 14, body: 10, caption: 8 };
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private checkPageBreak(additionalHeight: number): boolean {
    if (this.currentY + additionalHeight > this.pageHeight - this.margin - 30) {
      this.addPageFooter();
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addPageHeader();
      return true;
    }
    return false;
  }

  private addLetterhead(letterhead: LetterheadConfig): void {
    // Letterhead header background
    const [r, g, b] = this.hexToRgb(this.colors.primary);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(0, 0, this.pageWidth, 35, 'F');

    // Hospital/Practice name
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(this.fonts.title);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(letterhead.hospitalName, this.margin, 15);

    // Contact information
    this.pdf.setFontSize(this.fonts.caption);
    this.pdf.setFont('helvetica', 'normal');
    const contactY = 22;
    this.pdf.text(letterhead.address, this.margin, contactY);
    this.pdf.text(`Tel: ${letterhead.phone}`, this.margin, contactY + 4);
    this.pdf.text(`Email: ${letterhead.email}`, this.margin, contactY + 8);
    
    if (letterhead.website) {
      this.pdf.text(`Web: ${letterhead.website}`, this.margin + 80, contactY + 8);
    }

    // Professional registration numbers
    if (letterhead.practiceNumber || letterhead.hpcsaNumber) {
      const regY = contactY + 8;
      if (letterhead.practiceNumber) {
        this.pdf.text(`Practice No: ${letterhead.practiceNumber}`, this.pageWidth - 60, contactY);
      }
      if (letterhead.hpcsaNumber) {
        this.pdf.text(`HPCSA No: ${letterhead.hpcsaNumber}`, this.pageWidth - 60, contactY + 4);
      }
    }

    this.currentY = 45;
  }

  private addPageHeader(): void {
    if (this.pdf.getNumberOfPages() > 1) {
      const [r, g, b] = this.hexToRgb(this.colors.lightGray);
      this.pdf.setFillColor(r, g, b);
      this.pdf.rect(0, 0, this.pageWidth, 15, 'F');
      
      this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
      this.pdf.setFontSize(this.fonts.caption);
      this.pdf.text('Medical Record Continuation', this.margin, 10);
      
      this.currentY = 20;
    }
  }

  private addPageFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Footer line
    const [r, g, b] = this.hexToRgb(this.colors.lightGray);
    this.pdf.setDrawColor(r, g, b);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Page number
    this.pdf.setTextColor(...this.hexToRgb(this.colors.darkGray));
    this.pdf.setFontSize(this.fonts.caption);
    const pageNum = this.pdf.getNumberOfPages();
    this.pdf.text(`Page ${pageNum}`, this.pageWidth - this.margin - 15, footerY);

    // Generated timestamp
    this.pdf.text(
      `Generated: ${new Date().toLocaleDateString('en-ZA')} ${new Date().toLocaleTimeString('en-ZA')}`,
      this.margin,
      footerY
    );

    // Branding
    if (this.options.includeBranding) {
      this.pdf.text('Generated with AI Medical Scribe', this.pageWidth / 2 - 25, footerY);
    }
  }

  private addPatientInfo(patient: Patient): void {
    this.checkPageBreak(40);

    // Patient Information Section
    const [r, g, b] = this.hexToRgb(this.colors.primary);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(this.fonts.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PATIENT INFORMATION', this.margin + 2, this.currentY + 5.5);

    this.currentY += 12;

    // Patient details in structured format
    const infoBoxHeight = 25;
    this.pdf.setFillColor(...this.hexToRgb(this.colors.lightGray));
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, infoBoxHeight, 'F');

    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFontSize(this.fonts.body);
    this.pdf.setFont('helvetica', 'normal');

    const startY = this.currentY + 5;
    const col1 = this.margin + 5;
    const col2 = this.pageWidth / 2;

    // Left column
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Name:', col1, startY);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`${patient.name} ${patient.surname}`, col1 + 15, startY);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Age:', col1, startY + 5);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`${patient.age} years`, col1 + 15, startY + 5);

    if (patient.idNumber) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('ID Number:', col1, startY + 10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(patient.idNumber, col1 + 20, startY + 10);
    }

    // Right column
    if (patient.contact) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Contact:', col2, startY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(patient.contact, col2 + 18, startY);
    }

    if (patient.medicalAid) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Medical Aid:', col2, startY + 5);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(patient.medicalAid.provider, col2 + 22, startY + 5);

      if (patient.medicalAid.memberNumber) {
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('Member No:', col2, startY + 10);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(patient.medicalAid.memberNumber, col2 + 22, startY + 10);
      }
    }

    this.currentY += infoBoxHeight + 10;
  }

  private addConsultationHeader(consultation: Consultation): void {
    this.checkPageBreak(20);

    // Consultation header
    const [r, g, b] = this.hexToRgb(this.colors.secondary);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(this.fonts.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(consultation.title.toUpperCase(), this.margin + 2, this.currentY + 5.5);

    this.currentY += 12;

    // Date and type
    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFontSize(this.fonts.body);
    this.pdf.setFont('helvetica', 'normal');

    const dateStr = consultation.visitDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.pdf.text(`Date: ${dateStr}`, this.margin, this.currentY);
    this.pdf.text(`Type: ${consultation.consultationType}`, this.pageWidth - this.margin - 40, this.currentY);

    this.currentY += 8;
  }

  private addRichTextContent(content: string, title: string): void {
    this.checkPageBreak(20);

    // Section title
    this.pdf.setTextColor(...this.hexToRgb(this.colors.primary));
    this.pdf.setFontSize(this.fonts.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);

    this.currentY += 6;

    // Underline
    this.pdf.setDrawColor(...this.hexToRgb(this.colors.primary));
    this.pdf.line(this.margin, this.currentY, this.margin + 40, this.currentY);

    this.currentY += 5;

    // Parse and render rich text content
    this.renderRichText(content);
  }

  private renderRichText(htmlContent: string): void {
    // Strip HTML tags for basic PDF rendering
    const textContent = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n**')
      .replace(/<\/h[1-6]>/gi, '**\n')
      .replace(/<strong[^>]*>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      .replace(/<b[^>]*>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<em[^>]*>/gi, '*')
      .replace(/<\/em>/gi, '*')
      .replace(/<i[^>]*>/gi, '*')
      .replace(/<\/i>/gi, '*')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\n\s*\n/g, '\n') // Clean up multiple newlines
      .trim();

    const lines = textContent.split('\n');
    
    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFontSize(this.fonts.body);

    for (const line of lines) {
      if (!line.trim()) {
        this.currentY += 3;
        continue;
      }

      this.checkPageBreak(6);

      // Handle formatting
      if (line.includes('**')) {
        this.renderFormattedLine(line, 'bold');
      } else if (line.includes('*')) {
        this.renderFormattedLine(line, 'italic');
      } else {
        this.pdf.setFont('helvetica', 'normal');
        this.renderWrappedText(line);
      }

      this.currentY += 5;
    }
  }

  private renderFormattedLine(line: string, format: 'bold' | 'italic'): void {
    const marker = format === 'bold' ? '**' : '*';
    const parts = line.split(marker);
    let x = this.margin;

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        this.pdf.setFont('helvetica', 'normal');
      } else {
        this.pdf.setFont('helvetica', format);
      }

      if (parts[i]) {
        this.pdf.text(parts[i], x, this.currentY);
        x += this.pdf.getTextWidth(parts[i]);
      }
    }
  }

  private renderWrappedText(text: string): void {
    const maxWidth = this.pageWidth - 2 * this.margin;
    const lines = this.pdf.splitTextToSize(text, maxWidth);

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        this.checkPageBreak(5);
        this.currentY += 5;
      }
      this.pdf.text(lines[i], this.margin, this.currentY);
    }
  }

  private addDiagnosis(diagnoses: string[]): void {
    if (!diagnoses || diagnoses.length === 0) return;

    this.checkPageBreak(20);

    // Diagnosis header
    const [r, g, b] = this.hexToRgb(this.colors.accent);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(this.fonts.body);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DIAGNOSIS', this.margin + 2, this.currentY + 4);

    this.currentY += 10;

    // Diagnosis list
    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFont('helvetica', 'normal');

    diagnoses.forEach((diagnosis, index) => {
      this.checkPageBreak(5);
      this.pdf.text(`${index + 1}. ${diagnosis}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 5;
  }

  private addSignature(signature: DoctorSignature): void {
    this.checkPageBreak(30);

    const signatureBoxY = this.currentY;
    const signatureBoxHeight = 25;

    // Signature box
    this.pdf.setDrawColor(...this.hexToRgb(this.colors.darkGray));
    this.pdf.rect(this.pageWidth - this.margin - 80, signatureBoxY, 80, signatureBoxHeight);

    // Signature line
    this.pdf.line(
      this.pageWidth - this.margin - 75,
      signatureBoxY + signatureBoxHeight - 8,
      this.pageWidth - this.margin - 5,
      signatureBoxY + signatureBoxHeight - 8
    );

    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFontSize(this.fonts.caption);
    this.pdf.setFont('helvetica', 'normal');

    // Doctor details
    this.pdf.text(signature.name, this.pageWidth - this.margin - 75, signatureBoxY + signatureBoxHeight - 4);
    this.pdf.text(signature.title, this.pageWidth - this.margin - 75, signatureBoxY + signatureBoxHeight);
    this.pdf.text(signature.credentials, this.pageWidth - this.margin - 75, signatureBoxY + signatureBoxHeight + 4);

    this.currentY += signatureBoxHeight + 10;
  }

  private addWatermark(): void {
    if (!this.options.includeWatermark) return;

    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.pdf.setTextColor(220, 220, 220);
      this.pdf.setFontSize(50);
      this.pdf.setFont('helvetica', 'bold');
      
      // Center the watermark
      const text = 'CONFIDENTIAL';
      const textWidth = this.pdf.getTextWidth(text);
      const x = (this.pageWidth - textWidth) / 2;
      const y = this.pageHeight / 2;
      
      // Rotate and add watermark
      this.pdf.text(text, x, y, { angle: -45 });
    }
  }

  public async exportConsultation(
    patient: Patient,
    consultation: Consultation,
    letterhead?: LetterheadConfig,
    signature?: DoctorSignature
  ): Promise<void> {
    // Add letterhead if provided
    if (letterhead && this.options.includeLetterhead) {
      this.addLetterhead(letterhead);
    }

    // Add patient information
    this.addPatientInfo(patient);

    // Add consultation header
    this.addConsultationHeader(consultation);

    // Add consultation content
    this.addRichTextContent(consultation.content, 'CONSULTATION NOTES');

    // Add diagnosis
    if (consultation.diagnosis) {
      this.addDiagnosis(consultation.diagnosis);
    }

    // Add signature
    if (signature && this.options.includeSignature) {
      this.addSignature(signature);
    }

    // Add watermark
    this.addWatermark();

    // Add footer to all pages
    const pageCount = this.pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.addPageFooter();
    }

    // Generate filename and download
    const fileName = `${patient.surname}_${patient.name}_${consultation.consultationType}_${consultation.visitDate.toISOString().split('T')[0]}.pdf`;
    this.pdf.save(fileName);
  }

  public async exportMultipleConsultations(
    patient: Patient,
    consultations: Consultation[],
    letterhead?: LetterheadConfig,
    signature?: DoctorSignature
  ): Promise<void> {
    // Add letterhead
    if (letterhead && this.options.includeLetterhead) {
      this.addLetterhead(letterhead);
    }

    // Add patient information
    this.addPatientInfo(patient);

    // Add table of contents
    this.addTableOfContents(consultations);

    // Add each consultation
    for (const consultation of consultations) {
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addPageHeader();
      this.addConsultationHeader(consultation);
      this.addRichTextContent(consultation.content, 'CONSULTATION NOTES');
      
      if (consultation.diagnosis) {
        this.addDiagnosis(consultation.diagnosis);
      }
    }

    // Add signature on last page
    if (signature && this.options.includeSignature) {
      this.addSignature(signature);
    }

    // Add watermark and footers
    this.addWatermark();
    const pageCount = this.pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.addPageFooter();
    }

    // Generate filename and download
    const fileName = `${patient.surname}_${patient.name}_complete_history_${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(fileName);
  }

  private addTableOfContents(consultations: Consultation[]): void {
    this.checkPageBreak(40);

    this.pdf.setTextColor(...this.hexToRgb(this.colors.primary));
    this.pdf.setFontSize(this.fonts.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TABLE OF CONTENTS', this.margin, this.currentY);

    this.currentY += 10;

    this.pdf.setTextColor(...this.hexToRgb(this.colors.text));
    this.pdf.setFontSize(this.fonts.body);
    this.pdf.setFont('helvetica', 'normal');

    consultations.forEach((consultation, index) => {
      this.checkPageBreak(5);
      const pageNum = index + 2; // Account for cover page
      this.pdf.text(
        `${consultation.title} - ${consultation.visitDate.toLocaleDateString('en-ZA')}`,
        this.margin + 5,
        this.currentY
      );
      this.pdf.text(`Page ${pageNum}`, this.pageWidth - this.margin - 20, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 10;
  }
}

export default EnhancedPDFExporter;