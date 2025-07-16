/**
 * Specialty-Specific Medical Templates for South African Healthcare
 * 9 Core Medical Specialties with comprehensive templates
 */

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

// 1. CARDIOLOGY TEMPLATES
export const cardiologyConsultationTemplate: Template = {
  id: 'cardiology-consultation',
  name: 'Cardiology Consultation',
  description: 'Comprehensive cardiac assessment and management template',
  category: 'specialist',
  specialty: 'Cardiology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Cardiac Symptoms', 1, true, 'Chest pain, shortness of breath, palpitations, syncope, fatigue...', ['chest pain', 'dyspnea', 'palpitations', 'syncope']),
    createSection('history', 'Cardiac Risk Factors', 2, true, 'Hypertension, diabetes, smoking, family history, hyperlipidemia...'),
    createSection('examination', 'Cardiovascular Examination', 3, true, 'Heart sounds, murmurs, peripheral pulses, JVP, peripheral edema...'),
    createSection('vitals', 'Cardiac Vitals', 4, true, 'BP (lying/standing), HR, rhythm, oxygen saturation...'),
    createSection('diagnosis', 'Cardiac Assessment', 5, true, 'ECG findings, echo results, working diagnosis...'),
    createSection('treatment', 'Cardiac Management', 6, true, 'Medications, lifestyle modifications, interventions...'),
    createSection('plan', 'Cardiac Follow-up', 7, true, 'Serial ECGs, echo surveillance, risk stratification...')
  ]
};

export const echocardiogramTemplate: Template = {
  id: 'echocardiogram-report',
  name: 'Echocardiogram Report',
  description: 'Structured echocardiographic examination report',
  category: 'diagnostic',
  specialty: 'Cardiology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Clinical Indication', 1, true, 'Reason for echocardiogram...'),
    createSection('text', 'Technical Quality', 2, true, 'Image quality, acoustic windows, limitations...'),
    createSection('text', 'Left Ventricle', 3, true, 'LV size, wall thickness, systolic function, LVEF...'),
    createSection('text', 'Right Heart', 4, true, 'RV size and function, RA assessment, estimated RVSP...'),
    createSection('text', 'Valvular Assessment', 5, true, 'Mitral, aortic, tricuspid, pulmonary valve function...'),
    createSection('text', 'Other Findings', 6, false, 'Pericardium, aorta, masses, thrombi...'),
    createSection('diagnosis', 'Echo Conclusion', 7, true, 'Summary of key findings and clinical significance...')
  ]
};

// 2. ORTHOPEDIC SURGERY TEMPLATES
export const orthopedicConsultationTemplate: Template = {
  id: 'orthopedic-consultation',
  name: 'Orthopedic Consultation',
  description: 'Musculoskeletal assessment and surgical evaluation',
  category: 'specialist',
  specialty: 'Orthopedic Surgery',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Musculoskeletal Complaint', 1, true, 'Pain location, mechanism of injury, functional limitations...', ['pain', 'injury', 'fracture', 'mobility']),
    createSection('history', 'Injury History', 2, true, 'Mechanism, timing, previous injuries, treatments attempted...'),
    createSection('examination', 'Orthopedic Examination', 3, true, 'Inspection, palpation, range of motion, strength, special tests...'),
    createSection('text', 'Imaging Review', 4, false, 'X-ray, MRI, CT findings and interpretation...'),
    createSection('diagnosis', 'Orthopedic Diagnosis', 5, true, 'Primary diagnosis, fracture classification, stability...'),
    createSection('treatment', 'Treatment Plan', 6, true, 'Conservative vs surgical management, specific interventions...'),
    createSection('plan', 'Rehabilitation Plan', 7, true, 'Physical therapy, weight-bearing status, follow-up schedule...')
  ]
};

