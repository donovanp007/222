import { Patient, Session } from "@/types";
import { extractMedications, MedicationDetails } from "./contentCategorization";
import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";

export interface RiskFactor {
  factor: string;
  category: 'cardiovascular' | 'metabolic' | 'infectious' | 'respiratory' | 'neurological' | 'other';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  recommendations: string[];
  evidence: string[];
}

export interface ContraindicationAlert {
  type: 'drug-allergy' | 'drug-condition' | 'drug-drug' | 'drug-age' | 'drug-pregnancy';
  severity: 'warning' | 'contraindicated' | 'caution';
  medication: string;
  conflictWith: string;
  description: string;
  alternatives?: string[];
  overrideReason?: string;
}

export interface GuidelineCompliance {
  guideline: string;
  compliance: 'compliant' | 'partial' | 'non-compliant';
  recommendations: string[];
  evidence: string;
}

export interface ClinicalDecisionSupport {
  riskFactors: RiskFactor[];
  contraindications: ContraindicationAlert[];
  guidelineCompliance: GuidelineCompliance[];
  qualityMetrics: {
    documentationCompleteness: number;
    clinicalReasoningScore: number;
    evidenceBasedScore: number;
  };
  urgencyAssessment: {
    level: 'routine' | 'urgent' | 'emergency';
    reasoning: string;
    requiredActions: string[];
  };
}

/**
 * Comprehensive clinical decision support system
 */
export async function performClinicalDecisionSupport(
  currentTranscription: string,
  patientData: Patient,
  patientHistory: Session[],
  extractedMedications: MedicationDetails[]
): Promise<ClinicalDecisionSupport> {
  // Extract risk factors
  const riskFactors = await identifyRiskFactors(currentTranscription, patientData, patientHistory);
  
  // Check contraindications
  const contraindications = checkContraindications(extractedMedications, patientData, patientHistory);
  
  // Assess guideline compliance
  const guidelineCompliance = await assessGuidelineCompliance(currentTranscription, patientData);
  
  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(currentTranscription, patientData);
  
  // Assess urgency
  const urgencyAssessment = assessUrgency(currentTranscription, riskFactors);

  return {
    riskFactors,
    contraindications,
    guidelineCompliance,
    qualityMetrics,
    urgencyAssessment
  };
}

/**
 * Advanced risk factor identification for South African context
 */
