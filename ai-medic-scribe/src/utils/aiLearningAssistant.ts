import { Patient, Session } from '@/types';
import { MedicalEntity, extractMedicalEntities } from './contentCategorization';
import { performClinicalDecisionSupport } from './clinicalDecisionSupport';

export interface TreatmentRecommendation {
  id: string;
  category: 'medication' | 'procedure' | 'lifestyle' | 'follow-up' | 'referral' | 'investigation';
  title: string;
  description: string;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D'; // Evidence-based medicine levels
  confidenceScore: number; // 0-1
  safetyProfile: 'low-risk' | 'moderate-risk' | 'high-risk';
  contraindications: string[];
  alternatives: string[];
  costConsideration: {
    medicaidCovered: boolean;
    estimatedCost: string;
    costEffectiveness: 'high' | 'moderate' | 'low';
  };
  southAfricanGuidelines: {
    nhsGuideline: string;
    edlListed: boolean;
    localAvailability: 'readily-available' | 'limited' | 'specialist-only';
  };
}

export interface LearningInsight {
  id: string;
  type: 'clinical-pearls' | 'latest-research' | 'case-study' | 'guideline-update' | 'diagnostic-tip';
  title: string;
  content: string;
  source: string;
  relevanceScore: number; // 0-1
  tags: string[];
  readingTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DrugInteractionAlert {
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  drug1: string;
  drug2: string;
  mechanism: string;
  clinicalConsequence: string;
  management: string;
  references: string[];
}

export interface DiagnosticSuggestion {
  condition: string;
  probability: number; // 0-1
  keySymptoms: string[];
  differentialDiagnoses: string[];
  recommendedTests: Array<{
    test: string;
    urgency: 'immediate' | 'within-24h' | 'within-week' | 'routine';
    rationale: string;
  }>;
  redFlags: string[];
}

export interface AILearningResponse {
  treatmentRecommendations: TreatmentRecommendation[];
  learningInsights: LearningInsight[];
  drugInteractions: DrugInteractionAlert[];
  diagnosticSuggestions: DiagnosticSuggestion[];
  continuousLearning: {
    suggestedReading: string[];
    skillGaps: string[];
    improvementAreas: string[];
  };
}

class AILearningAssistant {
  private readonly knowledgeBase: Map<string, any> = new Map();
  private readonly interactionDatabase: DrugInteractionAlert[] = [];
  
  constructor() {
    this.initializeKnowledgeBase();
    this.loadDrugInteractions();
  }

  private initializeKnowledgeBase() {
    // South African medical guidelines and protocols
    this.knowledgeBase.set('hypertension', {
      firstLine: ['Hydrochlorothiazide', 'Amlodipine', 'Enalapril'],
      edlMedications: ['Hydrochlorothiazide 25mg', 'Amlodipine 5mg', 'Enalapril 10mg'],
      targets: { systolic: '<140', diastolic: '<90' },
      lifestyle: ['Low sodium diet', 'Regular exercise', 'Weight management']
    });

    this.knowledgeBase.set('diabetes', {
      firstLine: ['Metformin'],
      secondLine: ['Glimepiride', 'Insulin'],
      edlMedications: ['Metformin 500mg', 'Glimepiride 2mg', 'NPH Insulin'],
      targets: { hba1c: '<7%', fasting: '4-7 mmol/L' },
      monitoring: ['HbA1c every 3 months', 'Annual eye exam', 'Foot examination']
    });

    this.knowledgeBase.set('respiratory_infection', {
      viral: { treatment: 'Symptomatic care', duration: '7-10 days' },
      bacterial: { firstLine: 'Amoxicillin', alternative: 'Azithromycin' },
      edlAntibiotics: ['Amoxicillin 500mg', 'Azithromycin 250mg'],
      redFlags: ['Respiratory distress', 'High fever >38.5°C', 'Chest pain']
    });
  }

