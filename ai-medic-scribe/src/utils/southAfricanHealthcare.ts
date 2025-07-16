import { Patient } from "@/types";
import { MedicationDetails } from "./contentCategorization";
import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";

export interface MedicalAidFormulary {
  medicationName: string;
  isOnFormulary: boolean;
  coverageLevel: 'full' | 'partial' | 'not-covered' | 'prior-auth-required';
  alternatives?: string[];
  costEstimate?: {
    patientPortion: number;
    medicalAidPortion: number;
    currency: 'ZAR';
  };
  authorizationRequired: boolean;
  specialConditions?: string[];
}

export interface SouthAfricanHealthcareContext {
  medicalAidInfo: {
    provider: string;
    scheme: string;
    formularyChecks: MedicalAidFormulary[];
  };
  publicHealthcareOptions: {
    availableServices: string[];
    referralRequired: boolean;
    estimatedWaitTime: string;
    nearestFacility: string;
  };
  localDiseasePatterns: {
    prevalentConditions: string[];
    seasonalConsiderations: string[];
    riskFactors: string[];
  };
  regulatoryCompliance: {
    medicineControlCouncil: boolean;
    scheduledSubstances: string[];
    prescriptionRequirements: string[];
  };
  culturalConsiderations: {
    languagePreferences: string[];
    traditionalMedicineInteractions: string[];
    culturalSensitivities: string[];
  };
}

/**
 * South African medical aid schemes and their characteristics
 */
const MEDICAL_AID_SCHEMES = {
  'discovery': {
    name: 'Discovery Health',
    schemes: ['KeyCare', 'Classic', 'Comprehensive', 'Executive'],
    formularyTiers: ['Generic', 'Innovator', 'Speciality'],
    vitalityIntegration: true,
    chronicBenefits: true
  },
  'momentum': {
    name: 'Momentum Health',
    schemes: ['Ingwe', 'Impala', 'Cheetah'],
    formularyTiers: ['Essential', 'Standard', 'Premium'],
    vitalityIntegration: false,
    chronicBenefits: true
  },
  'medscheme': {
    name: 'Medscheme',
    schemes: ['Bankmed', 'Bonitas', 'Fedhealth'],
    formularyTiers: ['Reference', 'Alternative', 'Non-reference'],
    vitalityIntegration: false,
    chronicBenefits: true
  },
  'gems': {
    name: 'Government Employees Medical Scheme',
    schemes: ['GEMS'],
    formularyTiers: ['Essential', 'Non-essential'],
    vitalityIntegration: false,
    chronicBenefits: true
  }
};

/**
 * Common South African medication formulary
 */
const SA_MEDICATION_FORMULARY = {
  // Cardiovascular
  'atorvastatin': { generic: true, cost: 'low', alternatives: ['simvastatin', 'rosuvastatin'] },
  'amlodipine': { generic: true, cost: 'low', alternatives: ['nifedipine', 'lercanidipine'] },
  'lisinopril': { generic: true, cost: 'low', alternatives: ['enalapril', 'perindopril'] },
  'metoprolol': { generic: true, cost: 'low', alternatives: ['atenolol', 'carvedilol'] },
  
  // Diabetes
  'metformin': { generic: true, cost: 'low', alternatives: ['gliclazide', 'sitagliptin'] },
  'insulin glargine': { generic: false, cost: 'high', alternatives: ['insulin detemir', 'NPH insulin'] },
  
  // Antibiotics
  'amoxicillin': { generic: true, cost: 'low', alternatives: ['erythromycin', 'doxycycline'] },
  'ciprofloxacin': { generic: true, cost: 'low', alternatives: ['levofloxacin', 'moxifloxacin'] },
  
  // Pain management
  'paracetamol': { generic: true, cost: 'low', alternatives: ['ibuprofen', 'diclofenac'] },
  'tramadol': { generic: true, cost: 'medium', alternatives: ['codeine', 'morphine'] },
  
  // Respiratory
  'salbutamol': { generic: true, cost: 'low', alternatives: ['terbutaline', 'formoterol'] },
  'prednisolone': { generic: true, cost: 'low', alternatives: ['methylprednisolone', 'dexamethasone'] }
};

