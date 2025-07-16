import { Patient, Session } from '@/types';

export interface MarkdownExportOptions {
  includePatientInfo?: boolean;
  includeSessionDetails?: boolean;
  includeDiagnosis?: boolean;
  includeTemplateData?: boolean;
  includeRawTranscription?: boolean;
  includeMetadata?: boolean;
  practiceInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    hpcsa: string;
  };
}

export interface ExportedMarkdown {
  content: string;
  filename: string;
  metadata: {
    patient: string;
    sessionDate: Date;
    generatedAt: Date;
    wordCount: number;
  };
}

export function exportSessionToMarkdown(
  patient: Patient,
  session: Session,
  options: MarkdownExportOptions = {}
): ExportedMarkdown {
  const {
    includePatientInfo = true,
    includeSessionDetails = true,
    includeDiagnosis = true,
    includeTemplateData = true,
    includeRawTranscription = true,
    includeMetadata = true,
    practiceInfo
  } = options;

  const visitDate = session.visitDate ? new Date(session.visitDate) : new Date(session.createdAt);
  
  let markdown = `# Medical Transcription Report\n\n`;

  // Practice information
  if (practiceInfo) {
    markdown += `## Practice Information\n`;
    markdown += `**${practiceInfo.name}**\n\n`;
    markdown += `📍 ${practiceInfo.address}\n`;
    markdown += `📞 ${practiceInfo.phone}\n`;
    markdown += `📧 ${practiceInfo.email}\n`;
    markdown += `🏥 HPCSA: ${practiceInfo.hpcsa}\n\n`;
    markdown += `---\n\n`;
  }

  // Patient Information
  if (includePatientInfo) {
    markdown += `## 👤 Patient Information\n\n`;
    markdown += `| Field | Value |\n`;
    markdown += `|-------|-------|\n`;
    markdown += `| **Full Name** | ${patient.name} ${patient.surname} |\n`;
    markdown += `| **Age** | ${patient.age} years |\n`;
    
    if (patient.dateOfBirth) {
      markdown += `| **Date of Birth** | ${new Date(patient.dateOfBirth).toLocaleDateString('en-ZA')} |\n`;
    }
    
    if (patient.contact) {
      markdown += `| **Contact** | ${patient.contact} |\n`;
    }
    
    if (patient.idNumber) {
      markdown += `| **ID Number** | ${patient.idNumber} |\n`;
    }

    if (patient.medicalAid) {
      markdown += `| **Medical Aid** | ${patient.medicalAid.provider} |\n`;
      markdown += `| **Member Number** | ${patient.medicalAid.memberNumber} |\n`;
      if (patient.medicalAid.dependentCode) {
        markdown += `| **Dependent Code** | ${patient.medicalAid.dependentCode} |\n`;
      }
    }

    markdown += `\n`;
  }

  // Session Details
  if (includeSessionDetails) {
    markdown += `## 📋 Session Details\n\n`;
    markdown += `| Field | Value |\n`;
    markdown += `|-------|-------|\n`;
    markdown += `| **Session Title** | ${session.title} |\n`;
    markdown += `| **Visit Date** | ${visitDate.toLocaleDateString('en-ZA')} |\n`;
    markdown += `| **Visit Time** | ${visitDate.toLocaleTimeString('en-ZA')} |\n`;
    markdown += `| **Session Type** | ${session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1).replace('-', ' ')} |\n`;
    markdown += `| **Doctor** | ${session.doctorId || 'Current User'} |\n`;
    
    if (session.duration) {
      markdown += `| **Duration** | ${session.duration} minutes |\n`;
    }
    
    markdown += `| **Status** | ${session.isLocked ? '🔒 Finalized' : '📝 Draft'} |\n`;
    markdown += `\n`;
  }

  // Diagnosis
  if (includeDiagnosis && session.diagnosis && session.diagnosis.length > 0) {
    markdown += `## 🩺 Diagnosis\n\n`;
    session.diagnosis.forEach((diag, index) => {
      markdown += `${index + 1}. **${diag}**\n`;
    });
    markdown += `\n`;
  }

  // Structured Medical Notes
  if (includeTemplateData && session.templateData && Object.keys(session.templateData).length > 0) {
    markdown += `## 📝 Structured Medical Notes\n\n`;
    
    Object.entries(session.templateData).forEach(([sectionId, content]) => {
      if (content && content.trim()) {
        const sectionTitle = sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        markdown += `### ${sectionTitle}\n\n`;
        markdown += `${content.trim()}\n\n`;
      }
    });
  }

  // Raw Transcription
  if (includeRawTranscription && session.content) {
    markdown += `## 🎙️ Raw Transcription\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `${session.content}\n`;
    markdown += `\`\`\`\n\n`;
  }

  // Tasks if available
  if (session.suggestedTasks && session.suggestedTasks.length > 0) {
    markdown += `## ✅ Follow-up Tasks\n\n`;
    session.suggestedTasks.forEach((task, index) => {
      const statusIcon = task.isCompleted ? '✅' : '⏳';
      const priorityIcon = task.priority === 'urgent' ? '🔥' : task.priority === 'high' ? '⚠️' : '📋';
      
      markdown += `${index + 1}. ${statusIcon} ${priorityIcon} **${task.description}**\n`;
      markdown += `   - Type: ${task.type}\n`;
      markdown += `   - Priority: ${task.priority}\n`;
      
      if (task.dueDate) {
        markdown += `   - Due: ${new Date(task.dueDate).toLocaleDateString('en-ZA')}\n`;
      }
      
      markdown += `\n`;
    });
  }

  // Metadata
  if (includeMetadata) {
    markdown += `---\n\n`;
    markdown += `## 📊 Document Metadata\n\n`;
    markdown += `| Field | Value |\n`;
    markdown += `|-------|-------|\n`;
    markdown += `| **Generated On** | ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')} |\n`;
    markdown += `| **Platform** | AI Medical Scribe |\n`;
    markdown += `| **Session Created** | ${new Date(session.createdAt).toLocaleDateString('en-ZA')} |\n`;
    
    if (session.updatedAt) {
      markdown += `| **Last Updated** | ${new Date(session.updatedAt).toLocaleDateString('en-ZA')} |\n`;
    }
    
    const wordCount = session.content ? session.content.split(/\s+/).length : 0;
    markdown += `| **Word Count** | ${wordCount} words |\n`;
    markdown += `\n`;
  }

  // Confidentiality Notice
  markdown += `> **⚠️ Confidentiality Notice**\n`;
  markdown += `> \n`;
  markdown += `> This document contains confidential patient information and should be handled according to:\n`;
  markdown += `> - Protection of Personal Information Act (POPIA)\n`;
  markdown += `> - Health Professions Council of South Africa (HPCSA) guidelines\n`;
  markdown += `> - Medical ethics and professional conduct standards\n`;
  markdown += `> \n`;
  markdown += `> Distribution should be limited to authorized healthcare providers involved in the patient's care.\n\n`;

  // Digital Signature
  markdown += `### 🔐 Digital Verification\n\n`;
  markdown += `This transcription has been generated and processed using AI Medical Scribe Platform.\n`;
  markdown += `For verification, questions, or concerns, please contact the originating practice.\n\n`;
  
  if (practiceInfo) {
    markdown += `**Contact Information:**\n`;
    markdown += `- Practice: ${practiceInfo.name}\n`;
    markdown += `- Phone: ${practiceInfo.phone}\n`;
    markdown += `- Email: ${practiceInfo.email}\n`;
  }

  const filename = `transcription_${patient.surname}_${patient.name}_${visitDate.toISOString().split('T')[0]}.md`;
  const wordCount = session.content ? session.content.split(/\s+/).length : 0;

  return {
    content: markdown,
    filename,
    metadata: {
      patient: `${patient.name} ${patient.surname}`,
      sessionDate: visitDate,
      generatedAt: new Date(),
      wordCount
    }
  };
}

