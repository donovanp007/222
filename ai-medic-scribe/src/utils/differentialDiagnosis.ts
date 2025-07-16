/**
 * Advanced Differential Diagnosis and Treatment Protocol Engine
 * Implements clinical reasoning algorithms and evidence-based protocols
 */

import { Patient, Session } from '@/types';
import { MedicalEntity } from './contentCategorization';

export interface SymptomCluster {
  id: string;
  primarySymptoms: string[];
  associatedSymptoms: string[];
  redFlags: string[];
  timeline: 'acute' | 'subacute' | 'chronic';
  bodySystem: string[];
}

export interface DifferentialDiagnosis {
  condition: string;
  icd10Code: string;
  probability: number;
  likelihood: 'very-high' | 'high' | 'moderate' | 'low' | 'very-low';
  supportingFeatures: string[];
  opposingFeatures: string[];
  keyQuestions: string[];
  requiredInvestigations: Investigation[];
  emergencyLevel: 'immediate' | 'urgent' | 'soon' | 'routine';
  specialtyReferral?: string;
}

export interface Investigation {
  test: string;
  type: 'laboratory' | 'imaging' | 'procedure' | 'bedside';
  urgency: 'stat' | 'urgent' | 'routine';
  expectedResult: string;
  costCategory: 'basic' | 'moderate' | 'expensive';
  availability: 'primary-care' | 'district-hospital' | 'tertiary-care';
  saAvailability: 'public' | 'private' | 'both';
}

export interface TreatmentProtocol {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  setting: 'outpatient' | 'inpatient' | 'icu';
  primaryTreatment: Treatment[];
  alternativeTreatment: Treatment[];
  monitoring: MonitoringParameter[];
  followUp: FollowUpPlan;
  complications: ComplicationManagement[];
  patientEducation: string[];
}

export interface Treatment {
  type: 'medication' | 'procedure' | 'lifestyle' | 'supportive';
  intervention: string;
  dosage?: string;
  duration: string;
  instructions: string;
  contraindications: string[];
  sideEffects: string[];
  edlListed: boolean;
  saGuideline: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
}

export interface MonitoringParameter {
  parameter: string;
  frequency: string;
  target: string;
  method: string;
}

export interface FollowUpPlan {
  interval: string;
  assessment: string[];
  redFlags: string[];
  dischargeCriteria?: string[];
}

export interface ComplicationManagement {
  complication: string;
  recognition: string[];
  management: string;
  escalation: string;
}

export interface ClinicalReasoningResult {
  differentialDiagnoses: DifferentialDiagnosis[];
  recommendedProtocol: TreatmentProtocol | null;
  clinicalPriority: 'critical' | 'high' | 'medium' | 'low';
  reasoningSteps: string[];
  uncertaintyFactors: string[];
  nextSteps: string[];
}

class DifferentialDiagnosisEngine {
  private symptomClusters: SymptomCluster[] = [];
  private treatmentProtocols: Map<string, TreatmentProtocol[]> = new Map();
  private clinicalRules: Map<string, any> = new Map();

  constructor() {
    this.initializeSymptomClusters();
    this.initializeTreatmentProtocols();
    this.initializeClinicalRules();
  }