/**
 * Check medication against South African medical aid formularies
 */
export async function checkMedicalAidFormulary(
  medications: MedicationDetails[],
  patient: Patient
): Promise<MedicalAidFormulary[]> {
  const formularyChecks: MedicalAidFormulary[] = [];
  
  if (!patient.medicalAid?.provider) {
    // Return public healthcare information
    return medications.map(med => ({
      medicationName: med.name,
      isOnFormulary: checkPublicHealthcareFormulary(med.name),
      coverageLevel: 'full' as const,
      authorizationRequired: false,
      alternatives: getPublicHealthcareAlternatives(med.name)
    }));
  }

  for (const medication of medications) {
    const formularyCheck = await checkSingleMedicationFormulary(
      medication,
      patient.medicalAid.provider.toLowerCase()
    );
    formularyChecks.push(formularyCheck);
  }

  return formularyChecks;
}

async function checkSingleMedicationFormulary(
  medication: MedicationDetails,
  medicalAidProvider: string
): Promise<MedicalAidFormulary> {
  const medicationName = medication.name.toLowerCase();
  const formularyData = SA_MEDICATION_FORMULARY[medicationName as keyof typeof SA_MEDICATION_FORMULARY];
  
  if (!formularyData) {
    // Use AI to check unknown medications
    return await checkUnknownMedicationFormulary(medication, medicalAidProvider);
  }

  // Determine coverage based on medical aid and medication characteristics
  let coverageLevel: 'full' | 'partial' | 'not-covered' | 'prior-auth-required' = 'full';
  let authorizationRequired = false;

  if (!formularyData.generic && formularyData.cost === 'high') {
    if (medicalAidProvider === 'discovery') {
      coverageLevel = 'prior-auth-required';
      authorizationRequired = true;
    } else {
      coverageLevel = 'partial';
    }
  }

  return {
    medicationName: medication.name,
    isOnFormulary: true,
    coverageLevel,
    alternatives: formularyData.alternatives,
    authorizationRequired,
    costEstimate: calculateCostEstimate(formularyData, medicalAidProvider)
  };
}

