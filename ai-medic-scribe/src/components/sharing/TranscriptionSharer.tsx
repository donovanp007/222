"use client";

import { useState } from "react";
import { Share2, Download, Copy, Mail, Eye, Calendar, User, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Patient, Session } from "@/types";

interface TranscriptionSharerProps {
  patient: Patient;
  session: Session;
  onShare: (shareData: ShareData) => void;
}

interface ShareData {
  format: 'markdown' | 'html' | 'pdf';
  content: string;
  recipients?: string[];
  subject?: string;
  message?: string;
}

export function TranscriptionSharer({ patient, session, onShare }: TranscriptionSharerProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareFormat, setShareFormat] = useState<'markdown' | 'html' | 'pdf'>('markdown');
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(`Medical Transcription - ${patient.name} ${patient.surname}`);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const generateMarkdown = (): string => {
    const visitDate = session.visitDate ? new Date(session.visitDate) : new Date(session.createdAt);
    
    return `# Medical Transcription Report

## Patient Information
- **Name:** ${patient.name} ${patient.surname}
- **Age:** ${patient.age} years
- **Date of Birth:** ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-ZA') : 'Not specified'}
- **Contact:** ${patient.contact || 'Not provided'}
- **ID Number:** ${patient.idNumber || 'Not provided'}

${patient.medicalAid ? `### Medical Aid Information
- **Provider:** ${patient.medicalAid.provider}
- **Member Number:** ${patient.medicalAid.memberNumber}
- **Dependent Code:** ${patient.medicalAid.dependentCode || 'N/A'}

` : ''}## Session Details
- **Session Title:** ${session.title}
- **Visit Date:** ${visitDate.toLocaleDateString('en-ZA')} at ${visitDate.toLocaleTimeString('en-ZA')}
- **Session Type:** ${session.consultationType.charAt(0).toUpperCase() + session.consultationType.slice(1).replace('-', ' ')}
- **Doctor:** ${session.doctorId || 'Current User'}

${session.diagnosis && session.diagnosis.length > 0 ? `## Diagnosis
${session.diagnosis.map((diag, index) => `${index + 1}. ${diag}`).join('\n')}

` : ''}${session.templateData && Object.keys(session.templateData).length > 0 ? `## Structured Medical Notes

${Object.entries(session.templateData).map(([sectionId, content]) => {
  const sectionTitle = sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `### ${sectionTitle}

${content || 'No content recorded'}

`;
}).join('')}` : ''}## Raw Transcription

${session.content || 'No transcription content available'}

---

### Document Information
- **Generated:** ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')}
- **Platform:** AI Medical Scribe
- **Status:** ${session.isLocked ? 'Finalized' : 'Draft'}
- **Last Updated:** ${session.updatedAt ? new Date(session.updatedAt).toLocaleDateString('en-ZA') : 'Not specified'}

> **Confidentiality Notice:** This document contains confidential patient information and should be handled according to POPIA (Protection of Personal Information Act) guidelines. Distribution should be limited to authorized healthcare providers involved in the patient's care.

### Digital Signature
This transcription has been generated and processed using AI Medical Scribe Platform. For verification or questions, please contact the originating practice.
`;
  };

  const generateHTML = (): string => {
    const markdownContent = generateMarkdown();
    
    // Simple markdown to HTML conversion
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Transcription - ${patient.name} ${patient.surname}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        h1 {
            color: #007AFF;
            border-bottom: 3px solid #007AFF;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34C759;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h3 {
            color: #FF9500;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        .patient-info, .session-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #007AFF;
        }
        .diagnosis {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #34C759;
        }
        .transcription {
            background: #fff8e1;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #FF9500;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            font-size: 0.9em;
            color: #666;
        }
        .confidentiality {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background: #007AFF;
            color: white;
            border-radius: 4px;
            font-size: 0.8em;
            margin: 2px;
        }
        @media print {
            body { font-size: 12pt; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    ${markdownContent
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\- \*\*(.+):\*\* (.+)$/gm, '<p><strong>$1:</strong> $2</p>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="confidentiality">$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
    }
</body>
</html>`;
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (shareFormat) {
      case 'markdown':
        content = generateMarkdown();
        filename = `transcription_${patient.surname}_${patient.name}_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = generateHTML();
        filename = `transcription_${patient.surname}_${patient.name}_${new Date().toISOString().split('T')[0]}.html`;
        mimeType = 'text/html';
        break;
      default:
        content = generateMarkdown();
        filename = `transcription_${patient.surname}_${patient.name}_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
    }

    onShare({
      format: shareFormat,
      content,
      recipients: recipients.split(',').map(r => r.trim()).filter(r => r),
      subject,
      message
    });

    downloadFile(content, filename, mimeType);
    setShowShareDialog(false);
  };

  const getPreviewContent = () => {
    switch (shareFormat) {
      case 'html':
        return generateHTML();
      default:
        return generateMarkdown();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Transcription
            <Badge variant="outline" className="ml-auto">
              {patient.name} {patient.surname}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(generateMarkdown())}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Markdown
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(generateMarkdown(), `transcription_${patient.surname}_${patient.name}.md`, 'text/markdown')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download MD
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(generateHTML(), `transcription_${patient.surname}_${patient.name}.html`, 'text/html')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download HTML
            </Button>

            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Mail className="w-4 h-4" />
                  Email Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Transcription</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <select
                      id="format"
                      value={shareFormat}
                      onChange={(e) => setShareFormat(e.target.value as 'markdown' | 'html' | 'pdf')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="markdown">Markdown (.md)</option>
                      <option value="html">HTML (.html)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                    <Input
                      id="recipients"
                      placeholder="colleague@example.com, specialist@hospital.co.za"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please find attached the medical transcription for review..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleShare} className="flex-1">
                      Share
                    </Button>
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Transcription Preview ({shareFormat.toUpperCase()})</DialogTitle>
                        </DialogHeader>
                        {shareFormat === 'html' ? (
                          <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                            {getPreviewContent()}
                          </pre>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>{patient.name} {patient.surname}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{new Date(session.visitDate).toLocaleDateString('en-ZA')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>{session.consultationType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>N/A</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}