  private initializeSymptomClusters() {
    this.symptomClusters = [
      {
        id: 'chest-pain-cluster',
        primarySymptoms: ['chest pain', 'chest discomfort', 'chest pressure'],
        associatedSymptoms: ['dyspnea', 'nausea', 'sweating', 'arm pain', 'jaw pain'],
        redFlags: ['severe pain', 'radiation', 'diaphoresis', 'hemodynamic instability'],
        timeline: 'acute',
        bodySystem: ['cardiovascular', 'respiratory', 'gastrointestinal']
      },
      {
        id: 'dyspnea-cluster',
        primarySymptoms: ['shortness of breath', 'dyspnea', 'breathing difficulty'],
        associatedSymptoms: ['orthopnea', 'paroxysmal nocturnal dyspnea', 'ankle swelling', 'fatigue'],
        redFlags: ['acute severe dyspnea', 'cyanosis', 'altered consciousness'],
        timeline: 'acute',
        bodySystem: ['cardiovascular', 'respiratory']
      },
      {
        id: 'abdominal-pain-cluster',
        primarySymptoms: ['abdominal pain', 'stomach pain', 'belly pain'],
        associatedSymptoms: ['nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating'],
        redFlags: ['severe pain', 'rigid abdomen', 'peritoneal signs', 'hematemesis'],
        timeline: 'acute',
        bodySystem: ['gastrointestinal', 'genitourinary', 'gynecological']
      },
      {
        id: 'headache-cluster',
        primarySymptoms: ['headache', 'head pain', 'cephalgia'],
        associatedSymptoms: ['nausea', 'photophobia', 'neck stiffness', 'visual changes'],
        redFlags: ['sudden onset', 'worst headache ever', 'neurological deficit', 'fever'],
        timeline: 'acute',
        bodySystem: ['neurological', 'vascular', 'inflammatory']
      },
      {
        id: 'fever-cluster',
        primarySymptoms: ['fever', 'elevated temperature', 'hyperthermia'],
        associatedSymptoms: ['chills', 'malaise', 'myalgia', 'anorexia'],
        redFlags: ['high fever >39°C', 'altered consciousness', 'petechial rash', 'rigors'],
        timeline: 'acute',
        bodySystem: ['infectious', 'inflammatory', 'neoplastic']
      }
    ];
  }

