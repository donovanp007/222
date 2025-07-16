import { Template, TemplateSection } from "@/types/template";

// Helper function to create template sections
const createSection = (
  type: string,
  title: string,
  order: number,
  required: boolean = false,
  placeholder?: string,
  keywords?: string[]
): TemplateSection => ({
  id: `${type}_${order}`,
  title,
  type: type as TemplateSection['type'],
  placeholder: placeholder || `Enter ${title.toLowerCase()}...`,
  required,
  order,
  keywords
});

// General Consultation Template
const generalConsultationTemplate: Template = {
  id: 'general-consultation',
  name: 'General Consultation',
  description: 'Standard template for routine medical consultations',
  category: 'consultation',
  specialty: 'General Practice',
  isDefault: true,
  usage: {
    totalUses: 0,
    lastUsed: null,
    averageCompletionTime: 0,
    userRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Chief Complaint & Symptoms', 1, true, 'What brings the patient in today? Describe presenting symptoms...'),
    createSection('history', 'Medical History', 2, false, 'Relevant medical history, allergies, current medications...'),
    createSection('vitals', 'Vital Signs', 3, false, 'Blood pressure, heart rate, temperature, weight, etc...'),
    createSection('examination', 'Physical Examination', 4, false, 'Examination findings and observations...'),
    createSection('diagnosis', 'Assessment & Diagnosis', 5, true, 'Clinical assessment and working diagnosis...'),
    createSection('treatment', 'Treatment Plan', 6, true, 'Prescribed medications, procedures, and treatment approach...'),
    createSection('plan', 'Follow-up Plan', 7, false, 'Next steps, follow-up appointments, monitoring instructions...')
  ]
};

// Physical Examination Template
const physicalExamTemplate: Template = {
  id: 'physical-exam',
  name: 'Comprehensive Physical Examination',
  description: 'Detailed template for thorough physical examinations',
  category: 'examination',
  specialty: 'General Practice',
  isDefault: true,
  usage: {
    totalUses: 0,
    lastUsed: null,
    averageCompletionTime: 0,
    userRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('vitals', 'Vital Signs', 1, true, 'BP, HR, RR, Temp, O2 Sat, Weight, Height...'),
    createSection('examination', 'General Appearance', 2, true, 'Overall appearance, demeanor, distress level...'),
    createSection('examination', 'Head & Neck', 3, false, 'HEENT examination findings...'),
    createSection('examination', 'Cardiovascular', 4, false, 'Heart sounds, rhythm, murmurs, peripheral pulses...'),
    createSection('examination', 'Respiratory', 5, false, 'Lung sounds, breathing pattern, chest movement...'),
    createSection('examination', 'Abdominal', 6, false, 'Inspection, palpation, bowel sounds, tenderness...'),
    createSection('examination', 'Neurological', 7, false, 'Mental status, reflexes, sensation, motor function...'),
    createSection('examination', 'Musculoskeletal', 8, false, 'Range of motion, strength, deformities...'),
    createSection('notes', 'Additional Findings', 9, false, 'Any other relevant examination findings...')
  ]
};

// Follow-up Visit Template
const followUpTemplate: Template = {
  id: 'follow-up',
  name: 'Follow-up Visit',
  description: 'Template for follow-up appointments and progress reviews',
  category: 'follow-up',
  specialty: 'General Practice',
  isDefault: true,
  usage: {
    totalUses: 0,
    lastUsed: null,
    averageCompletionTime: 0,
    userRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Current Status', 1, true, 'How is the patient feeling since last visit? Any changes in symptoms?'),
    createSection('treatment', 'Treatment Compliance', 2, true, 'Medication adherence, side effects, treatment response...'),
    createSection('vitals', 'Current Vital Signs', 3, false, 'Updated vital signs and measurements...'),
    createSection('examination', 'Focused Examination', 4, false, 'Targeted examination based on condition...'),
    createSection('diagnosis', 'Progress Assessment', 5, true, 'Clinical progress, improvement, or concerns...'),
    createSection('treatment', 'Treatment Adjustments', 6, false, 'Any changes to medications or treatment plan...'),
    createSection('plan', 'Next Steps', 7, true, 'Follow-up schedule, monitoring, patient education...')
  ]
};

// Emergency Consultation Template
const emergencyTemplate: Template = {
  id: 'emergency',
  name: 'Emergency Consultation',
  description: 'Quick template for urgent medical situations',
  category: 'emergency',
  specialty: 'Emergency Medicine',
  isDefault: true,
  usage: {
    totalUses: 0,
    lastUsed: null,
    averageCompletionTime: 0,
    userRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Presenting Complaint', 1, true, 'Primary emergency complaint and timeline...'),
    createSection('vitals', 'Emergency Vitals', 2, true, 'Critical vital signs and triage assessment...'),
    createSection('history', 'Relevant History', 3, true, 'Pertinent medical history and medications...'),
    createSection('examination', 'Focused Assessment', 4, true, 'Targeted examination findings...'),
    createSection('diagnosis', 'Emergency Diagnosis', 5, true, 'Working diagnosis and differential...'),
    createSection('treatment', 'Immediate Treatment', 6, true, 'Emergency interventions and medications...'),
    createSection('plan', 'Disposition', 7, true, 'Discharge, admission, or transfer plans...')
  ]
};

// Procedure Note Template
const procedureTemplate: Template = {
  id: 'procedure',
  name: 'Procedure Note',
  description: 'Documentation template for medical procedures',
  category: 'procedure',
  specialty: 'General Practice',
  isDefault: true,
  usage: {
    totalUses: 0,
    lastUsed: null,
    averageCompletionTime: 0,
    userRating: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Procedure Details', 1, true, 'Name of procedure, indication, and consent...'),
    createSection('text', 'Pre-procedure Assessment', 2, true, 'Patient preparation and pre-procedure vitals...'),
    createSection('text', 'Procedure Steps', 3, true, 'Detailed description of procedure performed...'),
    createSection('text', 'Findings', 4, false, 'Procedure findings and observations...'),
    createSection('text', 'Complications', 5, false, 'Any complications or adverse events...'),
    createSection('treatment', 'Post-procedure Care', 6, true, 'Post-procedure instructions and medications...'),
    createSection('plan', 'Follow-up Instructions', 7, true, 'When to return, warning signs, activity restrictions...')
  ]
};

// Basic Consultation Template (simplified)
const basicTemplate: Template = {
  id: 'basic',
  name: 'Basic Consultation',
  description: 'Simple template for quick consultations',
  category: 'general',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Symptoms', 1, true, 'What symptoms is the patient experiencing?'),
    createSection('examination', 'Examination', 2, false, 'Key examination findings...'),
    createSection('diagnosis', 'Diagnosis', 3, true, 'Clinical diagnosis or assessment...'),
    createSection('treatment', 'Treatment', 4, true, 'Prescribed treatment and medications...'),
    createSection('notes', 'Notes', 5, false, 'Any additional notes or observations...')
  ]
};

export const DEFAULT_TEMPLATES: Template[] = [
  basicTemplate,
  generalConsultationTemplate,
  physicalExamTemplate,
  followUpTemplate,
  emergencyTemplate,
  procedureTemplate
];

export const getTemplateById = (id: string): Template | undefined => {
  return DEFAULT_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: Template['category']): Template[] => {
  return DEFAULT_TEMPLATES.filter(template => template.category === category);
};