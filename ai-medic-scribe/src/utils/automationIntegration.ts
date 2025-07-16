import { Patient, Session, FollowUpReminder } from "@/types";

// n8n Webhook Configuration
export interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  enabled: boolean;
}

// Automation Workflow Types
export interface AutomationWorkflow {
  id: string;
  name: string;
  type: 'patient_reminder' | 'document_due' | 'follow_up' | 'task_notification' | 'appointment_confirmation';
  enabled: boolean;
  config: WorkflowConfig;
}

interface WorkflowConfig {
  triggerConditions: TriggerCondition[];
  actions: AutomationAction[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    daysOfWeek?: number[]; // 0-6, Sunday = 0
  };
}

interface TriggerCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'days_ago' | 'days_from_now';
  value: string | number;
}

interface AutomationAction {
  type: 'send_email' | 'send_sms' | 'create_reminder' | 'notify_doctor' | 'update_patient';
  config: ActionConfig;
}

interface ActionConfig {
  template?: string;
  recipients?: string[];
  subject?: string;
  delay?: number; // minutes
  customData?: Record<string, any>;
}

// Automation Event Data
export interface AutomationEvent {
  id: string;
  workflowId: string;
  patientId: string;
  sessionId?: string;
  eventType: string;
  scheduledFor: Date;
  executedAt?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  attempts: number;
  lastError?: string;
  data: Record<string, any>;
}

class AutomationService {
  private config: N8nConfig;
  private workflows: AutomationWorkflow[] = [];
  private events: AutomationEvent[] = [];

  constructor() {
    // Load configuration from localStorage or environment
    this.config = this.loadConfig();
    this.workflows = this.loadWorkflows();
    this.events = this.loadEvents();
    
    // Start automation processor
    this.startEventProcessor();
  }

  private loadConfig(): N8nConfig {
    try {
      const stored = localStorage.getItem('automation-config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading automation config:', error);
    }

    return {
      webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '',
      apiKey: process.env.NEXT_PUBLIC_N8N_API_KEY || '',
      enabled: false
    };
  }

  private loadWorkflows(): AutomationWorkflow[] {
    try {
      const stored = localStorage.getItem('automation-workflows');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }

    // Default workflows
    return [
      {
        id: 'follow_up_6_months',
        name: '6 Month Follow-up Reminder',
        type: 'follow_up',
        enabled: true,
        config: {
          triggerConditions: [
            {
              field: 'lastVisit',
              operator: 'days_ago',
              value: 180 // 6 months
            }
          ],
          actions: [
            {
              type: 'send_email',
              config: {
                template: 'follow_up_reminder',
                subject: 'Time for your 6-month follow-up appointment',
                delay: 0
              }
            },
            {
              type: 'send_sms',
              config: {
                template: 'follow_up_sms',
                delay: 1440 // 24 hours later if no response
              }
            }
          ]
        }
      },
      {
        id: 'document_overdue',
        name: 'Overdue Document Reminder',
        type: 'document_due',
        enabled: true,
        config: {
          triggerConditions: [
            {
              field: 'sessionCreated',
              operator: 'days_ago',
              value: 7
            }
          ],
          actions: [
            {
              type: 'notify_doctor',
              config: {
                template: 'document_overdue',
                subject: 'Patient documentation overdue',
                delay: 0
              }
            }
          ]
        }
      },
      {
        id: 'appointment_confirmation',
        name: 'Appointment Confirmation',
        type: 'appointment_confirmation',
        enabled: true,
        config: {
          triggerConditions: [
            {
              field: 'appointmentScheduled',
              operator: 'days_from_now',
              value: 1
            }
          ],
          actions: [
            {
              type: 'send_sms',
              config: {
                template: 'appointment_confirmation',
                delay: 0
              }
            }
          ]
        }
      }
    ];
  }