async function checkUnknownMedicationFormulary(
  medication: MedicationDetails,
  medicalAidProvider: string
): Promise<MedicalAidFormulary> {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    return {
      medicationName: medication.name,
      isOnFormulary: false,
      coverageLevel: 'not-covered',
      authorizationRequired: true,
      alternatives: ['Consult pharmacist for alternatives']
    };
  }

  const prompt = `
Check if this medication is on South African medical aid formularies:

Medication: ${medication.name}
Medical Aid: ${medicalAidProvider}
Dosage: ${medication.dosage || 'Not specified'}

Consider:
1. Generic vs branded medications
2. Chronic disease list inclusion
3. Prior authorization requirements
4. Cost-effective alternatives

Return JSON:
{
  "isOnFormulary": boolean,
  "coverageLevel": "full|partial|not-covered|prior-auth-required",
  "alternatives": ["alt1", "alt2"],
  "authorizationRequired": boolean,
  "specialConditions": ["condition1"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getSelectedAIModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
        medicationName: medication.name,
        isOnFormulary: result.isOnFormulary,
        coverageLevel: result.coverageLevel,
        alternatives: result.alternatives,
        authorizationRequired: result.authorizationRequired,
        specialConditions: result.specialConditions
      };
    }
  } catch (error) {
    console.error('Formulary check failed:', error);
  }

  // Fallback
  return {
    medicationName: medication.name,
    isOnFormulary: false,
    coverageLevel: 'not-covered',
    authorizationRequired: true,
    alternatives: ['Check with medical aid directly']
  };
}

function checkPublicHealthcareFormulary(medicationName: string): boolean {
  // Essential Drugs List (EDL) for South African public healthcare
  const edlMedications = [
    'paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 'doxycycline',
    'metformin', 'insulin', 'lisinopril', 'atenolol', 'amlodipine',
    'simvastatin', 'furosemide', 'salbutamol', 'prednisolone'
  ];
  
  return edlMedications.some(edl => 
    medicationName.toLowerCase().includes(edl) || edl.includes(medicationName.toLowerCase())
  );
}

function getPublicHealthcareAlternatives(medicationName: string): string[] {
  const alternatives: Record<string, string[]> = {
    'atorvastatin': ['simvastatin (EDL)'],
    'losartan': ['lisinopril (EDL)'],
    'esomeprazole': ['omeprazole (EDL)'],
    'rosuvastatin': ['simvastatin (EDL)']
  };
  
  return alternatives[medicationName.toLowerCase()] || [];
}

function calculateCostEstimate(
  formularyData: any,
  medicalAidProvider: string
): { patientPortion: number; medicalAidPortion: number; currency: 'ZAR' } {
  // Simplified cost calculation - in reality this would be much more complex
  let baseCost = 0;
  
  switch (formularyData.cost) {
    case 'low': baseCost = 50; break;
    case 'medium': baseCost = 200; break;
    case 'high': baseCost = 800; break;
  }

  let copayPercentage = 0;
  if (medicalAidProvider === 'discovery') {
    copayPercentage = formularyData.generic ? 0 : 0.25;
  } else {
    copayPercentage = formularyData.generic ? 0.1 : 0.3;
  }

  const patientPortion = Math.round(baseCost * copayPercentage);
  const medicalAidPortion = baseCost - patientPortion;

  return {
    patientPortion,
    medicalAidPortion,
    currency: 'ZAR'
  };
}

/**
 * Get comprehensive South African healthcare context
 */
export async function getSouthAfricanHealthcareContext(
  patient: Patient,
  currentConditions: string[]
): Promise<SouthAfricanHealthcareContext> {
  const medicalAidProvider = patient.medicalAid?.provider?.toLowerCase() || 'public';
  
  return {
    medicalAidInfo: {
      provider: patient.medicalAid?.provider || 'Public Healthcare',
      scheme: patient.medicalAid?.memberNumber ? 'Private' : 'Public',
      formularyChecks: [] // Would be populated by checkMedicalAidFormulary
    },
    publicHealthcareOptions: {
      availableServices: getPublicHealthcareServices(),
      referralRequired: true,
      estimatedWaitTime: '2-4 weeks for specialist referral',
      nearestFacility: 'Community Health Centre'
    },
    localDiseasePatterns: {
      prevalentConditions: [
        'Hypertension (28% of adults)',
        'Type 2 Diabetes (13% of adults)',
        'HIV/AIDS (20% of adults 15-49)',
        'Tuberculosis (615 per 100,000)',
        'Obesity (28% of adults)'
      ],
      seasonalConsiderations: [
        'Respiratory infections peak in winter (May-August)',
        'Malaria risk in summer (October-May) in certain regions',
        'Gastroenteritis increases in rainy season'
      ],
      riskFactors: [
        'High sodium diet (traditional foods)',
        'Limited access to healthcare in rural areas',
        'High unemployment and stress',
        'Indoor air pollution from cooking fires'
      ]
    },
    regulatoryCompliance: {
      medicineControlCouncil: true,
      scheduledSubstances: getScheduledSubstances(),
      prescriptionRequirements: [
        'Valid doctor registration number',
        'Patient identification details',
        'Medicine name, strength, quantity',
        'Directions for use in English and/or local language'
      ]
    },
    culturalConsiderations: {
      languagePreferences: [
        'English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Tswana'
      ],
      traditionalMedicineInteractions: [
        'African potato (hypoxis) - may interact with diabetes medications',
        'Buchu - diuretic effects may enhance blood pressure medications',
        'Kanna (sceletium) - may interact with antidepressants'
      ],
      culturalSensitivities: [
        'Respect for traditional healing practices',
        'Family involvement in medical decisions',
        'Religious considerations for treatment timing',
        'Gender preferences for healthcare providers'
      ]
    }
  };
}

function getPublicHealthcareServices(): string[] {
  return [
    'Primary healthcare at clinics',
    'District hospital services',
    'Emergency medical services',
    'Maternal and child health',
    'HIV/AIDS treatment and prevention',
    'TB screening and treatment',
    'Chronic disease management',
    'Mental health services',
    'Oral health services',
    'Health promotion and education'
  ];
}

function getScheduledSubstances(): string[] {
  return [
    'Schedule 5: Codeine preparations',
    'Schedule 6: Prescription only medicines',
    'Schedule 7: Controlled substances (morphine, fentanyl)',
    'Schedule 8: Dangerous substances (chemotherapy)',
    'Prescription required for all scheduled substances'
  ];
}

/**
 * Generate medical aid authorization letter
 */
export function generateAuthorizationLetter(
  medication: MedicationDetails,
  patient: Patient,
  clinicalJustification: string
): string {
  const today = new Date().toLocaleDateString('en-ZA');
  
  return `
