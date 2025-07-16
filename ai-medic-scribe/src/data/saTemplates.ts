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

// HPCSA-Compliant General Consultation Template
const hpcsaConsultationTemplate: Template = {
  id: 'hpcsa-consultation',
  name: 'HPCSA General Consultation',
  description: 'Health Professions Council of South Africa compliant consultation template',
  category: 'consultation',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Presenting Complaint', 1, true, 'Chief complaint and duration. What brings the patient in today?'),
    createSection('history', 'History of Present Illness', 2, true, 'Detailed history of current symptoms, timeline, aggravating/relieving factors...'),
    createSection('history', 'Past Medical History', 3, false, 'Previous illnesses, surgeries, hospitalizations, chronic conditions...'),
    createSection('history', 'Current Medications', 4, false, 'All current medications including chronic medication, dosages, compliance...'),
    createSection('history', 'Allergies', 5, false, 'Drug allergies, food allergies, environmental allergies...'),
    createSection('history', 'Social History', 6, false, 'Smoking, alcohol, recreational drugs, occupation, living conditions...'),
    createSection('history', 'Family History', 7, false, 'Relevant family medical history, genetic conditions...'),
    createSection('vitals', 'Vital Signs', 8, true, 'BP, Pulse, Temperature, Respiratory Rate, O2 Saturation, Weight, Height...'),
    createSection('examination', 'Physical Examination', 9, true, 'Systematic examination findings - general appearance, systems examination...'),
    createSection('diagnosis', 'Clinical Assessment', 10, true, 'Working diagnosis, differential diagnoses, clinical reasoning...'),
    createSection('treatment', 'Management Plan', 11, true, 'Treatment prescribed, medications with dosages, non-pharmacological management...'),
    createSection('plan', 'Follow-up & Monitoring', 12, false, 'Follow-up instructions, when to return, warning signs, monitoring requirements...')
  ]
};

// Discovery Health Medical Aid Template
const discoveryHealthTemplate: Template = {
  id: 'discovery-health',
  name: 'Discovery Health Consultation',
  description: 'Discovery Health medical aid compliant consultation notes with procedure codes',
  category: 'consultation',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Patient Details', 1, true, 'Discovery member number, ID number, scheme details...'),
    createSection('symptoms', 'Chief Complaint', 2, true, 'Primary reason for consultation with ICD-10 codes...'),
    createSection('history', 'Clinical History', 3, true, 'Relevant medical history for billing purposes...'),
    createSection('examination', 'Clinical Examination', 4, true, 'Examination findings supporting clinical decisions...'),
    createSection('diagnosis', 'Diagnosis & ICD-10 Codes', 5, true, 'Primary and secondary diagnoses with ICD-10-AM codes...'),
    createSection('treatment', 'Treatment & Procedure Codes', 6, true, 'Treatments provided with Discovery procedure codes (NHRPL codes)...'),
    createSection('text', 'Billing Information', 7, true, 'Procedure codes, modifier codes, consultation level, PMB conditions...'),
    createSection('plan', 'Treatment Plan', 8, false, 'Ongoing management plan and follow-up requirements...')
  ]
};

// Government Clinic Template (DoH)
const dohClinicTemplate: Template = {
  id: 'doh-clinic',
  name: 'Department of Health Clinic',
  description: 'South African Department of Health public clinic consultation template',
  category: 'consultation',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Patient Registration', 1, true, 'Folder number, ID number, address, next of kin, language preference...'),
    createSection('symptoms', 'Presenting Complaints', 2, true, 'Main complaints, duration, severity (1-10 scale)...'),
    createSection('history', 'HIV Status & TB Screening', 3, true, 'HIV status (if known), TB symptoms screening, previous TB treatment...'),
    createSection('history', 'Pregnancy Status', 4, false, 'For women of childbearing age - pregnancy status, LMP, contraception...'),
    createSection('vitals', 'Vital Signs & Anthropometry', 5, true, 'BP, Pulse, Temp, RR, Weight, Height, BMI, MUAC (if indicated)...'),
    createSection('examination', 'Clinical Assessment', 6, true, 'Focused examination based on presenting complaint...'),
    createSection('diagnosis', 'Diagnosis (ICD-10)', 7, true, 'Primary diagnosis with ICD-10 code, co-morbidities...'),
    createSection('treatment', 'Management', 8, true, 'Medications prescribed (generic names), dosages, duration...'),
    createSection('plan', 'Follow-up & Referral', 9, true, 'Return date, referrals to specialists/higher level care, health education...')
  ]
};