  private loadEvents(): AutomationEvent[] {
    try {
      const stored = localStorage.getItem('automation-events');
      if (stored) {
        const events = JSON.parse(stored);
        return events.map((event: any) => ({
          ...event,
          scheduledFor: new Date(event.scheduledFor),
          executedAt: event.executedAt ? new Date(event.executedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading automation events:', error);
    }
    return [];
  }

  private saveConfig(): void {
    localStorage.setItem('automation-config', JSON.stringify(this.config));
  }

  private saveWorkflows(): void {
    localStorage.setItem('automation-workflows', JSON.stringify(this.workflows));
  }

  private saveEvents(): void {
    localStorage.setItem('automation-events', JSON.stringify(this.events));
  }

  // Public API Methods
  public updateConfig(config: Partial<N8nConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  public getConfig(): N8nConfig {
    return { ...this.config };
  }

  public createWorkflow(workflow: Omit<AutomationWorkflow, 'id'>): string {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWorkflow: AutomationWorkflow = { ...workflow, id };
    
    this.workflows.push(newWorkflow);
    this.saveWorkflows();
    
    return id;
  }

  public updateWorkflow(id: string, updates: Partial<AutomationWorkflow>): void {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index !== -1) {
      this.workflows[index] = { ...this.workflows[index], ...updates };
      this.saveWorkflows();
    }
  }

  public deleteWorkflow(id: string): void {
    this.workflows = this.workflows.filter(w => w.id !== id);
    this.saveWorkflows();
  }

  public getWorkflows(): AutomationWorkflow[] {
    return [...this.workflows];
  }

  // Event Management
  public scheduleEvent(
    workflowId: string,
    patientId: string,
    eventType: string,
    scheduledFor: Date,
    data: Record<string, any> = {},
    sessionId?: string
  ): string {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: AutomationEvent = {
      id,
      workflowId,
      patientId,
      sessionId,
      eventType,
      scheduledFor,
      status: 'pending',
      attempts: 0,
      data
    };

    this.events.push(event);
    this.saveEvents();
    
    return id;
  }

  // Trigger automation based on patient data
  public triggerPatientAutomation(patient: Patient, session?: Session): void {
    if (!this.config.enabled) return;

    this.workflows.filter(w => w.enabled).forEach(workflow => {
      const shouldTrigger = this.evaluateTriggerConditions(
        workflow.config.triggerConditions,
        patient,
        session
      );

      if (shouldTrigger) {
        const scheduledFor = new Date(); // Immediate execution
        this.scheduleEvent(
          workflow.id,
          patient.id,
          workflow.type,
          scheduledFor,
          { patient, session },
          session?.id
        );
      }
    });
  }

  // Process pending events
  private startEventProcessor(): void {
    setInterval(() => {
      this.processEvents();
    }, 60000); // Check every minute
  }

  private async processEvents(): Promise<void> {
    const now = new Date();
    const pendingEvents = this.events.filter(
      event => event.status === 'pending' && event.scheduledFor <= now
    );

    for (const event of pendingEvents) {
      await this.executeEvent(event);
    }
  }

  private async executeEvent(event: AutomationEvent): Promise<void> {
    try {
      event.status = 'executing';
      event.attempts += 1;
      this.saveEvents();

      const workflow = this.workflows.find(w => w.id === event.workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${event.workflowId} not found`);
      }

      // Execute workflow actions
      for (const action of workflow.config.actions) {
        await this.executeAction(action, event);
      }

      event.status = 'completed';
      event.executedAt = new Date();
    } catch (error) {
      console.error(`Error executing event ${event.id}:`, error);
      event.status = 'failed';
      event.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic (max 3 attempts)
      if (event.attempts < 3) {
        event.status = 'pending';
        event.scheduledFor = new Date(Date.now() + 60000 * Math.pow(2, event.attempts)); // Exponential backoff
      }
    } finally {
      this.saveEvents();
    }
  }

  private async executeAction(action: AutomationAction, event: AutomationEvent): Promise<void> {
    const payload = {
      eventId: event.id,
      patientId: event.patientId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      action: action.type,
      data: {
        ...event.data,
        ...action.config.customData
      }
    };

    switch (action.type) {
      case 'send_email':
        await this.sendEmail(payload, action.config);
        break;
      case 'send_sms':
        await this.sendSMS(payload, action.config);
        break;
      case 'notify_doctor':
        await this.notifyDoctor(payload, action.config);
        break;
      case 'create_reminder':
        await this.createReminder(payload, action.config);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async sendEmail(payload: any, config: ActionConfig): Promise<void> {
    const emailPayload = {
      ...payload,
      type: 'email',
      template: config.template,
      subject: config.subject,
      recipients: config.recipients
    };

    await this.sendToN8n(emailPayload);
  }

  private async sendSMS(payload: any, config: ActionConfig): Promise<void> {
    const smsPayload = {
      ...payload,
      type: 'sms',
      template: config.template,
      phone: payload.data.patient?.contact
    };

    await this.sendToN8n(smsPayload);
  }

  private async notifyDoctor(payload: any, config: ActionConfig): Promise<void> {
    const notificationPayload = {
      ...payload,
      type: 'doctor_notification',
      template: config.template,
      subject: config.subject
    };

    await this.sendToN8n(notificationPayload);
  }

  private async createReminder(payload: any, config: ActionConfig): Promise<void> {
    // This would integrate with your reminder system
    console.log('Creating reminder:', payload, config);
  }

  private async sendToN8n(payload: any): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('N8n webhook URL not configured');
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8n webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private evaluateTriggerConditions(
    conditions: TriggerCondition[],
    patient: Patient,
    session?: Session
  ): boolean {
    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, patient, session);
      return this.evaluateCondition(condition, value);
    });
  }

  private getFieldValue(field: string, patient: Patient, session?: Session): any {
    switch (field) {
      case 'lastVisit':
        return patient.lastVisit;
      case 'sessionCreated':
        return session?.createdAt;
      case 'appointmentScheduled':
        // This would come from appointment data
        return null;
      default:
        return null;
    }
  }

  private evaluateCondition(condition: TriggerCondition, value: any): boolean {
    if (value === null || value === undefined) return false;

    const now = new Date();
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'days_ago':
        const daysAgo = Math.floor((now.getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= condition.value;
      case 'days_from_now':
        const daysFromNow = Math.floor((new Date(value).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysFromNow === condition.value;
      default:
        return false;
    }
  }

  // Get events for dashboard
  public getEvents(patientId?: string): AutomationEvent[] {
    let events = [...this.events];
    
    if (patientId) {
      events = events.filter(event => event.patientId === patientId);
    }

    return events.sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());
  }

  // Manual trigger methods
  public sendFollowUpReminder(patient: Patient): void {
    this.scheduleEvent(
      'manual_follow_up',
      patient.id,
      'follow_up',
      new Date(),
      { patient, manual: true }
    );
  }

  public sendAppointmentConfirmation(patient: Patient, appointmentDate: Date): void {
    this.scheduleEvent(
      'manual_appointment',
      patient.id,
      'appointment_confirmation',
      new Date(),
      { patient, appointmentDate, manual: true }
    );
  }
}

// Export singleton instance
export const automationService = new AutomationService();

// Export utilities for South African medical automation
export const SA_MEDICAL_TEMPLATES = {
  follow_up_reminder: {
    email: {
      subject: 'Time for your follow-up appointment',
      body: `Dear {{patient.name}},\n\nIt's time for your follow-up appointment. Please contact us to schedule your next visit.\n\nBest regards,\n{{doctor.name}}\n{{practice.name}}`
    },
    sms: {
      body: 'Hi {{patient.name}}, time for your follow-up with {{doctor.name}}. Call {{practice.phone}} to book. {{practice.name}}'
    }
  },
  appointment_confirmation: {
    sms: {
      body: 'Reminder: Appointment tomorrow at {{appointment.time}} with {{doctor.name}}. Reply CONFIRM or call {{practice.phone}}. {{practice.name}}'
    }
  },
  document_overdue: {
    email: {
      subject: 'Patient documentation overdue: {{patient.name}}',
      body: 'Patient {{patient.name}} has overdue documentation that needs to be completed and filed.'
    }
  }
};