  private initializeTreatmentProtocols() {
    // Acute Coronary Syndrome Protocol
    this.treatmentProtocols.set('acute-coronary-syndrome', [
      {
        condition: 'STEMI',
        severity: 'severe',
        setting: 'inpatient',
        primaryTreatment: [
          {
            type: 'medication',
            intervention: 'Aspirin',
            dosage: '300mg chewed, then 75mg daily',
            duration: 'Indefinite',
            instructions: 'Give immediately unless contraindicated',
            contraindications: ['Active bleeding', 'Severe bleeding risk'],
            sideEffects: ['GI bleeding', 'Tinnitus'],
            edlListed: true,
            saGuideline: 'SA Heart Association ACS Guidelines 2023',
            evidenceLevel: 'A'
          },
          {
            type: 'medication',
            intervention: 'Clopidogrel',
            dosage: '600mg loading, then 75mg daily',
            duration: '12 months minimum',
            instructions: 'Dual antiplatelet therapy',
            contraindications: ['Active bleeding'],
            sideEffects: ['Bleeding', 'Thrombotic thrombocytopenic purpura'],
            edlListed: true,
            saGuideline: 'SA Heart Association ACS Guidelines 2023',
            evidenceLevel: 'A'
          },
          {
            type: 'procedure',
            intervention: 'Primary PCI',
            dosage: 'Within 90 minutes',
            duration: 'Single procedure',
            instructions: 'Door-to-balloon time <90 minutes',
            contraindications: ['Patient refusal', 'Limited life expectancy'],
            sideEffects: ['Bleeding', 'Contrast nephropathy'],
            edlListed: false,
            saGuideline: 'National Guidelines for PCI',
            evidenceLevel: 'A'
          }
        ],
        alternativeTreatment: [
          {
            type: 'medication',
            intervention: 'Thrombolytic therapy',
            dosage: 'Tenecteplase weight-based',
            duration: 'Single dose',
            instructions: 'If PCI not available within 120 minutes',
            contraindications: ['Recent surgery', 'Active bleeding', 'Previous stroke'],
            sideEffects: ['Bleeding', 'ICH risk 0.5-1%'],
            edlListed: true,
            saGuideline: 'SA Heart Association Thrombolysis Guidelines',
            evidenceLevel: 'A'
          }
        ],
        monitoring: [
          {
            parameter: 'Cardiac enzymes',
            frequency: 'Every 8 hours x 3',
            target: 'Trending',
            method: 'Troponin I/T'
          },
          {
            parameter: 'ECG',
            frequency: 'Continuous monitoring',
            target: 'Resolution of ST elevation',
            method: '12-lead ECG'
          }
        ],
        followUp: {
          interval: '48-72 hours, then 1 week, 1 month, 3 months',
          assessment: ['Symptom assessment', 'Medication compliance', 'Lifestyle modifications'],
          redFlags: ['Recurrent chest pain', 'Heart failure symptoms', 'Arrhythmias']
        },
        complications: [
          {
            complication: 'Cardiogenic shock',
            recognition: ['Hypotension', 'Poor perfusion', 'Pulmonary edema'],
            management: 'Inotropes, mechanical support, urgent revascularization',
            escalation: 'ICU admission, cardiothoracic surgery consultation'
          }
        ],
        patientEducation: [
          'Medication compliance importance',
          'Activity restrictions for 1 week',
          'Cardiac rehabilitation referral',
          'Risk factor modification',
          'When to seek emergency care'
        ]
      }
    ]);

    // Heart Failure Protocol
    this.treatmentProtocols.set('heart-failure', [
      {
        condition: 'Acute heart failure',
        severity: 'moderate',
        setting: 'inpatient',
        primaryTreatment: [
          {
            type: 'medication',
            intervention: 'Furosemide',
            dosage: '40-80mg IV',
            duration: 'Until euvolemic',
            instructions: 'Monitor electrolytes and renal function',
            contraindications: ['Anuria', 'Severe dehydration'],
            sideEffects: ['Hypokalemia', 'Renal impairment'],
            edlListed: true,
            saGuideline: 'SA Heart Failure Guidelines 2023',
            evidenceLevel: 'A'
          },
          {
            type: 'medication',
            intervention: 'ACE inhibitor',
            dosage: 'Enalapril 2.5mg BD',
            duration: 'Long-term',
            instructions: 'Start low, titrate to maximum tolerated',
            contraindications: ['Bilateral renal artery stenosis', 'Pregnancy'],
            sideEffects: ['Cough', 'Hyperkalemia', 'Angioedema'],
            edlListed: true,
            saGuideline: 'SA Heart Failure Guidelines 2023',
            evidenceLevel: 'A'
          }
        ],
        alternativeTreatment: [
          {
            type: 'medication',
            intervention: 'ARB (if ACE intolerant)',
            dosage: 'Losartan 25mg daily',
            duration: 'Long-term',
            instructions: 'Alternative to ACE inhibitor',
            contraindications: ['Bilateral renal artery stenosis', 'Pregnancy'],
            sideEffects: ['Hyperkalemia', 'Dizziness'],
            edlListed: false,
            saGuideline: 'SA Heart Failure Guidelines 2023',
            evidenceLevel: 'A'
          }
        ],
        monitoring: [
          {
            parameter: 'Daily weight',
            frequency: 'Daily',
            target: 'Stable or decreasing',
            method: 'Calibrated scale'
          },
          {
            parameter: 'Urea and electrolytes',
            frequency: 'Daily during acute phase',
            target: 'Stable renal function',
            method: 'Laboratory'
          }
        ],
        followUp: {
          interval: '1 week, then monthly',
          assessment: ['Symptom control', 'Medication optimization', 'Fluid status'],
          redFlags: ['Worsening dyspnea', 'Weight gain >2kg', 'Syncope']
        },
        complications: [
          {
            complication: 'Acute pulmonary edema',
            recognition: ['Severe dyspnea', 'Pink frothy sputum', 'Bilateral crepitations'],
            management: 'High-dose IV diuretics, oxygen, consider BiPAP',
            escalation: 'ICU for ventilatory support'
          }
        ],
        patientEducation: [
          'Daily weight monitoring',
          'Fluid restriction 1.5-2L/day',
          'Salt restriction <2g/day',
          'Medication compliance',
          'Exercise as tolerated'
        ]
      }
    ]);

    // Diabetes Management Protocol
    this.treatmentProtocols.set('diabetes-mellitus', [
      {
        condition: 'Type 2 Diabetes - newly diagnosed',
        severity: 'mild',
        setting: 'outpatient',
        primaryTreatment: [
          {
            type: 'medication',
            intervention: 'Metformin',
            dosage: '500mg BD with meals',
            duration: 'Long-term',
            instructions: 'Start 500mg daily, increase to BD after 1 week',
            contraindications: ['eGFR <30', 'Severe heart failure', 'Metabolic acidosis'],
            sideEffects: ['GI upset', 'Lactic acidosis (rare)', 'B12 deficiency'],
            edlListed: true,
            saGuideline: 'SEMDSA Guidelines 2023',
            evidenceLevel: 'A'
          },
          {
            type: 'lifestyle',
            intervention: 'Diabetes education',
            dosage: 'Comprehensive program',
            duration: 'Ongoing',
            instructions: 'Structured diabetes education program',
            contraindications: [],
            sideEffects: [],
            edlListed: false,
            saGuideline: 'SEMDSA Guidelines 2023',
            evidenceLevel: 'A'
          }
        ],
        alternativeTreatment: [
          {
            type: 'medication',
            intervention: 'DPP-4 inhibitor',
            dosage: 'If metformin contraindicated',
            duration: 'Long-term',
            instructions: 'Consider if metformin not tolerated',
            contraindications: ['History of pancreatitis'],
            sideEffects: ['Upper respiratory tract infections'],
            edlListed: false,
            saGuideline: 'SEMDSA Guidelines 2023',
            evidenceLevel: 'B'
          }
        ],
        monitoring: [
          {
            parameter: 'HbA1c',
            frequency: 'Every 3 months until target, then 6 monthly',
            target: '<7% (<53 mmol/mol)',
            method: 'Laboratory'
          },
          {
            parameter: 'Blood pressure',
            frequency: 'Every visit',
            target: '<140/90 mmHg',
            method: 'Sphygmomanometer'
          }
        ],
        followUp: {
          interval: '1 month initially, then 3 monthly',
          assessment: ['Glycemic control', 'Complications screening', 'Lifestyle adherence'],
          redFlags: ['Hyperglycemic symptoms', 'Ketosis', 'Severe hypoglycemia']
        },
        complications: [
          {
            complication: 'Diabetic ketoacidosis',
            recognition: ['Hyperglycemia', 'Ketones', 'Acidosis', 'Dehydration'],
            management: 'IV fluids, insulin, electrolyte replacement',
            escalation: 'Hospital admission, endocrinology consultation'
          }
        ],
        patientEducation: [
          'Blood glucose monitoring',
          'Hypoglycemia recognition and treatment',
          'Foot care',
          'Dietary counseling',
          'Exercise recommendations'
        ]
      }
    ]);
  }