export const preOpAssessmentTemplate: Template = {
  id: 'preop-assessment',
  name: 'Pre-operative Assessment',
  description: 'Comprehensive pre-surgical evaluation template',
  category: 'procedure',
  specialty: 'Orthopedic Surgery',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Planned Procedure', 1, true, 'Surgical procedure planned, indications, risks discussed...'),
    createSection('history', 'Anesthetic History', 2, true, 'Previous anesthetics, complications, airway assessment...'),
    createSection('examination', 'Pre-op Examination', 3, true, 'Cardiovascular, respiratory, airway assessment...'),
    createSection('text', 'Risk Stratification', 4, true, 'ASA classification, cardiac risk, bleeding risk...'),
    createSection('text', 'Laboratory Results', 5, false, 'FBC, U&E, coagulation studies, other relevant tests...'),
    createSection('treatment', 'Pre-op Optimization', 6, false, 'Medical optimization, medication adjustments...'),
    createSection('plan', 'Anesthetic Plan', 7, true, 'Type of anesthesia, monitoring, post-op plan...')
  ]
};

// 3. DERMATOLOGY TEMPLATES
export const dermatologyConsultationTemplate: Template = {
  id: 'dermatology-consultation',
  name: 'Dermatology Consultation',
  description: 'Comprehensive dermatological assessment template',
  category: 'specialist',
  specialty: 'Dermatology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Dermatological Complaint', 1, true, 'Skin lesions, rash, itching, changes over time...', ['rash', 'lesion', 'itching', 'pigmentation']),
    createSection('history', 'Dermatological History', 2, true, 'Duration, evolution, triggers, previous treatments...'),
    createSection('examination', 'Skin Examination', 3, true, 'Distribution, morphology, color, size, texture of lesions...'),
    createSection('text', 'Dermoscopy Findings', 4, false, 'Dermoscopic features, patterns, concerning features...'),
    createSection('diagnosis', 'Dermatological Diagnosis', 5, true, 'Primary diagnosis, differential diagnoses, malignancy risk...'),
    createSection('treatment', 'Dermatological Treatment', 6, true, 'Topical treatments, systemic therapy, procedures...'),
    createSection('plan', 'Dermatology Follow-up', 7, true, 'Biopsy results, treatment response, surveillance plan...')
  ]
};

export const skinCancerScreeningTemplate: Template = {
  id: 'skin-cancer-screening',
  name: 'Skin Cancer Screening',
  description: 'Systematic skin cancer detection and monitoring',
  category: 'screening',
  specialty: 'Dermatology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('history', 'Melanoma Risk Factors', 1, true, 'Family history, sun exposure, moles, previous skin cancers...'),
    createSection('examination', 'Full Body Skin Exam', 2, true, 'Systematic examination of all skin surfaces...'),
    createSection('text', 'Suspicious Lesions', 3, false, 'Location, ABCDE criteria, dermoscopy features...'),
    createSection('text', 'Photography/Mapping', 4, false, 'Lesion documentation, mole mapping, serial photography...'),
    createSection('diagnosis', 'Risk Assessment', 5, true, 'Overall melanoma risk, concerning lesions identified...'),
    createSection('treatment', 'Management Plan', 6, true, 'Biopsy recommendations, excision plans, patient education...'),
    createSection('plan', 'Surveillance Schedule', 7, true, 'Follow-up interval, self-examination education, sun protection...')
  ]
};

// 4. PSYCHIATRY TEMPLATES
export const psychiatryConsultationTemplate: Template = {
  id: 'psychiatry-consultation',
  name: 'Psychiatry Consultation',
  description: 'Comprehensive psychiatric assessment and management',
  category: 'specialist',
  specialty: 'Psychiatry',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Presenting Symptoms', 1, true, 'Mood, anxiety, psychosis, cognition, behavior changes...', ['depression', 'anxiety', 'psychosis', 'mood']),
    createSection('history', 'Psychiatric History', 2, true, 'Previous episodes, hospitalizations, treatments, family history...'),
    createSection('examination', 'Mental State Exam', 3, true, 'Appearance, behavior, speech, mood, thought, perception, cognition...'),
    createSection('text', 'Risk Assessment', 4, true, 'Suicide risk, self-harm, violence risk, capacity assessment...'),
    createSection('diagnosis', 'Psychiatric Diagnosis', 5, true, 'Primary diagnosis (DSM-5/ICD-11), differential diagnoses...'),
    createSection('treatment', 'Treatment Plan', 6, true, 'Medication, psychotherapy, social interventions...'),
    createSection('plan', 'Psychiatric Follow-up', 7, true, 'Monitoring plan, therapy referrals, crisis management...')
  ]
};