  private loadDrugInteractions() {
    this.interactionDatabase.push(
      {
        severity: 'major',
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        mechanism: 'Additive anticoagulant effects',
        clinicalConsequence: 'Increased bleeding risk',
        management: 'Avoid combination or monitor INR closely',
        references: ['SAMF Guidelines 2023']
      },
      {
        severity: 'contraindicated',
        drug1: 'ACE Inhibitor',
        drug2: 'Pregnancy',
        mechanism: 'Teratogenic effects',
        clinicalConsequence: 'Fetal developmental abnormalities',
        management: 'Discontinue immediately, use alternative',
        references: ['WHO Essential Medicines 2023']
      },
      {
        severity: 'moderate',
        drug1: 'Metformin',
        drug2: 'Contrast Media',
        mechanism: 'Reduced renal clearance',
        clinicalConsequence: 'Lactic acidosis risk',
        management: 'Hold metformin 48h before and after contrast',
        references: ['South African Diabetes Guidelines']
      }
    );
  }

  async generateRecommendations(
    currentContent: string,
    patientData: Patient,
    patientHistory: Session[],
    medicalEntities: MedicalEntity[]
  ): Promise<AILearningResponse> {
    const recommendations = await this.generateTreatmentRecommendations(
      currentContent, patientData, medicalEntities
    );
    
    const insights = await this.generateLearningInsights(
      currentContent, patientData, medicalEntities
    );
    
    const interactions = this.checkDrugInteractions(medicalEntities);
    
    const diagnostics = await this.generateDiagnosticSuggestions(
      currentContent, patientData, medicalEntities
    );
    
    const continuousLearning = this.assessContinuousLearning(
      currentContent, patientData, patientHistory
    );

    return {
      treatmentRecommendations: recommendations,
      learningInsights: insights,
      drugInteractions: interactions,
      diagnosticSuggestions: diagnostics,
      continuousLearning
    };
  }

  private async generateTreatmentRecommendations(
    content: string,
    patient: Patient,
    entities: MedicalEntity[]
  ): Promise<TreatmentRecommendation[]> {
    const recommendations: TreatmentRecommendation[] = [];
    
    // Analyze symptoms and conditions
    const symptoms = entities.filter(e => e.type === 'symptom');
    const conditions = entities.filter(e => e.type === 'condition');
    
    // Hypertension management
    if (this.containsKeywords(content.toLowerCase(), ['hypertension', 'high blood pressure', 'bp elevated'])) {
      const htnKnowledge = this.knowledgeBase.get('hypertension');
      
      recommendations.push({
        id: `rec-htn-${Date.now()}`,
        category: 'medication',
        title: 'First-line Hypertension Management',
        description: 'Consider thiazide diuretic or ACE inhibitor as first-line therapy',
        rationale: 'Evidence-based first-line therapy for hypertension in South African guidelines',
        evidenceLevel: 'A',
        confidenceScore: 0.9,
        safetyProfile: 'low-risk',
        contraindications: ['Pregnancy (ACE inhibitors)', 'Bilateral renal artery stenosis'],
        alternatives: ['Calcium channel blockers', 'Beta-blockers'],
        costConsideration: {
          medicaidCovered: true,
          estimatedCost: 'R50-150/month',
          costEffectiveness: 'high'
        },
        southAfricanGuidelines: {
          nhsGuideline: 'Essential Drug List 2023',
          edlListed: true,
          localAvailability: 'readily-available'
        }
      });
    }

    // Diabetes management
    if (this.containsKeywords(content.toLowerCase(), ['diabetes', 'blood sugar', 'glucose elevated'])) {
      recommendations.push({
        id: `rec-dm-${Date.now()}`,
        category: 'medication',
        title: 'Type 2 Diabetes First-line Treatment',
        description: 'Initiate Metformin 500mg twice daily with meals',
        rationale: 'Metformin is first-line therapy with proven cardiovascular benefits',
        evidenceLevel: 'A',
        confidenceScore: 0.95,
        safetyProfile: 'low-risk',
        contraindications: ['eGFR <30', 'Severe heart failure', 'Metabolic acidosis'],
        alternatives: ['DPP-4 inhibitors', 'SGLT-2 inhibitors'],
        costConsideration: {
          medicaidCovered: true,
          estimatedCost: 'R30-80/month',
          costEffectiveness: 'high'
        },
        southAfricanGuidelines: {
          nhsGuideline: 'SEMDSA Guidelines 2023',
          edlListed: true,
          localAvailability: 'readily-available'
        }
      });
    }

    // Respiratory tract infection
    if (this.containsKeywords(content.toLowerCase(), ['cough', 'sputum', 'respiratory', 'chest infection'])) {
      recommendations.push({
        id: `rec-rti-${Date.now()}`,
        category: 'investigation',
        title: 'Assess Need for Antibiotic Therapy',
        description: 'Consider bacterial vs viral etiology before prescribing antibiotics',
        rationale: 'Antibiotic stewardship to prevent resistance',
        evidenceLevel: 'A',
        confidenceScore: 0.8,
        safetyProfile: 'low-risk',
        contraindications: [],
        alternatives: ['Symptomatic care', 'Delayed antibiotic prescription'],
        costConsideration: {
          medicaidCovered: true,
          estimatedCost: 'R20-100/course',
          costEffectiveness: 'high'
        },
        southAfricanGuidelines: {
          nhsGuideline: 'Antimicrobial Stewardship Guidelines',
          edlListed: true,
          localAvailability: 'readily-available'
        }
      });
    }

    return recommendations;
  }