  private initializeClinicalRules() {
    // HEART Score for chest pain
    this.clinicalRules.set('heart-score', {
      name: 'HEART Score',
      purpose: 'Chest pain risk stratification',
      components: {
        history: { suspiciousHistory: 2, moderatelySuspicious: 1, slightlySuspicious: 0 },
        ecg: { significantSTDepression: 2, nonspecificRepolarization: 1, normal: 0 },
        age: { over65: 2, between45and65: 1, under45: 0 },
        riskFactors: { threePlus: 2, oneOrTwo: 1, none: 0 },
        troponin: { overThreeTimesNormal: 2, oneToThreeTimes: 1, normal: 0 }
      },
      interpretation: {
        lowRisk: { score: '0-3', risk: '<1.7%', action: 'Consider discharge with outpatient follow-up' },
        moderateRisk: { score: '4-6', risk: '12-16.6%', action: 'Admit for observation and further testing' },
        highRisk: { score: '7-10', risk: '>50%', action: 'Urgent cardiology consultation, consider immediate intervention' }
      }
    });

    // Ottawa Ankle Rules
    this.clinicalRules.set('ottawa-ankle', {
      name: 'Ottawa Ankle Rules',
      purpose: 'Ankle injury X-ray indication',
      criteria: {
        ankleXray: [
          'Bone tenderness at posterior edge or tip of lateral malleolus',
          'Bone tenderness at posterior edge or tip of medial malleolus',
          'Inability to bear weight both immediately and in ED (4 steps)'
        ],
        footXray: [
          'Bone tenderness at base of 5th metatarsal',
          'Bone tenderness at navicular',
          'Inability to bear weight both immediately and in ED (4 steps)'
        ]
      },
      sensitivity: '99%',
      specificity: '40%'
    });

    // Wells Score for DVT
    this.clinicalRules.set('wells-dvt', {
      name: 'Wells Score for DVT',
      purpose: 'Deep vein thrombosis probability',
      components: {
        activecancer: 1,
        paralysisParesis: 1,
        recentImmobilization: 1,
        localizedTenderness: 1,
        entireLegSwollen: 1,
        calfSwelling: 1,
        pittingEdema: 1,
        collateralVeins: 1,
        alternativeDiagnosis: -2
      },
      interpretation: {
        low: { score: '≤0', probability: '5%' },
        moderate: { score: '1-2', probability: '17%' },
        high: { score: '≥3', probability: '53%' }
      }
    });
  }

