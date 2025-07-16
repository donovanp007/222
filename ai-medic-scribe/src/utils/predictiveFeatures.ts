import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";
import { Patient, Session } from "@/types";
import { extractMedicalEntities, MedicalEntity } from "./contentCategorization";

export interface AutoCompletionSuggestion {
  text: string;
  type: 'medication' | 'diagnosis' | 'procedure' | 'symptom' | 'general';
  confidence: number;
  context?: string;
  icd10Code?: string;
}

export interface DiagnosisPrediction {
  diagnosis: string;
  confidence: number;
  supportingEvidence: string[];
  differentialDiagnoses: string[];
  icd10Code?: string;
  recommendedTests?: string[];
}

export interface PredictiveAnalysis {
  autoCompletions: AutoCompletionSuggestion[];
  diagnosisPredictions: DiagnosisPrediction[];
  nextWordSuggestions: string[];
  templateRecommendations: string[];
}

/**
 * Smart auto-completion engine for medical terms
 */
export class MedicalAutoCompleter {
  private medicalTerms: Map<string, { category: string; frequency: number }> = new Map();
  private contextHistory: string[] = [];
  private maxHistoryLength = 50;

  constructor() {
    this.initializeMedicalTerms();
  }

  private initializeMedicalTerms() {
    // Common South African medical terms and medications
    const commonTerms = [
      // Medications
      { term: 'atorvastatin', category: 'medication', frequency: 0.9 },
      { term: 'metformin', category: 'medication', frequency: 0.9 },
      { term: 'lisinopril', category: 'medication', frequency: 0.8 },
      { term: 'amlodipine', category: 'medication', frequency: 0.8 },
      { term: 'omeprazole', category: 'medication', frequency: 0.7 },
      { term: 'aspirin 100mg daily', category: 'medication', frequency: 0.9 },
      { term: 'paracetamol 500mg', category: 'medication', frequency: 0.8 },
      { term: 'ibuprofen 400mg', category: 'medication', frequency: 0.7 },
      
      // Diagnoses common in South Africa
      { term: 'essential hypertension', category: 'diagnosis', frequency: 0.9 },
      { term: 'type 2 diabetes mellitus', category: 'diagnosis', frequency: 0.9 },
      { term: 'gastroesophageal reflux disease', category: 'diagnosis', frequency: 0.7 },
      { term: 'tuberculosis', category: 'diagnosis', frequency: 0.8 },
      { term: 'HIV positive', category: 'diagnosis', frequency: 0.7 },
      { term: 'acute upper respiratory tract infection', category: 'diagnosis', frequency: 0.8 },
      { term: 'allergic rhinitis', category: 'diagnosis', frequency: 0.6 },
      
      // Symptoms
      { term: 'chest pain', category: 'symptom', frequency: 0.8 },
      { term: 'shortness of breath', category: 'symptom', frequency: 0.8 },
      { term: 'palpitations', category: 'symptom', frequency: 0.7 },
      { term: 'headache', category: 'symptom', frequency: 0.9 },
      { term: 'dizziness', category: 'symptom', frequency: 0.7 },
      { term: 'fatigue', category: 'symptom', frequency: 0.8 },
      
      // Procedures
      { term: 'blood pressure measurement', category: 'procedure', frequency: 0.9 },
      { term: 'electrocardiogram', category: 'procedure', frequency: 0.7 },
      { term: 'chest X-ray', category: 'procedure', frequency: 0.8 },
      { term: 'full blood count', category: 'procedure', frequency: 0.8 },
      { term: 'urine dipstick', category: 'procedure', frequency: 0.7 }
    ];

    commonTerms.forEach(({ term, category, frequency }) => {
      this.medicalTerms.set(term.toLowerCase(), { category, frequency });
    });
  }