export const mentalHealthScreeningTemplate: Template = {
  id: 'mental-health-screening',
  name: 'Mental Health Screening',
  description: 'Standardized mental health assessment and screening',
  category: 'screening',
  specialty: 'Psychiatry',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Screening Tools', 1, true, 'PHQ-9, GAD-7, AUDIT, other validated screening instruments...'),
    createSection('symptoms', 'Current Symptoms', 2, true, 'Mood, anxiety, sleep, appetite, energy, concentration...'),
    createSection('history', 'Psychosocial History', 3, true, 'Stressors, support systems, coping mechanisms, trauma history...'),
    createSection('examination', 'Brief Mental State', 4, true, 'Appearance, mood, thought process, risk factors...'),
    createSection('diagnosis', 'Screening Results', 5, true, 'Positive screens, severity assessment, need for referral...'),
    createSection('treatment', 'Immediate Interventions', 6, false, 'Crisis intervention, safety planning, brief counseling...'),
    createSection('plan', 'Referral and Follow-up', 7, true, 'Specialist referral, community resources, follow-up plan...')
  ]
};

// 5. PEDIATRICS TEMPLATES
export const pediatricConsultationTemplate: Template = {
  id: 'pediatric-consultation',
  name: 'Pediatric Consultation',
  description: 'Comprehensive pediatric assessment template',
  category: 'specialist',
  specialty: 'Pediatrics',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Chief Complaint', 1, true, 'Parental concerns, symptoms, behavioral changes...', ['fever', 'feeding', 'development', 'behavior']),
    createSection('history', 'Birth and Development', 2, true, 'Birth history, milestones, immunizations, growth charts...'),
    createSection('examination', 'Pediatric Examination', 3, true, 'Age-appropriate examination, growth parameters, development...'),
    createSection('vitals', 'Pediatric Vitals', 4, true, 'Age-appropriate vital signs, percentiles, head circumference...'),
    createSection('diagnosis', 'Pediatric Assessment', 5, true, 'Diagnosis, developmental concerns, growth issues...'),
    createSection('treatment', 'Pediatric Treatment', 6, true, 'Age-appropriate medications, dosing, interventions...'),
    createSection('plan', 'Pediatric Follow-up', 7, true, 'Immunization schedule, development monitoring, parent education...')
  ]
};

export const wellChildVisitTemplate: Template = {
  id: 'well-child-visit',
  name: 'Well Child Visit',
  description: 'Routine pediatric health maintenance visit',
  category: 'preventive',
  specialty: 'Pediatrics',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Interval History', 1, true, 'Health since last visit, parental concerns, feeding, sleep...'),
    createSection('examination', 'Physical Examination', 2, true, 'Complete age-appropriate physical examination...'),
    createSection('text', 'Growth Assessment', 3, true, 'Height, weight, head circumference plotted on growth charts...'),
    createSection('text', 'Development Assessment', 4, true, 'Age-appropriate milestones, developmental screening tools...'),
    createSection('text', 'Immunizations', 5, true, 'Vaccines given, schedule discussed, adverse reactions...'),
    createSection('text', 'Anticipatory Guidance', 6, true, 'Safety, nutrition, development, behavior, screen time...'),
    createSection('plan', 'Next Visit', 7, true, 'Follow-up schedule, concerns to monitor, referrals if needed...')
  ]
};

// 6. GASTROENTEROLOGY TEMPLATES
export const gastroenterologyConsultationTemplate: Template = {
  id: 'gastroenterology-consultation',
  name: 'Gastroenterology Consultation',
  description: 'Comprehensive GI assessment and management',
  category: 'specialist',
  specialty: 'Gastroenterology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'GI Symptoms', 1, true, 'Abdominal pain, nausea, vomiting, diarrhea, constipation, bleeding...', ['abdominal pain', 'diarrhea', 'constipation', 'bleeding']),
    createSection('history', 'GI History', 2, true, 'Symptom timeline, dietary factors, medications, family history...'),
    createSection('examination', 'Abdominal Examination', 3, true, 'Inspection, auscultation, palpation, percussion, rectal exam...'),
    createSection('text', 'Endoscopy Findings', 4, false, 'Upper endoscopy, colonoscopy, biopsy results...'),
    createSection('diagnosis', 'GI Diagnosis', 5, true, 'Primary diagnosis, functional vs organic, severity assessment...'),
    createSection('treatment', 'GI Treatment', 6, true, 'Dietary modifications, medications, procedures...'),
    createSection('plan', 'GI Follow-up', 7, true, 'Monitoring plan, surveillance endoscopy, lifestyle modifications...')
  ]
};