  public generateDifferentialDiagnosis(
    symptoms: string[],
    patientData: Patient,
    clinicalFindings: string[],
    timeline: string
  ): DifferentialDiagnosis[] {
    const differentials: DifferentialDiagnosis[] = [];

    // Identify relevant symptom clusters
    const relevantClusters = this.identifySymptomClusters(symptoms);

    for (const cluster of relevantClusters) {
      const clusterDifferentials = this.generateClusterDifferentials(
        cluster,
        symptoms,
        patientData,
        clinicalFindings,
        timeline
      );
      differentials.push(...clusterDifferentials);
    }

    // Sort by probability
    return differentials.sort((a, b) => b.probability - a.probability);
  }

  private identifySymptomClusters(symptoms: string[]): SymptomCluster[] {
    const relevantClusters: SymptomCluster[] = [];
    const normalizedSymptoms = symptoms.map(s => s.toLowerCase());

    for (const cluster of this.symptomClusters) {
      const matchScore = this.calculateClusterMatchScore(cluster, normalizedSymptoms);
      if (matchScore > 0.3) {
        relevantClusters.push(cluster);
      }
    }

    return relevantClusters;
  }

  private calculateClusterMatchScore(cluster: SymptomCluster, symptoms: string[]): number {
    let score = 0;
    let totalWeight = 0;

    // Primary symptoms have higher weight
    for (const primarySymptom of cluster.primarySymptoms) {
      totalWeight += 3;
      if (symptoms.some(s => s.includes(primarySymptom) || primarySymptom.includes(s))) {
        score += 3;
      }
    }

    // Associated symptoms have moderate weight
    for (const associatedSymptom of cluster.associatedSymptoms) {
      totalWeight += 1;
      if (symptoms.some(s => s.includes(associatedSymptom) || associatedSymptom.includes(s))) {
        score += 1;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private generateClusterDifferentials(
    cluster: SymptomCluster,
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[],
    timeline: string
  ): DifferentialDiagnosis[] {
    const differentials: DifferentialDiagnosis[] = [];

    switch (cluster.id) {
      case 'chest-pain-cluster':
        differentials.push(...this.generateChestPainDifferentials(symptoms, patient, clinicalFindings));
        break;
      case 'dyspnea-cluster':
        differentials.push(...this.generateDyspneaDifferentials(symptoms, patient, clinicalFindings));
        break;
      case 'abdominal-pain-cluster':
        differentials.push(...this.generateAbdominalPainDifferentials(symptoms, patient, clinicalFindings));
        break;
      case 'headache-cluster':
        differentials.push(...this.generateHeadacheDifferentials(symptoms, patient, clinicalFindings));
        break;
      case 'fever-cluster':
        differentials.push(...this.generateFeverDifferentials(symptoms, patient, clinicalFindings));
        break;
    }

    return differentials;
  }

  private generateChestPainDifferentials(
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[]
  ): DifferentialDiagnosis[] {
    const age = this.calculateAge(patient.dateOfBirth);
    const hasCardiacRiskFactors = this.assessCardiacRiskFactors(patient);

    return [
      {
        condition: 'Acute Coronary Syndrome',
        icd10Code: 'I20.9',
        probability: hasCardiacRiskFactors && age > 45 ? 0.4 : 0.2,
        likelihood: hasCardiacRiskFactors && age > 45 ? 'moderate' : 'low',
        supportingFeatures: [
          'Crushing chest pain',
          'Radiation to arm/jaw',
          'Associated dyspnea',
          'Diaphoresis'
        ],
        opposingFeatures: [
          'Sharp, stabbing pain',
          'Positional pain',
          'Very young age',
          'No risk factors'
        ],
        keyQuestions: [
          'Quality of pain (crushing vs sharp)?',
          'Radiation pattern?',
          'Exertional component?',
          'Response to nitroglycerin?'
        ],
        requiredInvestigations: [
          {
            test: 'ECG',
            type: 'bedside',
            urgency: 'stat',
            expectedResult: 'ST changes, Q waves',
            costCategory: 'basic',
            availability: 'primary-care',
            saAvailability: 'both'
          },
          {
            test: 'Troponin',
            type: 'laboratory',
            urgency: 'urgent',
            expectedResult: 'Elevated if MI',
            costCategory: 'moderate',
            availability: 'district-hospital',
            saAvailability: 'both'
          }
        ],
        emergencyLevel: 'immediate',
        specialtyReferral: 'Cardiology'
      },
      {
        condition: 'Pulmonary Embolism',
        icd10Code: 'I26.9',
        probability: 0.15,
        likelihood: 'low',
        supportingFeatures: [
          'Pleuritic chest pain',
          'Dyspnea',
          'Risk factors for VTE',
          'Hemoptysis'
        ],
        opposingFeatures: [
          'No risk factors',
          'Gradual onset',
          'No dyspnea'
        ],
        keyQuestions: [
          'Recent surgery/immobilization?',
          'Leg swelling/pain?',
          'Previous VTE?',
          'Contraceptive use?'
        ],
        requiredInvestigations: [
          {
            test: 'D-dimer',
            type: 'laboratory',
            urgency: 'urgent',
            expectedResult: 'Elevated (non-specific)',
            costCategory: 'moderate',
            availability: 'district-hospital',
            saAvailability: 'both'
          },
          {
            test: 'CT Pulmonary Angiogram',
            type: 'imaging',
            urgency: 'urgent',
            expectedResult: 'Filling defect',
            costCategory: 'expensive',
            availability: 'tertiary-care',
            saAvailability: 'both'
          }
        ],
        emergencyLevel: 'urgent'
      },
      {
        condition: 'Gastroesophageal Reflux',
        icd10Code: 'K21.9',
        probability: 0.3,
        likelihood: 'moderate',
        supportingFeatures: [
          'Burning quality',
          'Postprandial timing',
          'Response to antacids',
          'Associated heartburn'
        ],
        opposingFeatures: [
          'Severe intensity',
          'Associated dyspnea',
          'No relationship to meals'
        ],
        keyQuestions: [
          'Relationship to meals?',
          'Response to antacids?',
          'History of heartburn?',
          'Lying down worsens?'
        ],
        requiredInvestigations: [
          {
            test: 'Trial of PPI',
            type: 'procedure',
            urgency: 'routine',
            expectedResult: 'Symptom improvement',
            costCategory: 'basic',
            availability: 'primary-care',
            saAvailability: 'both'
          }
        ],
        emergencyLevel: 'routine'
      }
    ];
  }

  private generateDyspneaDifferentials(
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[]
  ): DifferentialDiagnosis[] {
    return [
      {
        condition: 'Heart Failure',
        icd10Code: 'I50.9',
        probability: 0.35,
        likelihood: 'moderate',
        supportingFeatures: [
          'Orthopnea',
          'Paroxysmal nocturnal dyspnea',
          'Ankle swelling',
          'Fatigue'
        ],
        opposingFeatures: [
          'Acute onset',
          'No cardiac history',
          'Normal heart sounds'
        ],
        keyQuestions: [
          'Sleep with how many pillows?',
          'Ankle swelling?',
          'Previous heart problems?',
          'Exercise tolerance?'
        ],
        requiredInvestigations: [
          {
            test: 'BNP/NT-proBNP',
            type: 'laboratory',
            urgency: 'urgent',
            expectedResult: 'Elevated',
            costCategory: 'moderate',
            availability: 'district-hospital',
            saAvailability: 'both'
          },
          {
            test: 'Echocardiogram',
            type: 'imaging',
            urgency: 'routine',
            expectedResult: 'Reduced ejection fraction',
            costCategory: 'moderate',
            availability: 'district-hospital',
            saAvailability: 'both'
          }
        ],
        emergencyLevel: 'soon',
        specialtyReferral: 'Cardiology'
      }
    ];
  }

  private generateAbdominalPainDifferentials(
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[]
  ): DifferentialDiagnosis[] {
    // Implementation for abdominal pain differentials
    return [];
  }

  private generateHeadacheDifferentials(
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[]
  ): DifferentialDiagnosis[] {
    // Implementation for headache differentials
    return [];
  }

  private generateFeverDifferentials(
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[]
  ): DifferentialDiagnosis[] {
    // Implementation for fever differentials
    return [];
  }

  public generateTreatmentProtocol(
    diagnosis: string,
    severity: string,
    patientFactors: any
  ): TreatmentProtocol | null {
    const protocols = this.treatmentProtocols.get(diagnosis.toLowerCase());
    if (!protocols) return null;

    return protocols.find(p => 
      p.condition.toLowerCase().includes(diagnosis.toLowerCase()) &&
      p.severity === severity
    ) || protocols[0];
  }

  public performClinicalReasoning(
    presentingComplaint: string,
    symptoms: string[],
    patient: Patient,
    clinicalFindings: string[],
    investigations: any[]
  ): ClinicalReasoningResult {
    const reasoningSteps: string[] = [];
    const uncertaintyFactors: string[] = [];

    // Step 1: Pattern recognition
    reasoningSteps.push('Pattern recognition: Analyzing symptom clusters and clinical presentation');
    const differentials = this.generateDifferentialDiagnosis(symptoms, patient, clinicalFindings, 'acute');

    // Step 2: Apply clinical rules
    reasoningSteps.push('Applying validated clinical decision rules where applicable');
    
    // Step 3: Risk stratification
    reasoningSteps.push('Risk stratification based on patient factors and presentation');
    const clinicalPriority = this.assessClinicalPriority(differentials, patient);

    // Step 4: Identify uncertainties
    if (differentials.length > 3) {
      uncertaintyFactors.push('Multiple equiprobable diagnoses require further investigation');
    }

    // Step 5: Next steps
    const nextSteps = this.generateNextSteps(differentials);

    return {
      differentialDiagnoses: differentials,
      recommendedProtocol: differentials.length > 0 ? 
        this.generateTreatmentProtocol(differentials[0].condition, 'moderate', patient) : null,
      clinicalPriority,
      reasoningSteps,
      uncertaintyFactors,
      nextSteps
    };
  }

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private assessCardiacRiskFactors(patient: Patient): boolean {
    // Simplified risk factor assessment
    const age = this.calculateAge(patient.dateOfBirth);
    return age > 45 || patient.medicalHistory?.includes('diabetes') || 
           patient.medicalHistory?.includes('hypertension');
  }

  private assessClinicalPriority(
    differentials: DifferentialDiagnosis[],
    patient: Patient
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (differentials.some(d => d.emergencyLevel === 'immediate')) {
      return 'critical';
    }
    if (differentials.some(d => d.emergencyLevel === 'urgent')) {
      return 'high';
    }
    if (differentials.some(d => d.emergencyLevel === 'soon')) {
      return 'medium';
    }
    return 'low';
  }

  private generateNextSteps(differentials: DifferentialDiagnosis[]): string[] {
    const nextSteps: string[] = [];
    
    if (differentials.length > 0) {
      const topDifferential = differentials[0];
      nextSteps.push(`Obtain ${topDifferential.requiredInvestigations[0]?.test} to evaluate ${topDifferential.condition}`);
      
      if (topDifferential.specialtyReferral) {
        nextSteps.push(`Consider ${topDifferential.specialtyReferral} referral`);
      }
    }

    return nextSteps;
  }
}

export const differentialDiagnosisEngine = new DifferentialDiagnosisEngine();

export function performClinicalReasoning(
  presentingComplaint: string,
  symptoms: string[],
  patient: Patient,
  clinicalFindings: string[] = [],
  investigations: any[] = []
): ClinicalReasoningResult {
  return differentialDiagnosisEngine.performClinicalReasoning(
    presentingComplaint,
    symptoms,
    patient,
    clinicalFindings,
    investigations
  );
}

export function generateTreatmentProtocol(
  diagnosis: string,
  severity: 'mild' | 'moderate' | 'severe' = 'moderate',
  patientFactors: any = {}
): TreatmentProtocol | null {
  return differentialDiagnosisEngine.generateTreatmentProtocol(diagnosis, severity, patientFactors);
}