  getSuggestions(partialInput: string, context: string = ''): AutoCompletionSuggestion[] {
    const suggestions: AutoCompletionSuggestion[] = [];
    const inputLower = partialInput.toLowerCase().trim();

    if (inputLower.length < 2) return suggestions;

    // Direct term matching
    for (const [term, data] of this.medicalTerms) {
      if (term.startsWith(inputLower)) {
        suggestions.push({
          text: term,
          type: data.category as any,
          confidence: data.frequency,
          context: context
        });
      }
    }

    // Fuzzy matching for partial words
    for (const [term, data] of this.medicalTerms) {
      const words = term.split(' ');
      const lastWord = words[words.length - 1];
      
      if (lastWord.startsWith(inputLower) && !suggestions.find(s => s.text === term)) {
        suggestions.push({
          text: term,
          type: data.category as any,
          confidence: data.frequency * 0.8,
          context: context
        });
      }
    }

    // Context-aware suggestions
    const contextSuggestions = this.getContextAwareSuggestions(inputLower, context);
    suggestions.push(...contextSuggestions);

    // Sort by confidence and return top 10
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private getContextAwareSuggestions(input: string, context: string): AutoCompletionSuggestion[] {
    const suggestions: AutoCompletionSuggestion[] = [];
    const contextLower = context.toLowerCase();

    // If context mentions blood pressure, suggest related terms
    if (contextLower.includes('blood pressure') || contextLower.includes('hypertension')) {
      const bpRelated = [
        'lisinopril 10mg daily',
        'amlodipine 5mg daily',
        'hydrochlorothiazide 25mg daily'
      ];
      
      bpRelated.forEach(term => {
        if (term.toLowerCase().includes(input)) {
          suggestions.push({
            text: term,
            type: 'medication',
            confidence: 0.8,
            context: 'blood pressure management'
          });
        }
      });
    }

    // If context mentions diabetes, suggest related terms
    if (contextLower.includes('diabetes') || contextLower.includes('glucose')) {
      const diabetesRelated = [
        'metformin 500mg twice daily',
        'glimepiride 2mg daily',
        'insulin lispro'
      ];
      
      diabetesRelated.forEach(term => {
        if (term.toLowerCase().includes(input)) {
          suggestions.push({
            text: term,
            type: 'medication',
            confidence: 0.8,
            context: 'diabetes management'
          });
        }
      });
    }

    return suggestions;
  }

  updateContext(newText: string) {
    this.contextHistory.push(newText);
    if (this.contextHistory.length > this.maxHistoryLength) {
      this.contextHistory.shift();
    }
  }
}

/**
 * AI-powered diagnosis prediction engine
 */
export async function predictDiagnoses(
  symptoms: string[],
  patientHistory: Session[],
  patientData: Patient
): Promise<DiagnosisPrediction[]> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = createDiagnosisPredictionPrompt(symptoms, patientHistory, patientData);

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
            content: 'You are an expert South African medical AI specializing in diagnosis prediction. Consider local disease patterns including TB, HIV, diabetes, and hypertension prevalence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '');
    }
    
    const result = JSON.parse(content.trim());
    return result.predictions || [];
  } catch (error) {
    console.error('Diagnosis prediction failed:', error);
    return createFallbackDiagnosisPredictions(symptoms);
  }
}

function createDiagnosisPredictionPrompt(
  symptoms: string[],
  patientHistory: Session[],
  patientData: Patient
): string {
  const historyContext = patientHistory
    .slice(0, 3)
    .map(session => {
      const date = new Date(session.visitDate).toLocaleDateString();
      return `${date}: ${session.content.substring(0, 150)}...`;
    })
    .join('\n');

  return `
Predict possible diagnoses for this South African patient based on presenting symptoms and medical history.

PATIENT INFORMATION:
- Age: ${patientData.age}
- Medical Aid: ${patientData.medicalAid?.provider || 'Public healthcare'}

PRESENTING SYMPTOMS:
${symptoms.map(s => `- ${s}`).join('\n')}

RECENT MEDICAL HISTORY:
${historyContext || 'No recent history available'}

ANALYSIS REQUIREMENTS:
1. Consider South African disease prevalence (TB, HIV, diabetes, hypertension)
2. Provide differential diagnoses ranked by likelihood
3. Include supporting evidence for each diagnosis
4. Suggest appropriate diagnostic tests
5. Include relevant ICD-10-AM codes

Return ONLY valid JSON:
{
  "predictions": [
    {
      "diagnosis": "Primary diagnosis name",
      "confidence": 0.85,
      "supportingEvidence": ["symptom correlation", "patient history factors"],
      "differentialDiagnoses": ["alternative diagnosis 1", "alternative diagnosis 2"],
      "icd10Code": "ICD-10 code",
      "recommendedTests": ["test1", "test2"]
    }
  ]
}
`;
}

function createFallbackDiagnosisPredictions(symptoms: string[]): DiagnosisPrediction[] {
  const commonDiagnoses = [
    {
      diagnosis: 'Upper respiratory tract infection',
      confidence: 0.7,
      supportingEvidence: ['Common presenting symptoms'],
      differentialDiagnoses: ['Allergic rhinitis', 'Sinusitis'],
      icd10Code: 'J06.9',
      recommendedTests: ['Physical examination', 'Throat swab if indicated']
    }
  ];

  return commonDiagnoses;
}