  private async generateLearningInsights(
    content: string,
    patient: Patient,
    entities: MedicalEntity[]
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    // Clinical pearls based on content
    if (this.containsKeywords(content.toLowerCase(), ['chest pain'])) {
      insights.push({
        id: `insight-cp-${Date.now()}`,
        type: 'clinical-pearls',
        title: 'Chest Pain Red Flags in Primary Care',
        content: 'Remember the "HEART" score for chest pain risk stratification: History, ECG, Age, Risk factors, Troponin. Scores ≥7 require urgent cardiology consultation.',
        source: 'European Society of Cardiology Guidelines 2023',
        relevanceScore: 0.9,
        tags: ['cardiology', 'emergency', 'risk-stratification'],
        readingTime: 2,
        difficulty: 'intermediate'
      });
    }

    if (this.containsKeywords(content.toLowerCase(), ['headache'])) {
      insights.push({
        id: `insight-ha-${Date.now()}`,
        type: 'diagnostic-tip',
        title: 'Secondary Headache Warning Signs',
        content: 'SNNOOP10 criteria for secondary headache: Systemic symptoms, Neurologic symptoms, Onset sudden, Older age (>50), Pattern change, Positional, Precipitated by Valsalva, Papilledema, Progressive, Pregnancy.',
        source: 'International Headache Society',
        relevanceScore: 0.85,
        tags: ['neurology', 'headache', 'red-flags'],
        readingTime: 3,
        difficulty: 'intermediate'
      });
    }

    // Add South African specific insights
    insights.push({
      id: `insight-sa-${Date.now()}`,
      type: 'guideline-update',
      title: 'Updated South African Essential Drug List',
      content: 'The 2023 EDL update includes new diabetes medications and revised antibiotic guidelines. Key changes: SGLT-2 inhibitors now available at tertiary level, updated tuberculosis treatment protocols.',
      source: 'National Department of Health SA',
      relevanceScore: 0.7,
      tags: ['policy', 'essential-drugs', 'south-africa'],
      readingTime: 5,
      difficulty: 'beginner'
    });

    return insights;
  }

  private checkDrugInteractions(entities: MedicalEntity[]): DrugInteractionAlert[] {
    const medications = entities.filter(e => e.type === 'medication').map(e => e.text.toLowerCase());
    const interactions: DrugInteractionAlert[] = [];
    
    for (const interaction of this.interactionDatabase) {
      const drug1Match = medications.some(med => 
        med.includes(interaction.drug1.toLowerCase()) || 
        interaction.drug1.toLowerCase().includes(med)
      );
      const drug2Match = medications.some(med => 
        med.includes(interaction.drug2.toLowerCase()) || 
        interaction.drug2.toLowerCase().includes(med)
      );
      
      if (drug1Match && drug2Match) {
        interactions.push(interaction);
      }
    }
    
    return interactions;
  }