export function exportSessionToHTML(
  patient: Patient,
  session: Session,
  options: MarkdownExportOptions = {}
): ExportedMarkdown {
  const markdownExport = exportSessionToMarkdown(patient, session, options);
  
  // Convert markdown to HTML with styling
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Transcription - ${patient.name} ${patient.surname}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #ffffff;
        }
        h1 {
            color: #007AFF;
            border-bottom: 3px solid #007AFF;
            padding-bottom: 15px;
            margin-bottom: 30px;
            font-size: 2.5em;
            font-weight: 700;
        }
        h2 {
            color: #34C759;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
            font-weight: 600;
            padding-left: 15px;
            border-left: 4px solid #34C759;
        }
        h3 {
            color: #FF9500;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.4em;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background: #007AFF;
            color: white;
            font-weight: 600;
        }
        tr:last-child td {
            border-bottom: none;
        }
        .patient-info, .session-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 6px solid #007AFF;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .diagnosis {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 6px solid #34C759;
            margin: 20px 0;
        }
        .transcription {
            background: #fff8e1;
            padding: 25px;
            border-radius: 12px;
            border-left: 6px solid #FF9500;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            white-space: pre-wrap;
            margin: 25px 0;
            font-size: 0.95em;
            line-height: 1.5;
        }
        .metadata {
            background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-top: 3px solid #666;
        }
        .confidentiality {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #ffd93d;
            padding: 20px;
            border-radius: 12px;
            margin: 30px 0;
            font-style: italic;
        }
        .signature {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 6px solid #2196f3;
            margin: 25px 0;
        }
        .task-list {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 6px solid #0ea5e9;
            margin: 20px 0;
        }
        .task-item {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #0ea5e9;
        }
        code {
            background: #f1f1f1;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', monospace;
        }
        pre {
            background: #f8f8f8;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'SF Mono', 'Monaco', monospace;
            border-left: 4px solid #ccc;
        }
        blockquote {
            margin: 20px 0;
            padding: 15px 20px;
            background: #fff3cd;
            border-left: 6px solid #ffc107;
            border-radius: 8px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 3px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
        }
        @media print {
            body { 
                font-size: 11pt; 
                padding: 20px;
            }
            .no-print { 
                display: none; 
            }
            h1, h2, h3 {
                page-break-after: avoid;
            }
            .patient-info, .session-info, .diagnosis, .transcription {
                page-break-inside: avoid;
            }
        }
        @media (max-width: 768px) {
            body {
                padding: 20px 15px;
            }
            h1 {
                font-size: 2em;
            }
            h2 {
                font-size: 1.5em;
            }
            table {
                font-size: 0.9em;
            }
        }
    </style>
</head>
<body>
    ${markdownExport.content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\| (.+) \|/g, '<tr><td>$1</td></tr>')
      .replace(/\|-------|-------\|/g, '')
      .replace(/\| \*\*(.+)\*\* \| (.+) \|/g, '<tr><td><strong>$1</strong></td><td>$2</td></tr>')
      .replace(/^\d+\. \*\*(.+)\*\*$/gm, '<li><strong>$1</strong></li>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```\n([\s\S]*?)\n```/g, '<pre>$1</pre>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|p|l|b|t|d|u]).+$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
    }
    
    <div class="footer">
        <p><strong>AI Medical Scribe Platform</strong></p>
        <p>Generated on ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')}</p>
    </div>
</body>
</html>`;

  return {
    content: htmlContent,
    filename: markdownExport.filename.replace('.md', '.html'),
    metadata: markdownExport.metadata
  };
}