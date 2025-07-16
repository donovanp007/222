"use client";

import { useState } from "react";
import { FileText, Download, Send, Calendar, Mail, Printer, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Patient, Session } from "@/types";
import { EmailComposer } from "../communication/EmailComposer";
import { jsPDF } from 'jspdf';

interface MedicalDocumentGeneratorProps {
  patient: Patient;
  session?: Session;
  onGenerateDocument: (document: MedicalDocument) => void;
  onEmailDocument?: (document: MedicalDocument, email: string) => void;
}

interface MedicalDocument {
  type: 'sick_note' | 'referral_letter' | 'discharge_summary' | 'prescription' | 'medical_certificate';
  title: string;
  content: string;
  metadata: {
    patientName: string;
    doctorName: string;
    practiceDetails: PracticeDetails;
    dateIssued: Date;
    validUntil?: Date;
    recipientDetails?: RecipientDetails;
  };
}

interface PracticeDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber: string;
  hpcsa: string;
}

interface RecipientDetails {
  name: string;
  specialty: string;
  practice: string;
  address: string;
}

const defaultPracticeDetails: PracticeDetails = {
  name: "Dr. Medical Practice",
  address: "123 Health Street, Cape Town, 8001",
  phone: "+27 21 123 4567",
  email: "doctor@practice.co.za",
  registrationNumber: "MP123456",
  hpcsa: "HPCSA123456"
};

