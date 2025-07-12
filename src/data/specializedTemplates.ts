import { Template } from "@/types/template";

// Ultrasound Report Template
export const ultrasoundTemplate: Template = {
  id: "ultrasound_cardiac",
  name: "Cardiac Ultrasound Report",
  description: "Comprehensive cardiac ultrasound examination template",
  category: "specialist",
  sections: [
    {
      id: "patient_info",
      title: "Patient Information",
      type: "form",
      required: true,
      fields: [
        {
          id: "indication",
          label: "Clinical Indication",
          type: "textarea",
          placeholder: "Reason for examination...",
          required: true
        },
        {
          id: "referring_physician",
          label: "Referring Physician",
          type: "text",
          placeholder: "Dr. Name",
          required: true
        }
      ]
    },
    {
      id: "examination_details",
      title: "Examination Details",
      type: "form",
      required: true,
      fields: [
        {
          id: "exam_date",
          label: "Examination Date",
          type: "date",
          required: true
        },
        {
          id: "exam_time",
          label: "Examination Time",
          type: "time",
          required: true
        },
        {
          id: "equipment",
          label: "Equipment Used",
          type: "text",
          placeholder: "Ultrasound machine model",
          required: false
        }
      ]
    },
    {
      id: "measurements",
      title: "Cardiac Measurements",
      type: "form",
      required: true,
      fields: [
        {
          id: "lvedd",
          label: "LVEDD (mm)",
          type: "number",
          placeholder: "Left ventricular end-diastolic dimension",
          required: true,
          validation: { min: 20, max: 80 }
        },
        {
          id: "lvesd",
          label: "LVESD (mm)",
          type: "number",
          placeholder: "Left ventricular end-systolic dimension",
          required: true,
          validation: { min: 15, max: 60 }
        },
        {
          id: "ivs",
          label: "IVS (mm)",
          type: "number",
          placeholder: "Interventricular septum thickness",
          required: true,
          validation: { min: 6, max: 20 }
        },
        {
          id: "pw",
          label: "PW (mm)",
          type: "number",
          placeholder: "Posterior wall thickness",
          required: true,
          validation: { min: 6, max: 18 }
        },
        {
          id: "la",
          label: "LA (mm)",
          type: "number",
          placeholder: "Left atrial dimension",
          required: true,
          validation: { min: 20, max: 50 }
        },
        {
          id: "ao",
          label: "AO (mm)",
          type: "number",
          placeholder: "Aortic root dimension",
          required: true,
          validation: { min: 20, max: 45 }
        },
        {
          id: "ejection_fraction",
          label: "Ejection Fraction (%)",
          type: "number",
          placeholder: "Left ventricular ejection fraction",
          required: true,
          validation: { min: 20, max: 80 }
        }
      ]
    },
    {
      id: "doppler_studies",
      title: "Doppler Studies",
      type: "form",
      required: false,
      fields: [
        {
          id: "mitral_valve",
          label: "Mitral Valve",
          type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "mild_regurgitation", label: "Mild Regurgitation" },
            { value: "moderate_regurgitation", label: "Moderate Regurgitation" },
            { value: "severe_regurgitation", label: "Severe Regurgitation" },
            { value: "stenosis", label: "Stenosis" }
          ],
          required: false
        },
        {
          id: "aortic_valve",
          label: "Aortic Valve",
          type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "mild_regurgitation", label: "Mild Regurgitation" },
            { value: "moderate_regurgitation", label: "Moderate Regurgitation" },
            { value: "severe_regurgitation", label: "Severe Regurgitation" },
            { value: "stenosis", label: "Stenosis" }
          ],
          required: false
        },
        {
          id: "tricuspid_valve",
          label: "Tricuspid Valve",
          type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "mild_regurgitation", label: "Mild Regurgitation" },
            { value: "moderate_regurgitation", label: "Moderate Regurgitation" },
            { value: "severe_regurgitation", label: "Severe Regurgitation" }
          ],
          required: false
        },
        {
          id: "pulmonary_valve",
          label: "Pulmonary Valve",
          type: "select",
          options: [
            { value: "normal", label: "Normal" },
            { value: "regurgitation", label: "Regurgitation" },
            { value: "stenosis", label: "Stenosis" }
          ],
          required: false
        }
      ]
    },
    {
      id: "findings",
      title: "Findings & Assessment",
      type: "rich_text",
      required: true,
      content: `
**FINDINGS:**

**Left Ventricle:**
- Size: {{measurements.lvedd}} mm (LVEDD), {{measurements.lvesd}} mm (LVESD)
- Wall Thickness: IVS {{measurements.ivs}} mm, PW {{measurements.pw}} mm
- Systolic Function: EF {{measurements.ejection_fraction}}%
- Regional Wall Motion: 

**Right Ventricle:**
- Size: 
- Function: 

**Atria:**
- Left Atrium: {{measurements.la}} mm
- Right Atrium: 

**Valves:**
- Mitral: {{doppler_studies.mitral_valve}}
- Aortic: {{doppler_studies.aortic_valve}}
- Tricuspid: {{doppler_studies.tricuspid_valve}}
- Pulmonary: {{doppler_studies.pulmonary_valve}}

**Pericardium:**
- 

**ASSESSMENT:**

**RECOMMENDATIONS:**
- 
      `
    },
    {
      id: "conclusion",
      title: "Conclusion",
      type: "textarea",
      required: true,
      placeholder: "Summary of key findings and clinical significance..."
    }
  ]
};