export const endoscopyReportTemplate: Template = {
  id: 'endoscopy-report',
  name: 'Endoscopy Report',
  description: 'Detailed endoscopic procedure documentation',
  category: 'procedure',
  specialty: 'Gastroenterology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Procedure Details', 1, true, 'Type of endoscopy, indication, medications used...'),
    createSection('text', 'Technical Aspects', 2, true, 'Scope used, sedation, patient tolerance, complications...'),
    createSection('text', 'Endoscopic Findings', 3, true, 'Systematic description of findings from insertion to withdrawal...'),
    createSection('text', 'Interventions', 4, false, 'Biopsies, polypectomy, hemostasis, therapeutic procedures...'),
    createSection('text', 'Pathology Correlation', 5, false, 'Histology results, correlation with endoscopic findings...'),
    createSection('diagnosis', 'Endoscopic Diagnosis', 6, true, 'Final diagnosis based on endoscopic and histologic findings...'),
    createSection('plan', 'Post-procedure Plan', 7, true, 'Follow-up endoscopy, surveillance, treatment recommendations...')
  ]
};

// 7. GYNECOLOGY TEMPLATES
export const gynecologyConsultationTemplate: Template = {
  id: 'gynecology-consultation',
  name: 'Gynecology Consultation',
  description: 'Comprehensive gynecological assessment',
  category: 'specialist',
  specialty: 'Gynecology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Gynecological Symptoms', 1, true, 'Menstrual history, pelvic pain, discharge, bleeding patterns...', ['menstrual', 'pelvic pain', 'discharge', 'bleeding']),
    createSection('history', 'Obstetric History', 2, true, 'Gravida, para, pregnancies, deliveries, complications...'),
    createSection('examination', 'Pelvic Examination', 3, true, 'External genitalia, speculum exam, bimanual exam, cervix assessment...'),
    createSection('text', 'Imaging Results', 4, false, 'Pelvic ultrasound, MRI findings, other imaging studies...'),
    createSection('diagnosis', 'Gynecological Diagnosis', 5, true, 'Primary diagnosis, staging if malignancy, fertility assessment...'),
    createSection('treatment', 'Gynecological Treatment', 6, true, 'Medical management, surgical options, hormonal therapy...'),
    createSection('plan', 'Gynecology Follow-up', 7, true, 'Surveillance plan, fertility counseling, contraception discussion...')
  ]
};

export const cervicalScreeningTemplate: Template = {
  id: 'cervical-screening',
  name: 'Cervical Cancer Screening',
  description: 'Pap smear and HPV testing documentation',
  category: 'screening',
  specialty: 'Gynecology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('history', 'Screening History', 1, true, 'Previous Pap smears, HPV history, risk factors...'),
    createSection('examination', 'Cervical Assessment', 2, true, 'Cervical appearance, adequacy of specimen, colposcopy findings...'),
    createSection('text', 'Cytology Results', 3, true, 'Pap smear results, HPV testing, adequacy of specimen...'),
    createSection('text', 'Risk Stratification', 4, true, 'Risk category based on results, guidelines followed...'),
    createSection('diagnosis', 'Screening Interpretation', 5, true, 'Clinical significance of results, need for further testing...'),
    createSection('treatment', 'Management Plan', 6, false, 'Colposcopy referral, treatment of abnormalities...'),
    createSection('plan', 'Screening Schedule', 7, true, 'Next screening interval, patient education, follow-up plan...')
  ]
};

