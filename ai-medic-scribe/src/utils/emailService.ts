/**
 * Email Service for Medical Communications
 * Handles secure email composition, templates, and patient communications
 */

import { Patient } from '@/types';
import { MedicalFile } from './fileManager';

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'appointment' | 'follow-up' | 'results' | 'referral' | 'general' | 'emergency';
  subject: string;
  body: string;
  variables: EmailVariable[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  usage: {
    totalSent: number;
    lastUsed: Date | null;
    successRate: number;
  };
}

export interface EmailVariable {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  description?: string;
}

export interface EmailMessage {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  templateId?: string;
  patientId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: EmailTemplate['category'];
  scheduledDate?: Date;
  sentDate?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  metadata: EmailMetadata;
  securityLevel: 'standard' | 'encrypted' | 'confidential';
  requiresReadReceipt: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  isEncrypted: boolean;
  medicalFileId?: string;
}

export interface EmailMetadata {
  practiceInfo: PracticeInfo;
  patientConsent: ConsentInfo;
  auditTrail: AuditEntry[];
  deliveryTracking: DeliveryInfo;
  complianceFlags: ComplianceFlag[];
}

export interface PracticeInfo {
  practiceName: string;
  doctorName: string;
  practiceNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
}

export interface ConsentInfo {
  hasEmailConsent: boolean;
  consentDate: Date;
  consentType: 'explicit' | 'implied' | 'opt-in';
  canReceiveResults: boolean;
  canReceiveAppointments: boolean;
  canReceiveGeneral: boolean;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  ipAddress: string;
  details: string;
}

export interface DeliveryInfo {
  attempts: number;
  lastAttempt: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'bounced' | 'spam';
  readStatus: 'unread' | 'read' | 'unknown';
  readDate?: Date;
  errorMessage?: string;
}

export interface ComplianceFlag {
  type: 'POPIA' | 'HIPAA' | 'GDPR' | 'CUSTOM';
  status: 'compliant' | 'warning' | 'violation';
  description: string;
  resolution?: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  recipients: string[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  metrics: CampaignMetrics;
  createdAt: Date;
}

export interface CampaignMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private messages: Map<string, EmailMessage> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private practiceInfo: PracticeInfo;

  constructor() {
    this.practiceInfo = this.getDefaultPracticeInfo();
    this.initializeDefaultTemplates();
    this.loadFromStorage();
  }