// Occupational Health Template (DoL Compliant)
const occupationalHealthTemplate: Template = {
  id: 'occupational-health',
  name: 'Occupational Health Assessment',
  description: 'Department of Labour compliant occupational health consultation',
  category: 'examination',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Employment Details', 1, true, 'Employer name, job title, nature of work, workplace hazards, years of service...'),
    createSection('history', 'Occupational History', 2, true, 'Previous occupations, exposure history, occupational injuries/illnesses...'),
    createSection('symptoms', 'Work-Related Symptoms', 3, true, 'Symptoms related to work exposure, timing, aggravating factors...'),
    createSection('examination', 'Fitness Assessment', 4, true, 'Physical fitness for specific job requirements, functional capacity...'),
    createSection('examination', 'Respiratory Assessment', 5, false, 'Lung function tests, chest X-ray results, respiratory symptoms...'),
    createSection('examination', 'Audiometric Assessment', 6, false, 'Hearing test results, noise exposure assessment...'),
    createSection('diagnosis', 'Medical Findings', 7, true, 'Medical conditions identified, work-relatedness assessment...'),
    createSection('text', 'Fitness Certificate', 8, true, 'Fit for work/restrictions/limitations, recommendations to employer...')
  ]
};

// Chronic Disease Management (SA Context)
const chronicDiseaseTemplate: Template = {
  id: 'chronic-disease-sa',
  name: 'Chronic Disease Management (SA)',
  description: 'South African chronic disease management focusing on HIV, TB, Diabetes, Hypertension',
  category: 'follow-up',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('history', 'Chronic Condition Status', 1, true, 'HIV status, TB treatment, diabetes control, hypertension management...'),
    createSection('history', 'Medication Adherence', 2, true, 'ARV adherence, TB treatment compliance, chronic medication compliance...'),
    createSection('symptoms', 'Current Symptoms', 3, true, 'New symptoms, side effects, opportunistic infections...'),
    createSection('vitals', 'Monitoring Parameters', 4, true, 'BP, weight, BMI, CD4 count, viral load, blood glucose, HbA1c...'),
    createSection('examination', 'Clinical Assessment', 5, true, 'Focused examination, signs of disease progression...'),
    createSection('diagnosis', 'Disease Status', 6, true, 'Disease control status, complications, co-morbidities...'),
    createSection('treatment', 'Treatment Adjustments', 7, true, 'Medication changes, dosage adjustments, new prescriptions...'),
    createSection('plan', 'Monitoring Plan', 8, true, 'Next visit date, laboratory tests required, referrals needed...')
  ]
};

// Emergency Department Template (SA Context)
const emergencyDeptTemplate: Template = {
  id: 'emergency-sa',
  name: 'Emergency Department (SA)',
  description: 'South African emergency department consultation with triage integration',
  category: 'emergency',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Triage Information', 1, true, 'Triage category (Red/Orange/Yellow/Green/Blue), time of arrival, vital signs...'),
    createSection('symptoms', 'Emergency Complaint', 2, true, 'Chief complaint, onset, severity, associated symptoms...'),
    createSection('history', 'Relevant History', 3, true, 'Pertinent past medical history, current medications, allergies...'),
    createSection('vitals', 'Emergency Vitals', 4, true, 'Full vital signs, GCS, pain score, blood glucose if indicated...'),
    createSection('examination', 'Emergency Examination', 5, true, 'Focused examination based on chief complaint and triage category...'),
    createSection('text', 'Investigations', 6, false, 'Blood tests, X-rays, ECG, other investigations performed...'),
    createSection('diagnosis', 'Emergency Diagnosis', 7, true, 'Working diagnosis, differential diagnoses, severity assessment...'),
    createSection('treatment', 'Emergency Management', 8, true, 'Immediate treatment given, procedures performed, response to treatment...'),
    createSection('plan', 'Disposition', 9, true, 'Discharge home/admit/transfer, follow-up instructions, return precautions...')
  ]
};

export const SA_TEMPLATES: Template[] = [
  hpcsaConsultationTemplate,
  discoveryHealthTemplate,
  dohClinicTemplate,
  occupationalHealthTemplate,
  chronicDiseaseTemplate,
  emergencyDeptTemplate
];

export const getSATemplateById = (id: string): Template | undefined => {
  return SA_TEMPLATES.find(template => template.id === id);
};

export const getSATemplatesByCategory = (category: Template['category']): Template[] => {
  return SA_TEMPLATES.filter(template => template.category === category);
};