// General Clinical Consultation Template
export const clinicalConsultationTemplate: Template = {
  id: "clinical_consultation_sa",
  name: "South African Clinical Consultation",
  description: "Standard clinical consultation template for South African practice",
  category: "general",
  sections: [
    {
      id: "chief_complaint",
      title: "Chief Complaint",
      type: "textarea",
      required: true,
      placeholder: "Patient's main concern or reason for visit..."
    },
    {
      id: "history_present_illness",
      title: "History of Present Illness",
      type: "rich_text",
      required: true,
      content: `
**Onset:** 
**Duration:** 
**Character:** 
**Associated Symptoms:** 
**Aggravating Factors:** 
**Relieving Factors:** 
**Severity (1-10):** 
**Previous Episodes:** 
      `
    },
    {
      id: "past_medical_history",
      title: "Past Medical History",
      type: "form",
      required: true,
      fields: [
        {
          id: "chronic_conditions",
          label: "Chronic Conditions",
          type: "multiselect",
          options: [
            { value: "hypertension", label: "Hypertension" },
            { value: "diabetes", label: "Diabetes Mellitus" },
            { value: "hiv", label: "HIV/AIDS" },
            { value: "tb", label: "Tuberculosis" },
            { value: "asthma", label: "Asthma" },
            { value: "copd", label: "COPD" },
            { value: "ihd", label: "Ischaemic Heart Disease" },
            { value: "stroke", label: "Stroke/CVA" },
            { value: "kidney_disease", label: "Chronic Kidney Disease" },
            { value: "liver_disease", label: "Liver Disease" }
          ],
          required: false
        },
        {
          id: "previous_surgeries",
          label: "Previous Surgeries",
          type: "textarea",
          placeholder: "List previous surgical procedures with dates...",
          required: false
        },
        {
          id: "allergies",
          label: "Known Allergies",
          type: "textarea",
          placeholder: "Drug allergies, food allergies, environmental allergies...",
          required: false
        }
      ]
    },
    {
      id: "current_medications",
      title: "Current Medications",
      type: "textarea",
      required: false,
      placeholder: "List current medications with dosages and frequencies..."
    },
    {
      id: "social_history",
      title: "Social History",
      type: "form",
      required: false,
      fields: [
        {
          id: "smoking",
          label: "Smoking History",
          type: "select",
          options: [
            { value: "never", label: "Never Smoked" },
            { value: "current", label: "Current Smoker" },
            { value: "former", label: "Former Smoker" }
          ],
          required: false
        },
        {
          id: "alcohol",
          label: "Alcohol Use",
          type: "select",
          options: [
            { value: "none", label: "No Alcohol" },
            { value: "social", label: "Social Drinker" },
            { value: "moderate", label: "Moderate Use" },
            { value: "heavy", label: "Heavy Use" }
          ],
          required: false
        },
        {
          id: "occupation",
          label: "Occupation",
          type: "text",
          placeholder: "Patient's occupation",
          required: false
        }
      ]
    },
    {
      id: "physical_examination",
      title: "Physical Examination",
      type: "form",
      required: true,
      fields: [
        {
          id: "vital_signs",
          label: "Vital Signs",
          type: "group",
          fields: [
            {
              id: "bp_systolic",
              label: "BP Systolic (mmHg)",
              type: "number",
              validation: { min: 70, max: 250 }
            },
            {
              id: "bp_diastolic",
              label: "BP Diastolic (mmHg)",
              type: "number",
              validation: { min: 40, max: 150 }
            },
            {
              id: "heart_rate",
              label: "Heart Rate (bpm)",
              type: "number",
              validation: { min: 40, max: 180 }
            },
            {
              id: "temperature",
              label: "Temperature (°C)",
              type: "number",
              validation: { min: 35, max: 42 }
            },
            {
              id: "respiratory_rate",
              label: "Respiratory Rate",
              type: "number",
              validation: { min: 10, max: 40 }
            },
            {
              id: "oxygen_saturation",
              label: "O2 Saturation (%)",
              type: "number",
              validation: { min: 70, max: 100 }
            }
          ]
        },
        {
          id: "general_appearance",
          label: "General Appearance",
          type: "textarea",
          placeholder: "Overall appearance, distress level, mobility...",
          required: false
        },
        {
          id: "cardiovascular",
          label: "Cardiovascular System",
          type: "textarea",
          placeholder: "Heart sounds, murmurs, peripheral pulses...",
          required: false
        },
        {
          id: "respiratory",
          label: "Respiratory System", 
          type: "textarea",
          placeholder: "Chest inspection, percussion, auscultation...",
          required: false
        },
        {
          id: "abdominal",
          label: "Abdominal Examination",
          type: "textarea",
          placeholder: "Inspection, palpation, percussion, auscultation...",
          required: false
        },
        {
          id: "neurological",
          label: "Neurological Examination",
          type: "textarea",
          placeholder: "Mental state, cranial nerves, motor, sensory...",
          required: false
        }
      ]
    },
    {
      id: "assessment_plan",
      title: "Assessment & Plan",
      type: "rich_text",
      required: true,
      content: `
**ASSESSMENT:**

**Differential Diagnosis:**
1. 
2. 
3. 

**PLAN:**

**Investigations:**
- 

**Treatment:**
- 

**Follow-up:**
- 

**Patient Education:**
- 
      `
    }
  ]
};