  private getDefaultPracticeInfo(): PracticeInfo {
    return {
      practiceName: 'Medical Practice',
      doctorName: 'Dr. Practitioner',
      practiceNumber: 'MP001',
      contactEmail: 'info@medicalpractice.co.za',
      contactPhone: '+27 11 123 4567',
      address: 'Medical Centre, Johannesburg, South Africa'
    };
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'appointment-reminder',
        name: 'Appointment Reminder',
        category: 'appointment',
        subject: 'Appointment Reminder - {{appointmentDate}}',
        body: `Dear {{patientName}},

This is a friendly reminder of your upcoming appointment:

📅 Date: {{appointmentDate}}
⏰ Time: {{appointmentTime}}
🏥 Location: {{practiceAddress}}
👨‍⚕️ Doctor: {{doctorName}}

Please note:
• Arrive 15 minutes early for check-in
• Bring your medical aid card and ID
• Bring a list of current medications
• Contact us if you need to reschedule

If you need to cancel or reschedule, please call us at {{practicePhone}} at least 24 hours in advance.

Kind regards,
{{practiceName}}
📞 {{practicePhone}}
📧 {{practiceEmail}}

This email contains confidential medical information. If you received this in error, please delete it immediately.`,
        variables: [
          { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
          { key: 'appointmentDate', label: 'Appointment Date', type: 'date', required: true },
          { key: 'appointmentTime', label: 'Appointment Time', type: 'text', required: true },
          { key: 'doctorName', label: 'Doctor Name', type: 'text', required: true },
          { key: 'practiceAddress', label: 'Practice Address', type: 'text', required: false },
          { key: 'practicePhone', label: 'Practice Phone', type: 'text', required: false },
          { key: 'practiceEmail', label: 'Practice Email', type: 'text', required: false },
          { key: 'practiceName', label: 'Practice Name', type: 'text', required: false }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { totalSent: 0, lastUsed: null, successRate: 0 }
      },
      {
        id: 'test-results',
        name: 'Test Results Available',
        category: 'results',
        subject: 'Your Test Results are Ready - {{testType}}',
        body: `Dear {{patientName}},

Your recent test results are now available:

🧪 Test: {{testType}}
📅 Date Taken: {{testDate}}
📋 Status: {{resultStatus}}

{{#if normalResults}}
Good news! Your results are within normal limits.
{{else}}
Please schedule a follow-up appointment to discuss your results.
{{/if}}

Next Steps:
{{nextSteps}}

{{#if requiresFollowUp}}
⚠️ Important: Please schedule a follow-up appointment within {{followUpTimeframe}} to discuss these results.
{{/if}}

You can view your complete results by:
• Visiting our practice
• Calling us at {{practicePhone}}
• Logging into your patient portal (if available)

Please do not hesitate to contact us if you have any questions or concerns.

Best regards,
Dr. {{doctorName}}
{{practiceName}}

📞 {{practicePhone}}
📧 {{practiceEmail}}

Confidentiality Notice: This email contains confidential medical information protected by patient privacy laws.`,
        variables: [
          { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
          { key: 'testType', label: 'Test Type', type: 'text', required: true },
          { key: 'testDate', label: 'Test Date', type: 'date', required: true },
          { key: 'resultStatus', label: 'Result Status', type: 'select', required: true, 
            options: ['Normal', 'Abnormal', 'Pending', 'Requires Follow-up'] },
          { key: 'nextSteps', label: 'Next Steps', type: 'text', required: false },
          { key: 'requiresFollowUp', label: 'Requires Follow-up', type: 'select', required: false,
            options: ['Yes', 'No'] },
          { key: 'followUpTimeframe', label: 'Follow-up Timeframe', type: 'text', required: false },
          { key: 'doctorName', label: 'Doctor Name', type: 'text', required: true }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { totalSent: 0, lastUsed: null, successRate: 0 }
      },
      {
        id: 'referral-letter',
        name: 'Specialist Referral',
        category: 'referral',
        subject: 'Specialist Referral - {{patientName}} to {{specialistName}}',
        body: `Dear Dr. {{specialistName}},

RE: {{patientName}} (DOB: {{patientDOB}})

I am referring the above patient for your specialist opinion and management.

Clinical Summary:
{{clinicalSummary}}

Reason for Referral:
{{referralReason}}

Current Medications:
{{currentMedications}}

Relevant Investigations:
{{relevantInvestigations}}

Urgency: {{urgency}}

{{#if urgentReferral}}
⚠️ This is an urgent referral. Please prioritize this patient for the earliest available appointment.
{{/if}}

I would appreciate your assessment and recommendations for ongoing management. Please keep me informed of your findings and treatment plan.

The patient has been advised to contact your rooms directly to schedule an appointment. Their contact details are:
📞 {{patientPhone}}
📧 {{patientEmail}}

Thank you for your assistance with this patient's care.

Kind regards,

Dr. {{referringDoctor}}
{{practiceName}}
Practice Number: {{practiceNumber}}
📞 {{practicePhone}}
📧 {{practiceEmail}}

Attachments: {{attachmentList}}`,
        variables: [
          { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
          { key: 'patientDOB', label: 'Patient Date of Birth', type: 'date', required: true },
          { key: 'specialistName', label: 'Specialist Name', type: 'text', required: true },
          { key: 'clinicalSummary', label: 'Clinical Summary', type: 'text', required: true },
          { key: 'referralReason', label: 'Reason for Referral', type: 'text', required: true },
          { key: 'currentMedications', label: 'Current Medications', type: 'text', required: false },
          { key: 'relevantInvestigations', label: 'Relevant Investigations', type: 'text', required: false },
          { key: 'urgency', label: 'Urgency', type: 'select', required: true,
            options: ['Routine', 'Soon (2-4 weeks)', 'Urgent (1 week)', 'Emergency (immediate)'] },
          { key: 'patientPhone', label: 'Patient Phone', type: 'text', required: false },
          { key: 'patientEmail', label: 'Patient Email', type: 'text', required: false },
          { key: 'referringDoctor', label: 'Referring Doctor', type: 'text', required: true }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { totalSent: 0, lastUsed: null, successRate: 0 }
      },
      {
        id: 'follow-up-care',
        name: 'Follow-up Care Instructions',
        category: 'follow-up',
        subject: 'Follow-up Care Instructions - {{patientName}}',
        body: `Dear {{patientName}},

Thank you for your visit today. Here are your follow-up care instructions:

Diagnosis/Condition:
{{diagnosis}}

Treatment Provided:
{{treatmentProvided}}

Home Care Instructions:
{{homeInstructions}}

Medications:
{{medications}}

⚠️ Warning Signs - Contact us immediately if you experience:
{{warningSigns}}

Follow-up Appointment:
{{#if followUpRequired}}
Please schedule a follow-up appointment in {{followUpTimeframe}}.
{{/if}}

Additional Resources:
{{additionalResources}}

Remember:
• Take medications as prescribed
• Follow all instructions carefully
• Don't hesitate to contact us with questions
• Keep all follow-up appointments

Emergency Contact:
If you experience severe symptoms or emergency warning signs, please:
🚨 Call emergency services: 10177 or 112
🏥 Go to the nearest emergency department
📞 Contact our after-hours service: {{afterHoursNumber}}

Get Well Soon!

Dr. {{doctorName}}
{{practiceName}}
📞 {{practicePhone}}
📧 {{practiceEmail}}`,
        variables: [
          { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
          { key: 'diagnosis', label: 'Diagnosis/Condition', type: 'text', required: true },
          { key: 'treatmentProvided', label: 'Treatment Provided', type: 'text', required: true },
          { key: 'homeInstructions', label: 'Home Care Instructions', type: 'text', required: true },
          { key: 'medications', label: 'Medications', type: 'text', required: false },
          { key: 'warningSigns', label: 'Warning Signs', type: 'text', required: true },
          { key: 'followUpTimeframe', label: 'Follow-up Timeframe', type: 'text', required: false },
          { key: 'additionalResources', label: 'Additional Resources', type: 'text', required: false },
          { key: 'afterHoursNumber', label: 'After Hours Number', type: 'text', required: false },
          { key: 'doctorName', label: 'Doctor Name', type: 'text', required: true }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { totalSent: 0, lastUsed: null, successRate: 0 }
      },
      {
        id: 'general-communication',
        name: 'General Communication',
        category: 'general',
        subject: '{{subject}}',
        body: `Dear {{patientName}},

{{messageContent}}

{{#if actionRequired}}
Action Required:
{{actionDetails}}
{{/if}}

{{#if appointmentNeeded}}
Please contact our practice to schedule an appointment:
📞 {{practicePhone}}
📧 {{practiceEmail}}
{{/if}}

Best regards,
{{senderName}}
{{practiceName}}

Contact Information:
📞 {{practicePhone}}
📧 {{practiceEmail}}
🏥 {{practiceAddress}}

Confidentiality Notice: This communication contains confidential medical information.`,
        variables: [
          { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
          { key: 'subject', label: 'Email Subject', type: 'text', required: true },
          { key: 'messageContent', label: 'Message Content', type: 'text', required: true },
          { key: 'actionRequired', label: 'Action Required', type: 'select', required: false,
            options: ['Yes', 'No'] },
          { key: 'actionDetails', label: 'Action Details', type: 'text', required: false },
          { key: 'appointmentNeeded', label: 'Appointment Needed', type: 'select', required: false,
            options: ['Yes', 'No'] },
          { key: 'senderName', label: 'Sender Name', type: 'text', required: true }
        ],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { totalSent: 0, lastUsed: null, successRate: 0 }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Template Management
  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getTemplate(id: string): EmailTemplate | null {
    return this.templates.get(id) || null;
  }

  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): string {
    const id = this.generateId();
    const newTemplate: EmailTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: { totalSent: 0, lastUsed: null, successRate: 0 }
    };
    
    this.templates.set(id, newTemplate);
    this.saveToStorage();
    return id;
  }

  updateTemplate(id: string, updates: Partial<EmailTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    this.templates.set(id, {
      ...template,
      ...updates,
      updatedAt: new Date()
    });
    this.saveToStorage();
    return true;
  }

  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Message Composition
  composeMessage(
    templateId: string,
    patient: Patient,
    variables: Record<string, string>,
    options: Partial<EmailMessage> = {}
  ): EmailMessage {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const subject = this.processTemplate(template.subject, {
      ...variables,
      ...this.getPatientVariables(patient),
      ...this.getPracticeVariables()
    });

    const body = this.processTemplate(template.body, {
      ...variables,
      ...this.getPatientVariables(patient),
      ...this.getPracticeVariables()
    });

    const messageId = this.generateId();
    const message: EmailMessage = {
      id: messageId,
      to: [patient.email || ''],
      subject,
      body,
      attachments: [],
      templateId,
      patientId: patient.id,
      priority: 'normal',
      category: template.category,
      status: 'draft',
      securityLevel: 'standard',
      requiresReadReceipt: false,
      metadata: {
        practiceInfo: this.practiceInfo,
        patientConsent: this.getPatientConsent(patient),
        auditTrail: [{
          timestamp: new Date(),
          action: 'Message composed',
          userId: 'current_user',
          ipAddress: 'localhost',
          details: `Message composed using template: ${template.name}`
        }],
        deliveryTracking: {
          attempts: 0,
          lastAttempt: new Date(),
          deliveryStatus: 'pending',
          readStatus: 'unread'
        },
        complianceFlags: this.checkCompliance(patient, template.category)
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options
    };

    this.messages.set(messageId, message);
    return message;
  }

  // Template Processing
  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    // Replace simple variables {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return variables[variable] && variables[variable].toLowerCase() !== 'no' ? content : '';
    });

    return processed;
  }

  private getPatientVariables(patient: Patient): Record<string, string> {
    return {
      patientName: patient.name,
      patientEmail: patient.email || '',
      patientPhone: patient.phoneNumber || '',
      patientDOB: patient.dateOfBirth || '',
      patientId: patient.id
    };
  }

  private getPracticeVariables(): Record<string, string> {
    return {
      practiceName: this.practiceInfo.practiceName,
      doctorName: this.practiceInfo.doctorName,
      practiceNumber: this.practiceInfo.practiceNumber,
      practiceEmail: this.practiceInfo.contactEmail,
      practicePhone: this.practiceInfo.contactPhone,
      practiceAddress: this.practiceInfo.address
    };
  }

  // Message Management
  saveMessage(message: EmailMessage): void {
    message.updatedAt = new Date();
    this.messages.set(message.id, message);
    this.saveToStorage();
  }

  getMessage(id: string): EmailMessage | null {
    return this.messages.get(id) || null;
  }

  getMessages(): EmailMessage[] {
    return Array.from(this.messages.values());
  }

  getMessagesByPatient(patientId: string): EmailMessage[] {
    return Array.from(this.messages.values()).filter(m => m.patientId === patientId);
  }

  getMessagesByStatus(status: EmailMessage['status']): EmailMessage[] {
    return Array.from(this.messages.values()).filter(m => m.status === status);
  }

  // File Attachments
  addAttachment(messageId: string, file: MedicalFile): boolean {
    const message = this.getMessage(messageId);
    if (!message) return false;

    const attachment: EmailAttachment = {
      id: this.generateId(),
      name: file.name,
      type: file.mimeType,
      size: file.size,
      url: file.url,
      isEncrypted: file.isEncrypted,
      medicalFileId: file.id
    };

    message.attachments.push(attachment);
    this.saveMessage(message);
    return true;
  }

  removeAttachment(messageId: string, attachmentId: string): boolean {
    const message = this.getMessage(messageId);
    if (!message) return false;

    message.attachments = message.attachments.filter(a => a.id !== attachmentId);
    this.saveMessage(message);
    return true;
  }

  // Email Sending (Mock Implementation)
  async sendMessage(messageId: string): Promise<boolean> {
    const message = this.getMessage(messageId);
    if (!message) return false;

    // Validate message
    if (!this.validateMessage(message)) {
      return false;
    }

    try {
      message.status = 'sending';
      this.saveMessage(message);

      // Mock sending delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        message.status = 'sent';
        message.sentDate = new Date();
        message.metadata.deliveryTracking.deliveryStatus = 'delivered';
        message.metadata.deliveryTracking.attempts += 1;
        
        // Update template usage
        if (message.templateId) {
          const template = this.getTemplate(message.templateId);
          if (template) {
            template.usage.totalSent += 1;
            template.usage.lastUsed = new Date();
            this.updateTemplate(template.id, template);
          }
        }
      } else {
        message.status = 'failed';
        message.metadata.deliveryTracking.deliveryStatus = 'failed';
        message.metadata.deliveryTracking.errorMessage = 'SMTP server error';
      }

      this.saveMessage(message);
      return success;
    } catch (error) {
      message.status = 'failed';
      this.saveMessage(message);
      return false;
    }
  }

  // Schedule message for later sending
  scheduleMessage(messageId: string, scheduledDate: Date): boolean {
    const message = this.getMessage(messageId);
    if (!message) return false;

    message.scheduledDate = scheduledDate;
    message.status = 'scheduled';
    this.saveMessage(message);
    return true;
  }

  // Message validation
  private validateMessage(message: EmailMessage): boolean {
    if (!message.to.length) return false;
    if (!message.subject.trim()) return false;
    if (!message.body.trim()) return false;
    
    // Check patient consent
    if (!message.metadata.patientConsent.hasEmailConsent) return false;

    // Check compliance
    const hasViolations = message.metadata.complianceFlags.some(f => f.status === 'violation');
    if (hasViolations) return false;

    return true;
  }

  // Compliance and Consent
  private getPatientConsent(patient: Patient): ConsentInfo {
    // Mock consent - in real implementation, this would come from patient records
    return {
      hasEmailConsent: true,
      consentDate: new Date(),
      consentType: 'explicit',
      canReceiveResults: true,
      canReceiveAppointments: true,
      canReceiveGeneral: true
    };
  }

  private checkCompliance(patient: Patient, category: string): ComplianceFlag[] {
    const flags: ComplianceFlag[] = [];

    // POPIA compliance (South African data protection)
    flags.push({
      type: 'POPIA',
      status: 'compliant',
      description: 'Patient has provided explicit consent for email communication'
    });

    // Check for sensitive content
    if (category === 'results') {
      flags.push({
        type: 'CUSTOM',
        status: 'warning',
        description: 'Contains medical test results - ensure patient consent for electronic delivery'
      });
    }

    return flags;
  }

  // Utility methods
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage
  private saveToStorage(): void {
    try {
      const data = {
        templates: Array.from(this.templates.entries()),
        messages: Array.from(this.messages.entries()),
        practiceInfo: this.practiceInfo
      };
      localStorage.setItem('emailService', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save email service data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('emailService');
      if (stored) {
        const data = JSON.parse(stored);
        this.templates = new Map(data.templates || []);
        this.messages = new Map(data.messages || []);
        this.practiceInfo = { ...this.practiceInfo, ...data.practiceInfo };
      }
    } catch (error) {
      console.error('Failed to load email service data:', error);
    }
  }

  // Practice settings
  updatePracticeInfo(info: Partial<PracticeInfo>): void {
    this.practiceInfo = { ...this.practiceInfo, ...info };
    this.saveToStorage();
  }

  getPracticeInfo(): PracticeInfo {
    return { ...this.practiceInfo };
  }

  // Analytics
  getEmailAnalytics(): {
    totalSent: number;
    successRate: number;
    templateUsage: { templateId: string; name: string; usage: number }[];
    monthlyStats: { month: string; sent: number; delivered: number }[];
  } {
    const messages = this.getMessages();
    const totalSent = messages.filter(m => m.status === 'sent').length;
    const totalMessages = messages.length;
    const successRate = totalMessages > 0 ? (totalSent / totalMessages) * 100 : 0;

    const templateUsage = Array.from(this.templates.values()).map(t => ({
      templateId: t.id,
      name: t.name,
      usage: t.usage.totalSent
    }));

    // Mock monthly stats
    const monthlyStats = [
      { month: 'Jan 2024', sent: 45, delivered: 42 },
      { month: 'Feb 2024', sent: 52, delivered: 50 },
      { month: 'Mar 2024', sent: 38, delivered: 36 }
    ];

    return {
      totalSent,
      successRate,
      templateUsage,
      monthlyStats
    };
  }
}

export const emailService = new EmailService();

// Utility functions
export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatEmailPreview(message: EmailMessage): string {
  return `To: ${message.to.join(', ')}\nSubject: ${message.subject}\n\n${message.body.substring(0, 200)}${message.body.length > 200 ? '...' : ''}`;
}

export function calculateEmailPriority(category: EmailTemplate['category'], urgency?: string): EmailMessage['priority'] {
  if (category === 'emergency') return 'urgent';
  if (urgency === 'urgent' || urgency === 'emergency') return 'urgent';
  if (urgency === 'soon') return 'high';
  return 'normal';
}