async function identifyRiskFactors(
  transcription: string,
  patient: Patient,
  history: Session[]
): Promise<RiskFactor[]> {
  const riskFactors: RiskFactor[] = [];
  const content = transcription.toLowerCase();

  // Age-based risk factors
  if (patient.age > 65) {
    riskFactors.push({
      factor: 'Advanced age',
      category: 'other',
      severity: 'moderate',
      description: 'Increased risk for multiple conditions and medication complications',
      recommendations: [
        'Consider geriatric dosing adjustments',
        'Monitor for polypharmacy interactions',
        'Assess cognitive function and fall risk'
      ],
      evidence: [`Patient age: ${patient.age} years`]
    });
  }

  // Cardiovascular risk factors
  const cvRiskIndicators = ['hypertension', 'diabetes', 'smoking', 'cholesterol', 'heart disease'];
  let cvRiskCount = 0;
  
  for (const indicator of cvRiskIndicators) {
    if (content.includes(indicator) || hasHistoricalCondition(history, indicator)) {
      cvRiskCount++;
    }
  }

  if (cvRiskCount >= 2) {
    riskFactors.push({
      factor: 'High cardiovascular risk',
      category: 'cardiovascular',
      severity: cvRiskCount >= 3 ? 'high' : 'moderate',
      description: 'Multiple cardiovascular risk factors present',
      recommendations: [
        'Consider cardiology referral',
        'Implement aggressive lifestyle modifications',
        'Monitor blood pressure and lipids regularly',
        'Consider statin therapy if indicated'
      ],
      evidence: [`${cvRiskCount} cardiovascular risk factors identified`]
    });
  }

  // South African specific risk factors
  if (content.includes('hiv') || hasHistoricalCondition(history, 'hiv')) {
    riskFactors.push({
      factor: 'HIV infection',
      category: 'infectious',
      severity: 'high',
      description: 'Immunocompromised state requiring special considerations',
      recommendations: [
        'Monitor CD4 count and viral load',
        'Screen for opportunistic infections',
        'Consider drug interactions with ARVs',
        'Ensure adherence to antiretroviral therapy'
      ],
      evidence: ['HIV status documented']
    });
  }

  if (content.includes('tuberculosis') || content.includes('tb') || hasHistoricalCondition(history, 'tb')) {
    riskFactors.push({
      factor: 'Tuberculosis history/exposure',
      category: 'infectious',
      severity: 'high',
      description: 'Risk of TB reactivation or treatment complications',
      recommendations: [
        'Monitor for TB symptoms',
        'Consider chest X-ray',
        'Ensure completion of TB treatment if active',
        'Screen household contacts'
      ],
      evidence: ['TB history or exposure documented']
    });
  }

  // Metabolic risk factors
  if (content.includes('diabetes') || hasHistoricalCondition(history, 'diabetes')) {
    const diabetesComplications = ['nephropathy', 'retinopathy', 'neuropathy', 'foot ulcer'];
    const complications = diabetesComplications.filter(comp => content.includes(comp));
    
    riskFactors.push({
      factor: 'Diabetes mellitus',
      category: 'metabolic',
      severity: complications.length > 0 ? 'high' : 'moderate',
      description: `Diabetes with ${complications.length > 0 ? 'complications' : 'no documented complications'}`,
      recommendations: [
        'Monitor HbA1c every 3-6 months',
        'Annual diabetic screening (eyes, feet, kidneys)',
        'Blood pressure and lipid management',
        'Patient education on glucose monitoring'
      ],
      evidence: [`Diabetes documented${complications.length > 0 ? ` with complications: ${complications.join(', ')}` : ''}`]
    });
  }

  // Use AI for additional risk factor identification
  const aiRiskFactors = await identifyAIRiskFactors(transcription, patient);
  riskFactors.push(...aiRiskFactors);

  return riskFactors;
}