  private async generateDiagnosticSuggestions(
    content: string,
    patient: Patient,
    entities: MedicalEntity[]
  ): Promise<DiagnosticSuggestion[]> {
    const suggestions: DiagnosticSuggestion[] = [];
    
    // Chest pain diagnostic algorithm
    if (this.containsKeywords(content.toLowerCase(), ['chest pain', 'chest discomfort'])) {
      suggestions.push({
        condition: 'Acute Coronary Syndrome',
        probability: 0.3,
        keySymptoms: ['chest pain', 'dyspnea', 'nausea'],
        differentialDiagnoses: ['Pulmonary embolism', 'Aortic dissection', 'Pneumothorax', 'GERD'],
        recommendedTests: [
          {
            test: 'ECG',
            urgency: 'immediate',
            rationale: 'Rule out STEMI and identify ischemic changes'
          },
          {
            test: 'Troponin',
            urgency: 'immediate',
            rationale: 'Cardiac biomarker for myocardial injury'
          },
          {
            test: 'Chest X-ray',
            urgency: 'within-24h',
            rationale: 'Rule out pneumothorax, pulmonary edema'
          }
        ],
        redFlags: ['Severe pain', 'Radiation to arm/jaw', 'Diaphoresis', 'Hemodynamic instability']
      });
    }

    // Dyspnea diagnostic suggestions
    if (this.containsKeywords(content.toLowerCase(), ['shortness of breath', 'dyspnea', 'breathing difficulty'])) {
      suggestions.push({
        condition: 'Heart Failure',
        probability: 0.4,
        keySymptoms: ['dyspnea', 'orthopnea', 'ankle swelling'],
        differentialDiagnoses: ['Pulmonary embolism', 'Pneumonia', 'Asthma exacerbation'],
        recommendedTests: [
          {
            test: 'BNP/NT-proBNP',
            urgency: 'within-24h',
            rationale: 'Heart failure biomarker'
          },
          {
            test: 'Echocardiogram',
            urgency: 'within-week',
            rationale: 'Assess cardiac function and structure'
          }
        ],
        redFlags: ['Acute severe dyspnea', 'Cyanosis', 'Altered consciousness']
      });
    }

    return suggestions;
  }

  private assessContinuousLearning(
    content: string,
    patient: Patient,
    history: Session[]
  ) {
    const suggestedReading: string[] = [];
    const skillGaps: string[] = [];
    const improvementAreas: string[] = [];

    // Analyze content complexity and suggest relevant learning
    if (this.containsKeywords(content.toLowerCase(), ['diabetes', 'insulin'])) {
      suggestedReading.push('Advanced Diabetes Management in Resource-Limited Settings');
      suggestedReading.push('Insulin Initiation and Titration Guidelines');
    }

    if (this.containsKeywords(content.toLowerCase(), ['hypertension', 'cardiovascular'])) {
      suggestedReading.push('Cardiovascular Risk Assessment in African Populations');
      skillGaps.push('Risk stratification tools usage');
    }

    // Assess documentation patterns
    const recentSessions = history.slice(-5);
    const hasIncompleteNotes = recentSessions.some(session => 
      !session.analysis?.templateCompletion || session.analysis.templateCompletion < 0.8
    );

    if (hasIncompleteNotes) {
      improvementAreas.push('Template completion consistency');
      suggestedReading.push('Effective Clinical Documentation Strategies');
    }

    return {
      suggestedReading,
      skillGaps,
      improvementAreas
    };
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }
}

export const aiLearningAssistant = new AILearningAssistant();

export async function getAIRecommendations(
  currentContent: string,
  patient: Patient,
  patientHistory: Session[]
): Promise<AILearningResponse> {
  const entities = extractMedicalEntities(currentContent);
  return aiLearningAssistant.generateRecommendations(
    currentContent,
    patient,
    patientHistory,
    entities
  );
}

export function getSouthAfricanMedicalContext(condition: string): any {
  const contextMap: Record<string, any> = {
    'hypertension': {
      prevalence: '28% in adult population',
      guidelines: 'Heart and Stroke Foundation SA',
      edlMedications: ['Hydrochlorothiazide', 'Amlodipine', 'Enalapril'],
      publicHealthcare: 'Chronic Disease Management Programme',
      cost: 'Free at public healthcare facilities'
    },
    'diabetes': {
      prevalence: '4.6% nationally, 8.1% in urban areas',
      guidelines: 'SEMDSA (Society for Endocrinology, Metabolism and Diabetes of SA)',
      edlMedications: ['Metformin', 'Glimepiride', 'NPH Insulin'],
      publicHealthcare: 'Chronic Disease Management Programme',
      complications: 'High rates of diabetic nephropathy and retinopathy'
    },
    'tuberculosis': {
      prevalence: 'World\'s 2nd highest TB burden',
      guidelines: 'National Tuberculosis Management Guidelines',
      treatment: 'DOTS (Directly Observed Treatment Short-course)',
      drugResistance: 'High rates of MDR-TB and XDR-TB',
      hivCoinfection: '60% TB patients are HIV positive'
    }
  };

  return contextMap[condition.toLowerCase()] || null;
}