export interface Patient {
  id: string;
  name: string;
  surname: string;
  age: number;
  dateOfBirth?: Date;
  contact?: string;
  medicalAid?: {
    provider: string;
    memberNumber: string;
    dependentCode?: string;
  };
  idNumber?: string;
  createdAt: Date;
  lastVisit?: Date;
  sessionCount: number;
  isArchived?: boolean;
  assignedDoctors?: string[]; // Array of doctor IDs for multi-user collaboration
}

export interface Session {
  id: string;
  patientId: string;
  title: string;
  content: string;
  audioUrl?: string;
  templateId?: string;
  templateData?: Record<string, string>;
  visitDate: Date; // When the actual patient visit occurred
  createdAt: Date; // When the note was created/transcribed
  updatedAt: Date;
  doctorId: string; // Who created this session
  sessionType: 'consultation' | 'follow-up' | 'specialist-report' | 'ultrasound' | 'other';
  diagnosis?: string[];
  isLocked: boolean; // Immutable after creation
  suggestedTasks?: TaskSuggestion[];
  exportHistory?: ExportRecord[];
}

export interface TaskSuggestion {
  id: string;
  type: 'follow-up' | 'lab-test' | 'imaging' | 'referral' | 'medication' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  isCompleted: boolean;
  createdAt: Date;
}

export interface ExportRecord {
  id: string;
  format: 'pdf' | 'docx' | 'txt';
  fileName: string;
  exportedAt: Date;
  exportedBy: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  role: 'primary' | 'specialist' | 'consultant';
}

// Advanced search interfaces
export interface SearchCriteria {
  query: string;
  searchIn: ('name' | 'diagnosis' | 'content' | 'medicalAid')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sessionType?: Session['sessionType'];
  doctorId?: string;
}

export interface SearchResult {
  patient: Patient;
  session?: Session;
  matchType: 'patient' | 'session';
  relevanceScore: number;
}

// Follow-up and reminder interfaces
export interface FollowUpReminder {
  id: string;
  patientId: string;
  sessionId: string;
  reminderDate: Date;
  reminderType: 'follow-up' | 'test-results' | 'medication-review' | 'custom';
  message: string;
  isCompleted: boolean;
  createdAt: Date;
  createdBy: string;
}

// Re-export template types for backward compatibility
export type { Template, TemplateSection, TemplateUsage, SectionType } from './template';