// 8. OPHTHALMOLOGY TEMPLATES
export const ophthalmologyConsultationTemplate: Template = {
  id: 'ophthalmology-consultation',
  name: 'Ophthalmology Consultation',
  description: 'Comprehensive eye examination and assessment',
  category: 'specialist',
  specialty: 'Ophthalmology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Visual Symptoms', 1, true, 'Visual acuity changes, pain, redness, flashing lights, field defects...', ['vision loss', 'pain', 'redness', 'flashes']),
    createSection('history', 'Ophthalmic History', 2, true, 'Previous eye problems, surgeries, medications, family history...'),
    createSection('examination', 'Eye Examination', 3, true, 'Visual acuity, pupils, external exam, slit lamp, fundoscopy...'),
    createSection('text', 'Special Tests', 4, false, 'Visual fields, OCT, fluorescein angiography, tonometry...'),
    createSection('diagnosis', 'Ophthalmic Diagnosis', 5, true, 'Primary diagnosis, severity, visual prognosis...'),
    createSection('treatment', 'Eye Treatment', 6, true, 'Medications, laser treatment, surgical options...'),
    createSection('plan', 'Ophthalmology Follow-up', 7, true, 'Monitoring plan, visual rehabilitation, emergency signs...')
  ]
};

export const diabeticRetinopathyTemplate: Template = {
  id: 'diabetic-retinopathy',
  name: 'Diabetic Retinopathy Screening',
  description: 'Systematic diabetic eye disease assessment',
  category: 'screening',
  specialty: 'Ophthalmology',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('history', 'Diabetes History', 1, true, 'Duration of diabetes, HbA1c control, previous eye exams...'),
    createSection('examination', 'Retinal Examination', 2, true, 'Fundoscopy findings, microaneurysms, hemorrhages, exudates...'),
    createSection('text', 'Retinopathy Grading', 3, true, 'ETDRS classification, severity level, macular involvement...'),
    createSection('text', 'Macular Assessment', 4, true, 'Macular edema, thickness, OCT findings...'),
    createSection('diagnosis', 'DR Classification', 5, true, 'Stage of diabetic retinopathy, risk of progression...'),
    createSection('treatment', 'DR Management', 6, false, 'Laser treatment, anti-VEGF injections, vitrectomy...'),
    createSection('plan', 'DR Surveillance', 7, true, 'Follow-up interval, patient education, glycemic control...')
  ]
};

// 9. EMERGENCY MEDICINE TEMPLATES
export const emergencyTraumaTemplate: Template = {
  id: 'emergency-trauma',
  name: 'Emergency Trauma Assessment',
  description: 'Systematic trauma evaluation and management',
  category: 'emergency',
  specialty: 'Emergency Medicine',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('text', 'Mechanism of Injury', 1, true, 'Details of trauma, forces involved, time of injury...'),
    createSection('vitals', 'Trauma Vitals', 2, true, 'GCS, vitals, hemodynamic status, oxygen saturation...'),
    createSection('examination', 'Primary Survey', 3, true, 'ABCDE assessment, immediate life threats...'),
    createSection('examination', 'Secondary Survey', 4, true, 'Head-to-toe examination, neurological assessment...'),
    createSection('text', 'Imaging Studies', 5, false, 'CT scans, X-rays, FAST exam, findings...'),
    createSection('diagnosis', 'Trauma Diagnoses', 6, true, 'Injuries identified, severity, ISS score...'),
    createSection('treatment', 'Trauma Management', 7, true, 'Resuscitation, procedures, medications, disposition...')
  ]
};

export const emergencyChestPainTemplate: Template = {
  id: 'emergency-chest-pain',
  name: 'Emergency Chest Pain Evaluation',
  description: 'Acute chest pain assessment and risk stratification',
  category: 'emergency',
  specialty: 'Emergency Medicine',
  isDefault: false,
  usage: { totalUses: 0, lastUsed: null, averageCompletionTime: 0, userRating: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    createSection('symptoms', 'Chest Pain Characteristics', 1, true, 'Location, quality, radiation, timing, severity, triggers...', ['chest pain', 'cardiac', 'ischemia']),
    createSection('history', 'Cardiac Risk Factors', 2, true, 'Age, gender, smoking, diabetes, hypertension, family history...'),
    createSection('examination', 'Cardiac Examination', 3, true, 'Heart sounds, murmurs, peripheral pulses, signs of heart failure...'),
    createSection('text', 'ECG Findings', 4, true, 'Rhythm, ST changes, Q waves, comparison with previous ECGs...'),
    createSection('text', 'Laboratory Results', 5, true, 'Troponin, BNP, D-dimer, CBC, basic metabolic panel...'),
    createSection('diagnosis', 'Risk Stratification', 6, true, 'HEART score, TIMI risk, differential diagnoses...'),
    createSection('treatment', 'Emergency Management', 7, true, 'Medications, monitoring, disposition, cardiology consultation...')
  ]
};

