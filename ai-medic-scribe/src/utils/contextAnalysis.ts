import { Patient, Session } from "@/types";
import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";
import { extractMedicalEntities, MedicalEntity, assessSymptomSeverity } from "./contentCategorization";

export interface ContextualAnalysis {
  medicalHistory: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    surgeries: string[];
  };
  currentPresentation: {
    chiefComplaint: string;
    symptoms: Array<{
      symptom: string;
      duration: string;
      severity: 'mild' | 'moderate' | 'severe';
      progression: 'improving' | 'worsening' | 'stable';
    }>;
    associatedFindings: string[];
  };
  riskFactors: string[];
  drugInteractions: Array<{
    medication1: string;
    medication2: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
  }>;
  contraindications: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * Multi-sentence context analysis for comprehensive medical understanding
 */
export async function analyzeContextualMedicalContent(
  currentTranscription: string,
  patientHistory: Session[],
  patientData: Patient
): Promise<ContextualAnalysis> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Extract entities from current transcription
  const currentEntities = extractMedicalEntities(currentTranscription);
  const symptomSeverity = assessSymptomSeverity(currentTranscription);

  // Compile patient history context
  const historicalContext = compilePatientHistory(patientHistory);
  
  // Create comprehensive analysis prompt
  const prompt = createContextualAnalysisPrompt(
    currentTranscription,
    historicalContext,
    patientData,
    currentEntities,
    symptomSeverity
  );

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getSelectedAIModel(),
        messages: [
          {
            role: 'system',
            content: 'You are an expert South African medical AI specializing in contextual clinical analysis. You understand medication interactions, contraindications, and local medical practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '');
    }
    
    return JSON.parse(content.trim());
  } catch (error) {
    console.error('Contextual analysis failed:', error);
    
    // Fallback analysis
    return createBasicContextualAnalysis(currentTranscription, currentEntities, symptomSeverity);
  }
}

function compilePatientHistory(sessions: Session[]): string {
  const recentSessions = sessions
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    .slice(0, 5); // Last 5 sessions

  return recentSessions.map(session => {
    const date = new Date(session.visitDate).toLocaleDateString();
    return `${date}: ${session.content.substring(0, 200)}...`;
  }).join('\n\n');
}

function createContextualAnalysisPrompt(
  currentTranscription: string,
  historicalContext: string,
  patientData: Patient,
  entities: MedicalEntity[],
  symptoms: Array<{ symptom: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number }>
): string {
  return `
Perform comprehensive contextual medical analysis for this South African patient consultation.

PATIENT INFORMATION:
- Age: ${patientData.age}
- Medical Aid: ${patientData.medicalAid?.provider || 'None specified'}

CURRENT CONSULTATION:
"${currentTranscription}"

PATIENT HISTORY (Last 5 visits):
${historicalContext || 'No previous visits recorded'}

EXTRACTED ENTITIES:
${entities.map(e => `- ${e.type}: ${e.text} (confidence: ${e.confidence})`).join('\n')}

SYMPTOM ANALYSIS:
${symptoms.map(s => `- ${s.symptom}: ${s.severity} severity`).join('\n')}

ANALYSIS REQUIREMENTS:
1. **Medical History Correlation**: Compare current presentation with historical patterns
2. **Drug Interaction Analysis**: Check for interactions between current and historical medications
3. **Contraindication Assessment**: Identify any contraindications based on patient history
4. **Risk Factor Identification**: Consider age, comorbidities, and South African health context
5. **Clinical Progression Analysis**: Assess if symptoms are improving, worsening, or stable
6. **South African Context**: Consider local disease patterns, medical aid limitations, and accessibility

Return ONLY valid JSON in this exact format:
{
  "medicalHistory": {
    "conditions": ["condition1", "condition2"],
    "medications": ["med1", "med2"],
    "allergies": ["allergy1"],
    "surgeries": ["surgery1"]
  },
  "currentPresentation": {
    "chiefComplaint": "Primary reason for visit",
    "symptoms": [
      {
        "symptom": "symptom name",
        "duration": "duration if mentioned",
        "severity": "mild|moderate|severe",
        "progression": "improving|worsening|stable"
      }
    ],
    "associatedFindings": ["finding1", "finding2"]
  },
  "riskFactors": ["risk1", "risk2"],
  "drugInteractions": [
    {
      "medication1": "drug1",
      "medication2": "drug2", 
      "severity": "minor|moderate|major",
      "description": "interaction description"
    }
  ],
  "contraindications": ["contraindication1"],
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": 0.85
}
`;
}