async function identifyAIRiskFactors(transcription: string, patient: Patient): Promise<RiskFactor[]> {
  const apiKey = getStoredApiKey();
  if (!apiKey) return [];

  const prompt = `
Analyze this medical transcription for clinical risk factors relevant to South African healthcare:

Patient Age: ${patient.age}
Transcription: "${transcription}"

Identify specific risk factors considering:
1. South African disease prevalence (TB, HIV, diabetes, hypertension)
2. Social determinants of health
3. Medication-related risks
4. Age-specific considerations

Return JSON array of risk factors:
[
  {
    "factor": "Risk factor name",
    "category": "cardiovascular|metabolic|infectious|respiratory|neurological|other",
    "severity": "low|moderate|high|critical",
    "description": "Detailed description",
    "recommendations": ["rec1", "rec2"],
    "evidence": ["evidence1", "evidence2"]
  }
]
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
        max_tokens: 1500
      })
    });

    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('AI risk factor identification failed:', error);
  }

  return [];
}

/**
 * Comprehensive contraindication checking
 */
function checkContraindications(
  medications: MedicationDetails[],
  patient: Patient,
  history: Session[]
): ContraindicationAlert[] {
  const alerts: ContraindicationAlert[] = [];
  
  // Age-based contraindications
  if (patient.age > 65) {
    const elderlyInappropriate = [
      { med: 'diazepam', reason: 'Increased fall risk and cognitive impairment' },
      { med: 'diphenhydramine', reason: 'Anticholinergic effects and confusion' },
      { med: 'amitriptyline', reason: 'Cardiac conduction abnormalities' },
      { med: 'indomethacin', reason: 'CNS side effects and renal toxicity' }
    ];

    for (const inappropriate of elderlyInappropriate) {
      const foundMed = medications.find(m => 
        m.name.toLowerCase().includes(inappropriate.med)
      );
      
      if (foundMed) {
        alerts.push({
          type: 'drug-age',
          severity: 'caution',
          medication: foundMed.name,
          conflictWith: 'Advanced age (>65 years)',
          description: inappropriate.reason,
          alternatives: getAlternativeMedications(inappropriate.med)
        });
      }
    }
  }

  // Condition-based contraindications
  const conditionContraindications = [
    {
      condition: 'asthma',
      medications: ['propranolol', 'atenolol', 'metoprolol'],
      severity: 'contraindicated' as const,
      description: 'Beta-blockers can precipitate bronchospasm in asthmatic patients',
      alternatives: ['amlodipine', 'lisinopril', 'losartan']
    },
    {
      condition: 'heart failure',
      medications: ['verapamil', 'diltiazem', 'nifedipine'],
      severity: 'caution' as const,
      description: 'Calcium channel blockers may worsen heart failure',
      alternatives: ['lisinopril', 'carvedilol', 'spironolactone']
    },
    {
      condition: 'kidney disease',
      medications: ['metformin', 'lithium', 'nsaid'],
      severity: 'caution' as const,
      description: 'Dose adjustment or avoidance required in renal impairment',
      alternatives: ['insulin', 'paracetamol']
    }
  ];

  for (const contraindication of conditionContraindications) {
    if (hasHistoricalCondition(history, contraindication.condition)) {
      for (const contraindicatedMed of contraindication.medications) {
        const foundMed = medications.find(m => 
          m.name.toLowerCase().includes(contraindicatedMed)
        );
        
        if (foundMed) {
          alerts.push({
            type: 'drug-condition',
            severity: contraindication.severity,
            medication: foundMed.name,
            conflictWith: contraindication.condition,
            description: contraindication.description,
            alternatives: contraindication.alternatives
          });
        }
      }
    }
  }

  // Drug-drug interactions
  const drugInteractions = [
    {
      drug1: 'warfarin',
      drug2: 'aspirin',
      severity: 'contraindicated' as const,
      description: 'Significantly increased bleeding risk',
      alternatives: ['clopidogrel (with careful monitoring)']
    },
    {
      drug1: 'metformin',
      drug2: 'contrast',
      severity: 'caution' as const,
      description: 'Risk of lactic acidosis with contrast procedures',
      alternatives: ['Temporary discontinuation before contrast']
    }
  ];

  for (const interaction of drugInteractions) {
    const med1 = medications.find(m => m.name.toLowerCase().includes(interaction.drug1));
    const med2 = medications.find(m => m.name.toLowerCase().includes(interaction.drug2));
    
    if (med1 && med2) {
      alerts.push({
        type: 'drug-drug',
        severity: interaction.severity,
        medication: med1.name,
        conflictWith: med2.name,
        description: interaction.description,
        alternatives: interaction.alternatives
      });
    }
  }

  return alerts;
}

function hasHistoricalCondition(history: Session[], condition: string): boolean {
  return history.some(session => 
    session.content.toLowerCase().includes(condition.toLowerCase()) ||
    session.diagnosis?.some(d => d.toLowerCase().includes(condition.toLowerCase()))
  );
}

function getAlternativeMedications(medication: string): string[] {
  const alternatives: Record<string, string[]> = {
    'diazepam': ['lorazepam (shorter acting)', 'non-pharmacological approaches'],
    'diphenhydramine': ['cetirizine', 'loratadine'],
    'amitriptyline': ['sertraline', 'mirtazapine'],
    'indomethacin': ['paracetamol', 'topical NSAIDs']
  };
  
  return alternatives[medication] || [];
}

/**
 * Clinical guideline compliance assessment
 */
async function assessGuidelineCompliance(
  transcription: string,
  patient: Patient
): Promise<GuidelineCompliance[]> {
  const compliance: GuidelineCompliance[] = [];
  const content = transcription.toLowerCase();

  // Hypertension guidelines
  if (content.includes('hypertension') || content.includes('blood pressure')) {
    const hasLifestyleAdvice = content.includes('diet') || content.includes('exercise') || content.includes('lifestyle');
    const hasBPTarget = /\d+\/\d+/.test(content);
    
    compliance.push({
      guideline: 'Hypertension Management (SEMDSA Guidelines)',
      compliance: hasLifestyleAdvice && hasBPTarget ? 'compliant' : 'partial',
      recommendations: [
        'Document blood pressure target (<140/90 for most patients)',
        'Provide lifestyle counseling (diet, exercise, weight management)',
        'Consider combination therapy for BP >160/100',
        'Regular monitoring schedule'
      ],
      evidence: `Lifestyle advice: ${hasLifestyleAdvice ? 'Yes' : 'No'}, BP target documented: ${hasBPTarget ? 'Yes' : 'No'}`
    });
  }

  // Diabetes guidelines
  if (content.includes('diabetes')) {
    const hasHbA1c = content.includes('hba1c') || content.includes('glycated');
    const hasEducation = content.includes('education') || content.includes('monitor') || content.includes('glucose');
    
    compliance.push({
      guideline: 'Diabetes Management (SEMDSA Guidelines)',
      compliance: hasHbA1c && hasEducation ? 'compliant' : 'partial',
      recommendations: [
        'HbA1c target <7% for most patients',
        'Patient education on glucose monitoring',
        'Annual screening for complications',
        'Cardiovascular risk assessment'
      ],
      evidence: `HbA1c mentioned: ${hasHbA1c ? 'Yes' : 'No'}, Patient education: ${hasEducation ? 'Yes' : 'No'}`
    });
  }

  return compliance;
}

/**
 * Quality metrics calculation
 */
function calculateQualityMetrics(transcription: string, patient: Patient): {
  documentationCompleteness: number;
  clinicalReasoningScore: number;
  evidenceBasedScore: number;
} {
  const content = transcription.toLowerCase();
  
  // Documentation completeness
  const requiredElements = ['history', 'examination', 'assessment', 'plan'];
  const presentElements = requiredElements.filter(element => content.includes(element));
  const documentationCompleteness = presentElements.length / requiredElements.length;

  // Clinical reasoning score
  const reasoningIndicators = ['because', 'therefore', 'due to', 'caused by', 'likely', 'differential'];
  const reasoningCount = reasoningIndicators.filter(indicator => content.includes(indicator)).length;
  const clinicalReasoningScore = Math.min(reasoningCount / 3, 1);

  // Evidence-based score
  const evidenceIndicators = ['guidelines', 'study', 'evidence', 'research', 'protocol'];
  const evidenceCount = evidenceIndicators.filter(indicator => content.includes(indicator)).length;
  const evidenceBasedScore = Math.min(evidenceCount / 2, 1);

  return {
    documentationCompleteness,
    clinicalReasoningScore,
    evidenceBasedScore
  };
}

/**
 * Urgency assessment
 */
function assessUrgency(
  transcription: string,
  riskFactors: RiskFactor[]
): {
  level: 'routine' | 'urgent' | 'emergency';
  reasoning: string;
  requiredActions: string[];
} {
  const content = transcription.toLowerCase();
  const emergencyKeywords = [
    'chest pain', 'shortness of breath', 'severe', 'acute', 'emergency',
    'unconscious', 'bleeding', 'stroke', 'heart attack'
  ];
  
  const urgentKeywords = [
    'worsening', 'deteriorating', 'concerning', 'significant', 'new symptoms'
  ];

  const criticalRiskFactors = riskFactors.filter(rf => rf.severity === 'critical').length;
  const highRiskFactors = riskFactors.filter(rf => rf.severity === 'high').length;

  // Emergency assessment
  const emergencyCount = emergencyKeywords.filter(keyword => content.includes(keyword)).length;
  if (emergencyCount > 0 || criticalRiskFactors > 0) {
    return {
      level: 'emergency',
      reasoning: `Emergency indicators: ${emergencyCount}, Critical risk factors: ${criticalRiskFactors}`,
      requiredActions: [
        'Immediate medical attention required',
        'Consider hospital admission',
        'Vital signs monitoring',
        'Senior clinician review'
      ]
    };
  }

  // Urgent assessment
  const urgentCount = urgentKeywords.filter(keyword => content.includes(keyword)).length;
  if (urgentCount > 0 || highRiskFactors > 1) {
    return {
      level: 'urgent',
      reasoning: `Urgent indicators: ${urgentCount}, High risk factors: ${highRiskFactors}`,
      requiredActions: [
        'Follow-up within 24-48 hours',
        'Safety netting advice provided',
        'Clear instructions for deterioration'
      ]
    };
  }

  return {
    level: 'routine',
    reasoning: 'No urgent indicators identified',
    requiredActions: [
      'Routine follow-up as scheduled',
      'Patient education provided',
      'Clear management plan documented'
    ]
  };
}