// Laboratory Results Template
export const labResultsTemplate: Template = {
  id: "lab_results_sa",
  name: "Laboratory Results Review",
  description: "Template for reviewing and documenting laboratory results",
  category: "specialist",
  sections: [
    {
      id: "lab_info",
      title: "Laboratory Information",
      type: "form",
      required: true,
      fields: [
        {
          id: "lab_name",
          label: "Laboratory",
          type: "select",
          options: [
            { value: "pathcare", label: "PathCare" },
            { value: "lancet", label: "Lancet Laboratories" },
            { value: "ampath", label: "Ampath" },
            { value: "nhls", label: "NHLS" },
            { value: "other", label: "Other" }
          ],
          required: true
        },
        {
          id: "specimen_date",
          label: "Specimen Collection Date",
          type: "date",
          required: true
        },
        {
          id: "report_date",
          label: "Report Date",
          type: "date",
          required: true
        }
      ]
    },
    {
      id: "full_blood_count",
      title: "Full Blood Count",
      type: "form",
      required: false,
      fields: [
        {
          id: "hemoglobin",
          label: "Hemoglobin (g/dL)",
          type: "number",
          validation: { min: 5, max: 20 }
        },
        {
          id: "hematocrit",
          label: "Hematocrit (%)",
          type: "number",
          validation: { min: 15, max: 60 }
        },
        {
          id: "wbc",
          label: "White Blood Cells (×10⁹/L)",
          type: "number",
          validation: { min: 1, max: 50 }
        },
        {
          id: "platelets",
          label: "Platelets (×10⁹/L)",
          type: "number",
          validation: { min: 50, max: 1000 }
        }
      ]
    },
    {
      id: "chemistry",
      title: "Chemistry Panel",
      type: "form",
      required: false,
      fields: [
        {
          id: "glucose",
          label: "Glucose (mmol/L)",
          type: "number",
          validation: { min: 2, max: 30 }
        },
        {
          id: "creatinine",
          label: "Creatinine (μmol/L)",
          type: "number",
          validation: { min: 30, max: 1000 }
        },
        {
          id: "urea",
          label: "Urea (mmol/L)",
          type: "number",
          validation: { min: 1, max: 50 }
        },
        {
          id: "sodium",
          label: "Sodium (mmol/L)",
          type: "number",
          validation: { min: 120, max: 160 }
        },
        {
          id: "potassium",
          label: "Potassium (mmol/L)",
          type: "number",
          validation: { min: 2, max: 8 }
        }
      ]
    },
    {
      id: "interpretation",
      title: "Interpretation",
      type: "rich_text",
      required: true,
      content: `
**RESULTS SUMMARY:**

**ABNORMAL FINDINGS:**
- 

**CLINICAL SIGNIFICANCE:**
- 

**RECOMMENDATIONS:**
- 

**FOLLOW-UP REQUIRED:**
- 
      `
    }
  ]
};