function createBasicContextualAnalysis(
  transcription: string,
  entities: MedicalEntity[],
  symptoms: Array<{ symptom: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number }>
): ContextualAnalysis {
  const medications = entities.filter(e => e.type === 'medication').map(e => e.text);
  const procedures = entities.filter(e => e.type === 'procedure').map(e => e.text);
  
  return {
    medicalHistory: {
      conditions: [],
      medications: medications,
      allergies: [],
      surgeries: procedures.filter(p => p.toLowerCase().includes('surgery') || p.toLowerCase().includes('operation'))
    },
    currentPresentation: {
      chiefComplaint: transcription.split('.')[0] || 'Not specified',
      symptoms: symptoms.map(s => ({
        symptom: s.symptom,
        duration: 'Not specified',
        severity: s.severity,
        progression: 'stable' as const
      })),
      associatedFindings: []
    },
    riskFactors: [],
    drugInteractions: [],
    contraindications: [],
    recommendations: ['Complete medical history review recommended'],
    confidence: 0.6
  };
}

/**
 * Analyzes medication interactions using known interaction database
 */
export function analyzeDrugInteractions(medications: string[]): Array<{
  medication1: string;
  medication2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}> {
  const interactions = [];
  
  // Common drug interaction patterns (simplified database)
  const knownInteractions = [
    {
      drugs: ['warfarin', 'aspirin'],
      severity: 'major' as const,
      description: 'Increased bleeding risk - monitor INR closely'
    },
    {
      drugs: ['metformin', 'alcohol'],
      severity: 'moderate' as const,
      description: 'Increased risk of lactic acidosis'
    },
    {
      drugs: ['lisinopril', 'potassium'],
      severity: 'moderate' as const,
      description: 'Risk of hyperkalemia - monitor potassium levels'
    },
    {
      drugs: ['simvastatin', 'amiodarone'],
      severity: 'major' as const,
      description: 'Increased risk of myopathy and rhabdomyolysis'
    }
  ];

  for (const interaction of knownInteractions) {
    const drug1 = medications.find(med => 
      med.toLowerCase().includes(interaction.drugs[0])
    );
    const drug2 = medications.find(med => 
      med.toLowerCase().includes(interaction.drugs[1])
    );

    if (drug1 && drug2) {
      interactions.push({
        medication1: drug1,
        medication2: drug2,
        severity: interaction.severity,
        description: interaction.description
      });
    }
  }

  return interactions;
}

/**
 * Identifies contraindications based on patient context
 */
export function identifyContraindications(
  medications: string[],
  conditions: string[],
  patientAge: number
): string[] {
  const contraindications = [];

  // Age-based contraindications
  if (patientAge > 65) {
    const elderlyRiskyMeds = ['diazepam', 'diphenhydramine', 'amitriptyline'];
    for (const med of medications) {
      if (elderlyRiskyMeds.some(risky => med.toLowerCase().includes(risky))) {
        contraindications.push(`${med} - use with caution in elderly patients`);
      }
    }
  }

  // Condition-based contraindications
  const conditionContraindications = [
    {
      condition: 'asthma',
      medications: ['propranolol', 'atenolol'],
      warning: 'Beta-blockers contraindicated in asthma'
    },
    {
      condition: 'kidney disease',
      medications: ['metformin', 'nsaid'],
      warning: 'Use with caution in renal impairment'
    },
    {
      condition: 'heart failure',
      medications: ['verapamil', 'diltiazem'],
      warning: 'Calcium channel blockers may worsen heart failure'
    }
  ];

  for (const contraindication of conditionContraindications) {
    const hasCondition = conditions.some(condition => 
      condition.toLowerCase().includes(contraindication.condition)
    );
    
    if (hasCondition) {
      const riskyMeds = medications.filter(med =>
        contraindication.medications.some(risky => 
          med.toLowerCase().includes(risky)
        )
      );
      
      for (const med of riskyMeds) {
        contraindications.push(`${med} - ${contraindication.warning}`);
      }
    }
  }

  return contraindications;
}

/**
 * Generates clinical recommendations based on contextual analysis
 */
export function generateClinicalRecommendations(
  analysis: ContextualAnalysis,
  patientAge: number
): string[] {
  const recommendations = [];

  // Drug interaction recommendations
  if (analysis.drugInteractions.length > 0) {
    const majorInteractions = analysis.drugInteractions.filter(i => i.severity === 'major');
    if (majorInteractions.length > 0) {
      recommendations.push('Review major drug interactions - consider alternative medications');
    }
  }

  // Age-specific recommendations
  if (patientAge > 65) {
    recommendations.push('Consider geriatric dosing adjustments');
    recommendations.push('Assess fall risk and cognitive function');
  }

  // Symptom progression recommendations
  const worseningSymptoms = analysis.currentPresentation.symptoms.filter(
    s => s.progression === 'worsening'
  );
  
  if (worseningSymptoms.length > 0) {
    recommendations.push('Close monitoring recommended for worsening symptoms');
  }

  // South African specific recommendations
  if (analysis.medicalHistory.conditions.some(c => 
    c.toLowerCase().includes('hiv') || c.toLowerCase().includes('tb')
  )) {
    recommendations.push('Consider HIV/TB co-management protocols');
  }

  return recommendations;
}