PRIOR AUTHORIZATION REQUEST

Date: ${today}
Medical Aid: ${patient.medicalAid?.provider || 'Unknown'}
Member Number: ${patient.medicalAid?.memberNumber || 'Unknown'}
Patient Name: ${patient.name} ${patient.surname}
ID Number: ${patient.idNumber || 'Not provided'}

MEDICATION REQUEST:
Medication: ${medication.name}
Dosage: ${medication.dosage || 'As prescribed'}
Frequency: ${medication.frequency || 'As needed'}
Duration: ${medication.duration || 'Ongoing'}

CLINICAL JUSTIFICATION:
${clinicalJustification}

ALTERNATIVE TREATMENTS CONSIDERED:
- First-line treatments have been tried
- Patient has contraindications to formulary alternatives
- Clinical condition requires specific medication

SUPPORTING DOCUMENTATION:
- Medical history attached
- Laboratory results available upon request
- Specialist recommendation if applicable

Doctor: ________________________
Practice Number: _________________
Date: ${today}
Signature: _______________________

This letter serves as a request for prior authorization for the above medication based on medical necessity and clinical judgment.
`;
}

/**
 * Check for traditional medicine interactions
 */
export function checkTraditionalMedicineInteractions(
  medications: MedicationDetails[],
  traditionalMedicines: string[]
): Array<{
  medication: string;
  traditionalMedicine: string;
  interaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  recommendation: string;
}> {
  const interactions = [];
  
  const knownInteractions = [
    {
      traditional: 'african potato',
      medication: ['metformin', 'insulin'],
      interaction: 'May enhance hypoglycemic effects',
      severity: 'moderate' as const,
      recommendation: 'Monitor blood glucose closely'
    },
    {
      traditional: 'buchu',
      medication: ['furosemide', 'hydrochlorothiazide'],
      interaction: 'Additive diuretic effects',
      severity: 'moderate' as const,
      recommendation: 'Monitor for dehydration and electrolyte imbalance'
    },
    {
      traditional: 'kanna',
      medication: ['sertraline', 'fluoxetine', 'amitriptyline'],
      interaction: 'May potentiate serotonergic effects',
      severity: 'severe' as const,
      recommendation: 'Avoid combination or reduce pharmaceutical dose'
    }
  ];

  for (const interaction of knownInteractions) {
    if (traditionalMedicines.some(tm => 
      tm.toLowerCase().includes(interaction.traditional)
    )) {
      const affectedMeds = medications.filter(med =>
        interaction.medication.some(intMed => 
          med.name.toLowerCase().includes(intMed)
        )
      );
      
      for (const med of affectedMeds) {
        interactions.push({
          medication: med.name,
          traditionalMedicine: interaction.traditional,
          interaction: interaction.interaction,
          severity: interaction.severity,
          recommendation: interaction.recommendation
        });
      }
    }
  }

  return interactions;
}