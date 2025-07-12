export interface TemplateSection {
  id: string;
  title: string;
  type: 'text' | 'symptoms' | 'diagnosis' | 'treatment' | 'notes' | 'vitals' | 'history' | 'examination' | 'plan';
  placeholder?: string;
  required: boolean;
  order: number;
  content?: string;
  keywords?: string[]; // Keywords that help categorize content into this section
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'consultation' | 'examination' | 'procedure' | 'follow-up' | 'emergency';
  sections: TemplateSection[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateUsage {
  templateId: string;
  patientId: string;
  sessionId: string;
  sectionsData: Record<string, string>; // sectionId -> content
  createdAt: Date;
}

// Predefined section types with their characteristics
export const SECTION_TYPES = {
  symptoms: {
    title: 'Symptoms',
    placeholder: 'Describe the patient\'s presenting symptoms...',
    keywords: ['pain', 'ache', 'hurt', 'feel', 'symptom', 'complaint', 'problem', 'issue', 'discomfort', 'nausea', 'fever', 'headache', 'cough', 'fatigue', 'dizzy'],
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  diagnosis: {
    title: 'Diagnosis',
    placeholder: 'Enter preliminary or confirmed diagnosis...',
    keywords: ['diagnosis', 'diagnosed', 'condition', 'disease', 'disorder', 'syndrome', 'infection', 'inflammation', 'injury'],
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  treatment: {
    title: 'Treatment Plan',
    placeholder: 'Outline the treatment approach and medications...',
    keywords: ['treatment', 'medication', 'prescription', 'therapy', 'procedure', 'surgery', 'recommend', 'advise', 'prescribe', 'dose', 'mg', 'tablets'],
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  vitals: {
    title: 'Vital Signs',
    placeholder: 'Record blood pressure, heart rate, temperature, etc...',
    keywords: ['blood pressure', 'bp', 'heart rate', 'pulse', 'temperature', 'temp', 'respiratory rate', 'oxygen', 'weight', 'height', 'bmi'],
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  history: {
    title: 'Medical History',
    placeholder: 'Document relevant medical history...',
    keywords: ['history', 'previous', 'past', 'family history', 'allergies', 'medications', 'surgery', 'hospitalization', 'chronic'],
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  examination: {
    title: 'Physical Examination',
    placeholder: 'Record examination findings...',
    keywords: ['examination', 'inspect', 'palpation', 'auscultation', 'percussion', 'normal', 'abnormal', 'findings', 'observe'],
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  plan: {
    title: 'Plan',
    placeholder: 'Outline next steps and follow-up plans...',
    keywords: ['plan', 'follow-up', 'return', 'schedule', 'next', 'continue', 'monitor', 'review', 'appointment'],
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  },
  notes: {
    title: 'Additional Notes',
    placeholder: 'Any additional observations or notes...',
    keywords: ['note', 'comment', 'observation', 'additional', 'other', 'miscellaneous'],
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  text: {
    title: 'General Text',
    placeholder: 'Enter general information...',
    keywords: [],
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  }
} as const;

export type SectionType = keyof typeof SECTION_TYPES;