/**
 * Next-word prediction for medical context
 */
export class MedicalNextWordPredictor {
  private medicalPhrases: Map<string, string[]> = new Map();

  constructor() {
    this.initializePhrases();
  }

  private initializePhrases() {
    const phrases = [
      { start: 'blood pressure', next: ['is', 'of', 'reading', 'measurement'] },
      { start: 'chest pain', next: ['on', 'with', 'radiating', 'described'] },
      { start: 'shortness of', next: ['breath', 'breathing'] },
      { start: 'take', next: ['medication', 'tablets', 'aspirin', 'paracetamol'] },
      { start: 'prescribe', next: ['medication', 'antibiotics', 'painkillers'] },
      { start: 'blood', next: ['pressure', 'sugar', 'test', 'glucose'] },
      { start: 'heart', next: ['rate', 'rhythm', 'sounds', 'murmur'] },
      { start: 'follow up', next: ['in', 'appointment', 'visit'] },
      { start: 'mg', next: ['daily', 'twice', 'once', 'three'] },
      { start: 'twice', next: ['daily', 'a', 'per'] }
    ];

    phrases.forEach(({ start, next }) => {
      this.medicalPhrases.set(start.toLowerCase(), next);
    });
  }

  predictNext(currentText: string): string[] {
    const words = currentText.toLowerCase().trim().split(/\s+/);
    
    // Check for exact phrase matches
    for (let i = 2; i >= 1; i--) {
      if (words.length >= i) {
        const phrase = words.slice(-i).join(' ');
        const predictions = this.medicalPhrases.get(phrase);
        if (predictions) {
          return predictions;
        }
      }
    }

    // Fallback to single word predictions
    const lastWord = words[words.length - 1];
    const predictions = this.medicalPhrases.get(lastWord);
    
    return predictions || [];
  }
}

/**
 * Template recommendation engine
 */
export function recommendTemplates(
  transcriptionContent: string,
  availableTemplates: string[]
): string[] {
  const content = transcriptionContent.toLowerCase();
  const recommendations: Array<{ template: string; score: number }> = [];

  // Template scoring based on content
  const templateIndicators = {
    'emergency': ['urgent', 'emergency', 'acute', 'severe', 'critical'],
    'follow-up': ['follow up', 'return', 'progress', 'monitoring'],
    'physical-exam': ['examination', 'physical', 'inspect', 'palpation'],
    'procedure': ['procedure', 'surgery', 'operation', 'injection'],
    'consultation': ['consult', 'assessment', 'evaluation', 'visit'],
    'discharge': ['discharge', 'home', 'stable', 'improved']
  };

  for (const template of availableTemplates) {
    const indicators = templateIndicators[template as keyof typeof templateIndicators] || [];
    let score = 0;

    for (const indicator of indicators) {
      if (content.includes(indicator)) {
        score += 1;
      }
    }

    if (score > 0) {
      recommendations.push({ template, score });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .map(r => r.template)
    .slice(0, 3);
}

/**
 * Complete predictive analysis
 */
export async function performPredictiveAnalysis(
  currentInput: string,
  context: string,
  patientData?: Patient,
  patientHistory?: Session[]
): Promise<PredictiveAnalysis> {
  const autoCompleter = new MedicalAutoCompleter();
  const nextWordPredictor = new MedicalNextWordPredictor();

  // Get auto-completion suggestions
  const autoCompletions = autoCompleter.getSuggestions(currentInput, context);

  // Get next word suggestions
  const nextWordSuggestions = nextWordPredictor.predictNext(context);

  // Extract symptoms for diagnosis prediction
  const entities = extractMedicalEntities(context);
  const symptoms = entities
    .filter(e => e.type === 'symptom')
    .map(e => e.text);

  // Get diagnosis predictions if we have patient data and symptoms
  let diagnosisPredictions: DiagnosisPrediction[] = [];
  if (patientData && patientHistory && symptoms.length > 0) {
    try {
      diagnosisPredictions = await predictDiagnoses(symptoms, patientHistory, patientData);
    } catch (error) {
      console.error('Diagnosis prediction failed:', error);
    }
  }

  // Get template recommendations
  const templateRecommendations = recommendTemplates(context, [
    'emergency', 'follow-up', 'physical-exam', 'procedure', 'consultation'
  ]);

  return {
    autoCompletions,
    diagnosisPredictions,
    nextWordSuggestions,
    templateRecommendations
  };
}