// Specialist Referral Template
export const specialistReferralTemplate: Template = {
  id: "specialist_referral_sa",
  name: "Specialist Referral Letter",
  description: "Template for referring patients to specialists",
  category: "general",
  sections: [
    {
      id: "referral_details",
      title: "Referral Details",
      type: "form",
      required: true,
      fields: [
        {
          id: "specialist_name",
          label: "Specialist Name",
          type: "text",
          placeholder: "Dr. Name",
          required: true
        },
        {
          id: "specialist_practice",
          label: "Practice/Hospital",
          type: "text",
          placeholder: "Practice or hospital name",
          required: true
        },
        {
          id: "urgency",
          label: "Urgency",
          type: "select",
          options: [
            { value: "routine", label: "Routine" },
            { value: "soon", label: "Soon (2-4 weeks)" },
            { value: "urgent", label: "Urgent (1 week)" },
            { value: "emergency", label: "Emergency (immediate)" }
          ],
          required: true
        },
        {
          id: "specialty",
          label: "Specialty",
          type: "select",
          options: [
            { value: "cardiology", label: "Cardiology" },
            { value: "dermatology", label: "Dermatology" },
            { value: "endocrinology", label: "Endocrinology" },
            { value: "gastroenterology", label: "Gastroenterology" },
            { value: "neurology", label: "Neurology" },
            { value: "oncology", label: "Oncology" },
            { value: "orthopedics", label: "Orthopedics" },
            { value: "psychiatry", label: "Psychiatry" },
            { value: "pulmonology", label: "Pulmonology" },
            { value: "urology", label: "Urology" }
          ],
          required: true
        }
      ]
    },
    {
      id: "reason_for_referral",
      title: "Reason for Referral",
      type: "textarea",
      required: true,
      placeholder: "Specific reason for specialist consultation..."
    },
    {
      id: "clinical_summary",
      title: "Clinical Summary",
      type: "rich_text",
      required: true,
      content: `
**PRESENTING COMPLAINT:**

**RELEVANT HISTORY:**

**CURRENT MEDICATIONS:**

**EXAMINATION FINDINGS:**

**INVESTIGATIONS COMPLETED:**

**WORKING DIAGNOSIS:**

**SPECIFIC QUESTIONS FOR SPECIALIST:**
1. 
2. 
3. 
      `
    }
  ]
};

// Export all specialized templates
export const specializedTemplates: Template[] = [
  ultrasoundTemplate,
  clinicalConsultationTemplate,
  labResultsTemplate,
  specialistReferralTemplate
];

// Template categories for South African medical practice
export const SA_TEMPLATE_CATEGORIES = {
  general: {
    name: "General Practice",
    description: "Standard consultation and assessment templates",
    icon: "stethoscope"
  },
  specialist: {
    name: "Specialist Reports",
    description: "Specialized examination and diagnostic templates",
    icon: "microscope"
  },
  emergency: {
    name: "Emergency Medicine",
    description: "Acute care and emergency assessment templates",
    icon: "alert"
  },
  preventive: {
    name: "Preventive Care",
    description: "Health screening and wellness check templates",
    icon: "shield"
  }
};

// Common South African medical conditions for quick templates
export const SA_COMMON_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes Mellitus", 
  "HIV/AIDS",
  "Tuberculosis",
  "Respiratory Tract Infection",
  "Gastroenteritis",
  "Musculoskeletal Pain",
  "Mental Health Disorders",
  "Cardiovascular Disease",
  "Chronic Kidney Disease"
];