// Export all specialty templates grouped by specialty
export const SPECIALTY_TEMPLATES = {
  cardiology: [cardiologyConsultationTemplate, echocardiogramTemplate],
  orthopedics: [orthopedicConsultationTemplate, preOpAssessmentTemplate],
  dermatology: [dermatologyConsultationTemplate, skinCancerScreeningTemplate],
  psychiatry: [psychiatryConsultationTemplate, mentalHealthScreeningTemplate],
  pediatrics: [pediatricConsultationTemplate, wellChildVisitTemplate],
  gastroenterology: [gastroenterologyConsultationTemplate, endoscopyReportTemplate],
  gynecology: [gynecologyConsultationTemplate, cervicalScreeningTemplate],
  ophthalmology: [ophthalmologyConsultationTemplate, diabeticRetinopathyTemplate],
  emergency: [emergencyTraumaTemplate, emergencyChestPainTemplate]
};

// Flatten all specialty templates into a single array
export const ALL_SPECIALTY_TEMPLATES: Template[] = Object.values(SPECIALTY_TEMPLATES).flat();

// Specialty information for UI
export const SPECIALTY_INFO = {
  cardiology: {
    name: 'Cardiology',
    description: 'Heart and cardiovascular system disorders',
    icon: '🫀',
    color: 'red'
  },
  orthopedics: {
    name: 'Orthopedic Surgery',
    description: 'Musculoskeletal injuries and disorders',
    icon: '🦴',
    color: 'blue'
  },
  dermatology: {
    name: 'Dermatology',
    description: 'Skin, hair, and nail conditions',
    icon: '🧴',
    color: 'pink'
  },
  psychiatry: {
    name: 'Psychiatry',
    description: 'Mental health and behavioral disorders',
    icon: '🧠',
    color: 'purple'
  },
  pediatrics: {
    name: 'Pediatrics',
    description: 'Medical care of infants, children, and adolescents',
    icon: '👶',
    color: 'green'
  },
  gastroenterology: {
    name: 'Gastroenterology',
    description: 'Digestive system disorders',
    icon: '🍽️',
    color: 'orange'
  },
  gynecology: {
    name: 'Gynecology',
    description: 'Female reproductive health',
    icon: '🌸',
    color: 'cyan'
  },
  ophthalmology: {
    name: 'Ophthalmology',
    description: 'Eye and vision disorders',
    icon: '👁️',
    color: 'indigo'
  },
  emergency: {
    name: 'Emergency Medicine',
    description: 'Acute care and trauma management',
    icon: '🚨',
    color: 'red'
  }
};

// Template search and filtering utilities
export const getTemplatesBySpecialty = (specialty: string): Template[] => {
  return SPECIALTY_TEMPLATES[specialty as keyof typeof SPECIALTY_TEMPLATES] || [];
};

export const searchSpecialtyTemplates = (query: string): Template[] => {
  const lowercaseQuery = query.toLowerCase();
  return ALL_SPECIALTY_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.specialty?.toLowerCase().includes(lowercaseQuery) ||
    template.sections.some(section => 
      section.title.toLowerCase().includes(lowercaseQuery) ||
      section.keywords?.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    )
  );
};

export const getTemplateBySpecialtyAndType = (specialty: string, type: string): Template | undefined => {
  const specialtyTemplates = getTemplatesBySpecialty(specialty);
  return specialtyTemplates.find(template => 
    template.category === type || template.name.toLowerCase().includes(type.toLowerCase())
  );
};