export function MedicalDocumentGenerator({ 
  patient, 
  session, 
  onGenerateDocument, 
  onEmailDocument 
}: MedicalDocumentGeneratorProps) {
  const [documentType, setDocumentType] = useState<MedicalDocument['type']>('sick_note');
  const [doctorName, setDoctorName] = useState("Dr. John Smith");
  const [practiceDetails] = useState<PracticeDetails>(defaultPracticeDetails);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<MedicalDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Sick Note specific fields
  const [diagnosis, setDiagnosis] = useState("");
  const [daysOff, setDaysOff] = useState("3");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [workRestrictions, setWorkRestrictions] = useState("");
  
  // Referral Letter specific fields
  const [referralReason, setReferralReason] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">("routine");
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails>({
    name: "",
    specialty: "",
    practice: "",
    address: ""
  });
  
  // Email fields
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const generateSickNote = (): MedicalDocument => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(daysOff));
    
    const content = `
MEDICAL CERTIFICATE / SICK NOTE

Patient Details:
Name: ${patient.name} ${patient.surname}
Date of Birth: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-ZA') : 'Not specified'}
${patient.idNumber ? `ID Number: ${patient.idNumber}` : ''}

Medical Assessment:
Date of Consultation: ${new Date().toLocaleDateString('en-ZA')}
Diagnosis: ${diagnosis}

Medical Recommendation:
This patient is medically unfit for work from ${new Date(startDate).toLocaleDateString('en-ZA')} to ${endDate.toLocaleDateString('en-ZA')} (${daysOff} day${parseInt(daysOff) > 1 ? 's' : ''}).

${workRestrictions ? `Work Restrictions: ${workRestrictions}` : ''}

This certificate is issued in accordance with medical assessment and professional judgment.

Doctor: ${doctorName}
Practice: ${practiceDetails.name}
HPCSA Registration: ${practiceDetails.hpcsa}
Date Issued: ${new Date().toLocaleDateString('en-ZA')}

Contact Details:
${practiceDetails.address}
Tel: ${practiceDetails.phone}
Email: ${practiceDetails.email}

This is a computer-generated document and is valid without signature.
    `.trim();

    return {
      type: 'sick_note',
      title: `Sick Note - ${patient.name} ${patient.surname}`,
      content,
      metadata: {
        patientName: `${patient.name} ${patient.surname}`,
        doctorName,
        practiceDetails,
        dateIssued: new Date(),
        validUntil: endDate
      }
    };
  };

  const generateReferralLetter = (): MedicalDocument => {
    const content = `
SPECIALIST REFERRAL LETTER

Date: ${new Date().toLocaleDateString('en-ZA')}

To: ${recipientDetails.name}
${recipientDetails.specialty}
${recipientDetails.practice}
${recipientDetails.address}

Re: ${patient.name} ${patient.surname}
${patient.dateOfBirth ? `DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-ZA')}` : ''}
${patient.idNumber ? `ID: ${patient.idNumber}` : ''}
${patient.contact ? `Contact: ${patient.contact}` : ''}

Dear Colleague,

I would appreciate your ${urgency === 'emergency' ? 'URGENT ' : urgency === 'urgent' ? 'urgent ' : ''}assessment and management of the above patient.

Clinical History:
${session?.content || 'Please see attached consultation notes.'}

Reason for Referral:
${referralReason}

${urgency === 'emergency' ? 'This is an EMERGENCY referral requiring immediate attention.' : 
  urgency === 'urgent' ? 'This is an urgent referral. Please see within 24-48 hours.' : 
  'Routine referral at your earliest convenience.'}

Current Medications:
${session?.templateData ? Object.entries(session.templateData).find(([key]) => key.toLowerCase().includes('medication') || key.toLowerCase().includes('treatment'))?.[1] || 'None specified' : 'Please see consultation notes'}

I have discussed this referral with the patient and they understand the need for specialist assessment.

Please let me know if you require any additional information.

Kind regards,

${doctorName}
${practiceDetails.name}
HPCSA: ${practiceDetails.hpcsa}
Tel: ${practiceDetails.phone}
Email: ${practiceDetails.email}

---
This referral letter was generated electronically and is valid without signature.
Patient copy provided.
    `.trim();

    return {
      type: 'referral_letter',
      title: `Referral Letter - ${patient.name} ${patient.surname}`,
      content,
      metadata: {
        patientName: `${patient.name} ${patient.surname}`,
        doctorName,
        practiceDetails,
        dateIssued: new Date(),
        recipientDetails
      }
    };
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      let document: MedicalDocument;
      
      switch (documentType) {
        case 'sick_note':
          document = generateSickNote();
          break;
        case 'referral_letter':
          document = generateReferralLetter();
          break;
        default:
          throw new Error(`Document type ${documentType} not implemented yet`);
      }
      
      setGeneratedDocument(document);
      onGenerateDocument(document);
      
      // Auto-populate email fields
      if (documentType === 'sick_note' && patient.contact) {
        setRecipientEmail(patient.contact);
        setEmailSubject(`Medical Certificate - ${patient.name} ${patient.surname}`);
        setEmailMessage(`Dear ${patient.name},\n\nPlease find attached your medical certificate as discussed during your consultation.\n\nIf you have any questions, please don't hesitate to contact our practice.\n\nBest regards,\n${doctorName}\n${practiceDetails.name}`);
      }
      
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = () => {
    if (!generatedDocument) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4'
    });

    const margin = 20;
    let currentY = margin;

    // Header
    pdf.setFillColor(0, 122, 255);
    pdf.rect(0, 0, pdf.internal.pageSize.width, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI Medical Scribe Platform', margin, 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const now = new Date();
    pdf.text(
      `Generated: ${now.toLocaleDateString('en-ZA')} ${now.toLocaleTimeString('en-ZA')}`,
      pdf.internal.pageSize.width - margin - 50,
      15
    );

    currentY = 35;

    // Document title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(generatedDocument.title.toUpperCase(), margin, currentY);
    currentY += 15;

    // Practice details
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, currentY, pdf.internal.pageSize.width - 2 * margin, 20, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRACTICE INFORMATION', margin + 5, currentY + 7);
    
    currentY += 25;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(`Practice: ${practiceDetails.name}`, margin + 5, currentY);
    currentY += 5;
    pdf.text(`Address: ${practiceDetails.address}`, margin + 5, currentY);
    currentY += 5;
    pdf.text(`Phone: ${practiceDetails.phone}`, margin + 5, currentY);
    currentY += 5;
    pdf.text(`Email: ${practiceDetails.email}`, margin + 5, currentY);
    currentY += 5;
    pdf.text(`HPCSA: ${practiceDetails.hpcsa}`, margin + 5, currentY);
    currentY += 15;

    // Document content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lines = pdf.splitTextToSize(generatedDocument.content, pdf.internal.pageSize.width - 2 * margin);
    
    lines.forEach((line: string) => {
      if (currentY > pdf.internal.pageSize.height - 30) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(line, margin, currentY);
      currentY += 5;
    });

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, pdf.internal.pageSize.height - 15, pdf.internal.pageSize.width - margin, pdf.internal.pageSize.height - 15);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      
      pdf.text('AI Medical Scribe Platform - Confidential Medical Document', margin, pdf.internal.pageSize.height - 10);
      pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - margin - 20, pdf.internal.pageSize.height - 10);
      
      pdf.text('This document contains confidential patient information and should be handled according to POPIA guidelines.', 
        margin, pdf.internal.pageSize.height - 5);
    }

    return pdf;
  };

  const downloadPDF = () => {
    const pdf = generatePDF();
    if (pdf) {
      const fileName = `${generatedDocument?.title.replace(/\s+/g, '_')}_${patient.surname}_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }
  };

  const printDocument = () => {
    if (!generatedDocument) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${generatedDocument.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
              }
              .header {
                background: #007AFF;
                color: white;
                padding: 20px;
                margin: -40px -40px 20px -40px;
                text-align: center;
              }
              .practice-info {
                background: #f5f5f5;
                padding: 15px;
                margin: 20px 0;
                border-left: 4px solid #007AFF;
              }
              .content {
                white-space: pre-wrap;
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 0.8em;
                color: #666;
                text-align: center;
              }
              @media print {
                body { margin: 20px; }
                .header { margin: -20px -20px 20px -20px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AI Medical Scribe Platform</h1>
              <p>Generated: ${new Date().toLocaleDateString('en-ZA')} ${new Date().toLocaleTimeString('en-ZA')}</p>
            </div>
            <h2>${generatedDocument.title}</h2>
            <div class="practice-info">
              <h3>Practice Information</h3>
              <p><strong>Practice:</strong> ${practiceDetails.name}</p>
              <p><strong>Address:</strong> ${practiceDetails.address}</p>
              <p><strong>Phone:</strong> ${practiceDetails.phone}</p>
              <p><strong>Email:</strong> ${practiceDetails.email}</p>
              <p><strong>HPCSA:</strong> ${practiceDetails.hpcsa}</p>
            </div>
            <div class="content">${generatedDocument.content}</div>
            <div class="footer">
              <p>AI Medical Scribe Platform - Confidential Medical Document</p>
              <p>This document contains confidential patient information and should be handled according to POPIA guidelines.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmailDocument = () => {
    if (!onEmailDocument || !recipientEmail) return;
    
    const document = documentType === 'sick_note' ? generateSickNote() : generateReferralLetter();
    onEmailDocument(document, recipientEmail);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <Badge variant="destructive" className="bg-red-600">EMERGENCY</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="bg-orange-600">URGENT</Badge>;
      default:
        return <Badge variant="outline">Routine</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Medical Document Generator
            <Badge variant="outline" className="ml-auto">
              {patient.name} {patient.surname}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={documentType} onValueChange={(value) => setDocumentType(value as MedicalDocument['type'])}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sick_note" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sick Note
              </TabsTrigger>
              <TabsTrigger value="referral_letter" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Referral Letter
              </TabsTrigger>
              <TabsTrigger value="discharge_summary" disabled className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Discharge Summary
              </TabsTrigger>
            </TabsList>

            {/* Sick Note Tab */}
            <TabsContent value="sick_note" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    placeholder="e.g., Upper respiratory tract infection"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days-off">Days Off Work</Label>
                  <Select value={daysOff} onValueChange={setDaysOff}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days (1 week)</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days (2 weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-name">Doctor Name</Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="work-restrictions">Work Restrictions (Optional)</Label>
                <Textarea
                  id="work-restrictions"
                  placeholder="e.g., Light duties only, No lifting >5kg"
                  value={workRestrictions}
                  onChange={(e) => setWorkRestrictions(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* Referral Letter Tab */}
            <TabsContent value="referral_letter" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialist-name">Specialist Name</Label>
                  <Input
                    id="specialist-name"
                    placeholder="Dr. Jane Specialist"
                    value={recipientDetails.name}
                    onChange={(e) => setRecipientDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select 
                    value={recipientDetails.specialty} 
                    onValueChange={(value) => setRecipientDetails(prev => ({ ...prev, specialty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Dermatology">Dermatology</SelectItem>
                      <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Oncology">Oncology</SelectItem>
                      <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                      <SelectItem value="Radiology">Radiology</SelectItem>
                      <SelectItem value="Urology">Urology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={urgency} onValueChange={(value: "routine" | "urgent" | "emergency") => setUrgency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent (24-48h)</SelectItem>
                      <SelectItem value="emergency">Emergency (Immediate)</SelectItem>
                    </SelectContent>
                  </Select>
                  {getUrgencyBadge(urgency)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practice-name">Practice Name</Label>
                  <Input
                    id="practice-name"
                    placeholder="Specialist Medical Centre"
                    value={recipientDetails.practice}
                    onChange={(e) => setRecipientDetails(prev => ({ ...prev, practice: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referral-reason">Reason for Referral</Label>
                <Textarea
                  id="referral-reason"
                  placeholder="Please assess and advise on management of..."
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialist-address">Specialist Address</Label>
                <Textarea
                  id="specialist-address"
                  placeholder="Practice address"
                  value={recipientDetails.address}
                  onChange={(e) => setRecipientDetails(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={generateDocument} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate Document
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={downloadPDF}
              disabled={!generatedDocument}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={printDocument}
              disabled={!generatedDocument}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={!generatedDocument}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden">
                <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
                  <DialogTitle className="flex items-center justify-between">
                    <span>Document Preview</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={printDocument}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(95vh-8rem)]">
                  {generatedDocument && (
                    <div className="bg-white shadow-2xl mx-auto max-w-3xl border border-gray-200" style={{ aspectRatio: '210/297' }}>
                      {/* A4 Paper Simulation */}
                      <div className="p-8 space-y-6 min-h-full bg-white">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 -mx-8 -mt-8 mb-8">
                          <div className="flex justify-between items-center">
                            <div>
                              <h1 className="text-2xl font-bold">AI Medical Scribe Platform</h1>
                              <p className="text-blue-100 text-sm">Professional Medical Documentation</p>
                            </div>
                            <div className="text-right text-sm text-blue-100">
                              <p>Generated: {new Date().toLocaleDateString('en-ZA')}</p>
                              <p>{new Date().toLocaleTimeString('en-ZA')}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Document Title */}
                        <div className="text-center border-b border-gray-200 pb-4">
                          <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">{generatedDocument.title}</h2>
                          <div className="w-24 h-1 bg-blue-600 mx-auto mt-2"></div>
                        </div>
                        
                        {/* Practice Information */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-blue-600 shadow-sm">
                          <h3 className="font-bold mb-4 text-blue-900 text-lg flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            Practice Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-gray-700">Practice:</p>
                              <p className="text-gray-900">{practiceDetails.name}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700">HPCSA:</p>
                              <p className="text-gray-900">{practiceDetails.hpcsa}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700">Address:</p>
                              <p className="text-gray-900">{practiceDetails.address}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700">Contact:</p>
                              <p className="text-gray-900">{practiceDetails.phone}</p>
                              <p className="text-gray-900">{practiceDetails.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Document Content */}
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 bg-transparent border-0 p-0">{generatedDocument.content}</pre>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="border-t-2 border-gray-200 pt-6 mt-8">
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <span className="font-semibold">AI Medical Scribe Platform</span>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <span>Confidential Medical Document</span>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs text-yellow-800 font-medium">
                                ⚠️ This document contains confidential patient information and should be handled according to POPIA guidelines.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Email Section */}
          {onEmailDocument && (
            <div className="pt-6 border-t mt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Document to Patient
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Patient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="patient@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Medical Certificate"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  placeholder="Email message to patient"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <EmailComposer
                    patient={patient}
                    initialTemplate="general-communication"
                    onSend={(message) => {
                      console.log('Document emailed successfully:', message);
                    }}
                    onClose={() => {}}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}