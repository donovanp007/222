export interface Patient {
  id: string;
  name: string;
  age: number;
  contact?: string;
  createdAt: Date;
  lastVisit?: Date;
  sessionCount: number;
}

export interface Session {
  id: string;
  patientId: string;
  title: string;
  content: string;
  audioUrl?: string;
  templateId?: string;
  templateData?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export template types for backward compatibility
export type { Template, TemplateSection, TemplateUsage, SectionType } from './template';