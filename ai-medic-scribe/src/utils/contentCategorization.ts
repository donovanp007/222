import { SectionType, TemplateSection, Template } from "@/types/template";
import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";
import { trackCategorization } from "./apiUsageTracker";

// Enhanced medical terminology with medications, devices, and procedures
const MEDICAL_KEYWORDS = {
  symptoms: [
    'pain', 'ache', 'hurt', 'sore', 'tender', 'burning', 'sharp', 'dull', 'throbbing',
    'nausea', 'vomiting', 'fever', 'chills', 'sweating', 'fatigue', 'tired', 'weak',
    'headache', 'migraine', 'dizziness', 'dizzy', 'lightheaded', 'faint',
    'cough', 'shortness of breath', 'difficulty breathing', 'wheezing', 'chest tightness',
    'rash', 'itching', 'swelling', 'numbness', 'tingling', 'cramping',
    'constipation', 'diarrhea', 'bloating', 'heartburn', 'indigestion',
    'blurred vision', 'double vision', 'hearing loss', 'tinnitus', 'ear pain',
    'joint pain', 'muscle pain', 'back pain', 'neck pain', 'stiffness',
    'sleep problems', 'insomnia', 'anxiety', 'depression', 'mood changes',
    'weight loss', 'weight gain', 'appetite loss', 'increased appetite',
    'palpitations', 'irregular heartbeat', 'chest pain', 'syncope', 'presyncope'
  ],
  
  diagnosis: [
    'diagnosis', 'diagnosed with', 'condition', 'disease', 'disorder', 'syndrome',
    'infection', 'bacterial', 'viral', 'fungal', 'inflammation', 'inflammatory',
    'acute', 'chronic', 'suspected', 'confirmed', 'probable', 'possible',
    'hypertension', 'diabetes', 'asthma', 'pneumonia', 'bronchitis', 'sinusitis',
    'arthritis', 'osteoporosis', 'fracture', 'sprain', 'strain', 'laceration',
    'gastritis', 'ulcer', 'reflux', 'IBS', 'UTI', 'kidney stones',
    'migraine', 'tension headache', 'anxiety disorder', 'depression',
    'hyperlipidemia', 'hypothyroidism', 'hyperthyroidism', 'anemia',
    'malignancy', 'benign', 'tumor', 'mass', 'nodule', 'cyst'
  ],
  
  treatment: [
    'prescribe', 'prescribed', 'medication', 'medicine', 'drug', 'tablet', 'capsule',
    'mg', 'grams', 'ml', 'dose', 'dosage', 'twice daily', 'once daily', 'three times',
    'antibiotic', 'pain killer', 'analgesic', 'anti-inflammatory', 'steroid',
    'surgery', 'operation', 'procedure', 'treatment', 'therapy', 'rehabilitation',
    'physical therapy', 'occupational therapy', 'counseling', 'psychotherapy',
    'lifestyle changes', 'diet', 'exercise', 'rest', 'ice', 'heat', 'compression',
    'referral', 'specialist', 'consultation', 'second opinion',
    'injection', 'infusion', 'IV', 'topical', 'ointment', 'cream', 'gel',
    'inhaler', 'nebulizer', 'oxygen', 'CPAP', 'splint', 'cast', 'brace',
    'aspirin', 'paracetamol', 'ibuprofen', 'warfarin', 'metformin', 'lisinopril',
    'amlodipine', 'atorvastatin', 'omeprazole', 'losartan', 'simvastatin',
    'salbutamol', 'prednisolone', 'amoxicillin', 'doxycycline', 'furosemide'
  ],

  medications: [
    'tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'ointment',
    'mg', 'mcg', 'ml', 'units', 'dose', 'twice daily', 'bd', 'once daily', 'od',
    'three times daily', 'tds', 'four times daily', 'qds', 'prn', 'stat',
    'aspirin', 'paracetamol', 'acetaminophen', 'ibuprofen', 'diclofenac',
    'warfarin', 'heparin', 'metformin', 'insulin', 'glimepiride',
    'lisinopril', 'enalapril', 'amlodipine', 'nifedipine', 'atenolol',
    'atorvastatin', 'simvastatin', 'omeprazole', 'lansoprazole', 'ranitidine',
    'salbutamol', 'beclomethasone', 'prednisolone', 'hydrocortisone',
    'amoxicillin', 'doxycycline', 'ciprofloxacin', 'azithromycin',
    'furosemide', 'hydrochlorothiazide', 'spironolactone'
  ],

  medical_devices: [
    'stethoscope', 'blood pressure cuff', 'thermometer', 'pulse oximeter',
    'ECG machine', 'defibrillator', 'pacemaker', 'insulin pump',
    'hearing aid', 'CPAP machine', 'ventilator', 'oxygen concentrator',
    'nebulizer', 'inhaler', 'spacer device', 'peak flow meter',
    'glucometer', 'blood glucose monitor', 'wheelchair', 'walker',
    'crutches', 'compression stockings', 'tens unit', 'ultrasound',
    'X-ray machine', 'MRI scanner', 'CT scanner', 'catheter',
    'stent', 'prosthesis', 'orthotic device', 'brace', 'splint'
  ],

  procedures: [
    'blood test', 'urine test', 'ECG', 'EKG', 'echocardiogram', 'stress test',
    'X-ray', 'ultrasound', 'CT scan', 'MRI scan', 'mammogram', 'colonoscopy',
    'endoscopy', 'biopsy', 'surgery', 'operation', 'angioplasty', 'bypass',
    'catheterization', 'dialysis', 'chemotherapy', 'radiotherapy',
    'physiotherapy', 'occupational therapy', 'vaccination', 'immunization',
    'injection', 'infusion', 'transfusion', 'intubation', 'tracheostomy',
    'appendectomy', 'cholecystectomy', 'hysterectomy', 'arthroscopy',
    'lumbar puncture', 'bone marrow biopsy', 'skin graft', 'wound suturing'
  ],
  
  vitals: [
    'blood pressure', 'BP', 'systolic', 'diastolic', 'mmHg',
    'heart rate', 'HR', 'pulse', 'beats per minute', 'bpm', 'rhythm',
    'temperature', 'temp', 'fever', 'celsius', 'fahrenheit', 'degrees',
    'respiratory rate', 'RR', 'breathing rate', 'breaths per minute',
    'oxygen saturation', 'O2 sat', 'SpO2', 'pulse ox',
    'weight', 'kg', 'pounds', 'lbs', 'BMI', 'body mass index',
    'height', 'cm', 'inches', 'feet', 'tall', 'short'
  ],
  
  history: [
    'history', 'previous', 'past', 'prior', 'family history', 'medical history',
    'surgical history', 'allergies', 'allergic to', 'adverse reaction',
    'current medications', 'taking', 'on medication', 'chronic condition',
    'hospitalization', 'hospital', 'admission', 'surgery', 'operation',
    'mother', 'father', 'sibling', 'parent', 'grandparent', 'family member',
    'genetic', 'hereditary', 'runs in family', 'family history of',
    'smoking', 'alcohol', 'drugs', 'substance use', 'social history'
  ],
  
  examination: [
    'examination', 'exam', 'inspect', 'inspection', 'observe', 'observation',
    'palpation', 'palpate', 'feel', 'touch', 'pressure',
    'auscultation', 'listen', 'heart sounds', 'lung sounds', 'bowel sounds',
    'percussion', 'tap', 'dull', 'resonant', 'tympanic',
    'normal', 'abnormal', 'unremarkable', 'remarkable', 'significant',
    'tender', 'non-tender', 'soft', 'firm', 'hard', 'enlarged', 'swollen',
    'symmetrical', 'asymmetrical', 'equal', 'unequal', 'bilateral',
    'clear', 'cloudy', 'red', 'pale', 'cyanotic', 'jaundiced',
    'range of motion', 'ROM', 'flexibility', 'strength', 'weakness',
    'reflexes', 'sensation', 'numbness', 'tingling', 'coordination'
  ],
  
  plan: [
    'plan', 'follow-up', 'return', 'come back', 'schedule', 'appointment',
    'next visit', 'recheck', 'monitor', 'watch', 'observe', 'track',
    'continue', 'stop', 'discontinue', 'increase', 'decrease', 'adjust',
    'lab work', 'blood test', 'urine test', 'X-ray', 'MRI', 'CT scan',
    'ultrasound', 'EKG', 'ECG', 'stress test', 'colonoscopy', 'mammogram',
    'education', 'instruct', 'teach', 'explain', 'discuss', 'counsel',
    'warning signs', 'red flags', 'when to call', 'emergency', 'urgent',
    'prognosis', 'outlook', 'expected', 'recovery', 'healing'
  ]
};

// Scoring weights for different factors
const SCORING_WEIGHTS = {
  exactKeywordMatch: 3,
  partialKeywordMatch: 2,
  contextualClues: 1,
  positionInText: 0.5
};

/**
 * Categorizes medical text content into appropriate template sections
 * Uses rule-based keyword matching and contextual analysis
 */
export function categorizeContent(text: string, availableSections: TemplateSection[]): {
  sectionId: string;
  confidence: number;
  suggestedContent: string;
}[] {
  if (!text || !text.trim()) return [];
  
  const sentences = splitIntoSentences(text);
  const results: Array<{
    sectionId: string;
    confidence: number;
    suggestedContent: string;
  }> = [];
  
  for (const sentence of sentences) {
    const categorization = categorizeSentence(sentence, availableSections);
    if (categorization && categorization.confidence > 0.3) {
      results.push(categorization);
    }
  }
  
  // Group similar sentences together
  return groupBySections(results);
}

/**
 * Categorizes a single sentence into the most appropriate section
 */
function categorizeSentence(sentence: string, availableSections: TemplateSection[]): {
  sectionId: string;
  confidence: number;
  suggestedContent: string;
} | null {
  const normalizedSentence = sentence.toLowerCase().trim();
  if (!normalizedSentence) return null;
  
  let bestMatch = {
    sectionId: '',
    confidence: 0,
    suggestedContent: sentence
  };
  
  for (const section of availableSections) {
    const score = calculateSectionScore(normalizedSentence, section);
    if (score > bestMatch.confidence) {
      bestMatch = {
        sectionId: section.id,
        confidence: score,
        suggestedContent: sentence
      };
    }
  }
  
  return bestMatch.confidence > 0 ? bestMatch : null;
}

/**
 * Calculates how well a sentence matches a particular section
 */
function calculateSectionScore(sentence: string, section: TemplateSection): number {
  let score = 0;
  const sectionType = section.type as SectionType;
  const keywords = (sectionType in MEDICAL_KEYWORDS) ? MEDICAL_KEYWORDS[sectionType as keyof typeof MEDICAL_KEYWORDS] : [];
  const sectionKeywords = section.keywords || [];
  const allKeywords = [...keywords, ...sectionKeywords];
  
  // Check for exact keyword matches
  for (const keyword of allKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (sentence.includes(keywordLower)) {
      // Exact match gets higher score
      if (sentence.includes(` ${keywordLower} `) || 
          sentence.startsWith(keywordLower) || 
          sentence.endsWith(keywordLower)) {
        score += SCORING_WEIGHTS.exactKeywordMatch;
      } else {
        score += SCORING_WEIGHTS.partialKeywordMatch;
      }
    }
  }
  
  // Check for contextual patterns
  score += getContextualScore(sentence, sectionType);
  
  // Normalize score by sentence length and keyword count
  const normalizedScore = Math.min(score / Math.max(allKeywords.length * 0.1, 1), 1);
  
  return normalizedScore;
}

/**
 * Gets additional scoring based on contextual patterns
 */
function getContextualScore(sentence: string, sectionType: SectionType): number {
  let score = 0;
  
  switch (sectionType) {
    case 'symptoms':
      if (sentence.includes('complain') || sentence.includes('report') || 
          sentence.includes('feel') || sentence.includes('experience')) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
      
    case 'diagnosis':
      if (sentence.includes('assess') || sentence.includes('diagnos') || 
          sentence.includes('condition') || sentence.includes('impression')) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
      
    case 'treatment':
      if (sentence.includes('recommend') || sentence.includes('prescrib') || 
          sentence.includes('treat') || sentence.includes('therapy')) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
      
    case 'vitals':
      if (/\d+\/\d+/.test(sentence) || // Blood pressure pattern
          /\d+\s*(bpm|mmhg|degrees|kg|lbs)/.test(sentence)) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
      
    case 'examination':
      if (sentence.includes('exam') || sentence.includes('find') || 
          sentence.includes('appear') || sentence.includes('normal')) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
      
    case 'plan':
      if (sentence.includes('follow') || sentence.includes('return') || 
          sentence.includes('next') || sentence.includes('continue')) {
        score += SCORING_WEIGHTS.contextualClues;
      }
      break;
  }
  
  return score;
}

/**
 * Splits text into sentences for better categorization
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments
}

/**
 * Groups categorized sentences by their assigned sections
 */
function groupBySections(results: Array<{
  sectionId: string;
  confidence: number;
  suggestedContent: string;
}>): Array<{
  sectionId: string;
  confidence: number;
  suggestedContent: string;
}> {
  const grouped = new Map<string, {
    sectionId: string;
    confidence: number;
    content: string[];
  }>();
  
  for (const result of results) {
    const existing = grouped.get(result.sectionId);
    if (existing) {
      existing.content.push(result.suggestedContent);
      existing.confidence = Math.max(existing.confidence, result.confidence);
    } else {
      grouped.set(result.sectionId, {
        sectionId: result.sectionId,
        confidence: result.confidence,
        content: [result.suggestedContent]
      });
    }
  }
  
  return Array.from(grouped.values()).map(group => ({
    sectionId: group.sectionId,
    confidence: group.confidence,
    suggestedContent: group.content.join(' ')
  }));
}

/**
 * Suggests the best template based on content analysis
 */
export function suggestTemplate(text: string, availableTemplates: Template[]): {
  templateId: string;
  confidence: number;
  reasoning: string;
} | null {
  if (!text || !availableTemplates.length) return null;
  
  const textLower = text.toLowerCase();
  let bestMatch = { templateId: '', confidence: 0, reasoning: '' };
  
  for (const template of availableTemplates) {
    let score = 0;
    const reasons: string[] = [];
    
    // Check for template-specific keywords
    switch (template.id) {
      case 'emergency':
        if (textLower.includes('emergency') || textLower.includes('urgent') || 
            textLower.includes('severe') || textLower.includes('acute')) {
          score += 0.4;
          reasons.push('emergency keywords detected');
        }
        break;
        
      case 'follow-up':
        if (textLower.includes('follow') || textLower.includes('return') || 
            textLower.includes('progress') || textLower.includes('better')) {
          score += 0.4;
          reasons.push('follow-up indicators found');
        }
        break;
        
      case 'physical-exam':
        if (textLower.includes('examination') || textLower.includes('physical') || 
            textLower.includes('inspect') || textLower.includes('palpat')) {
          score += 0.4;
          reasons.push('examination terminology present');
        }
        break;
        
      case 'procedure':
        if (textLower.includes('procedure') || textLower.includes('surgery') || 
            textLower.includes('operation') || textLower.includes('inject')) {
          score += 0.4;
          reasons.push('procedure-related content');
        }
        break;
    }
    
    // Add points for comprehensive content
    const sectionMatches = template.sections.filter((section: TemplateSection) => {
      const sectionType = section.type as SectionType;
      const sectionKeywords = (sectionType in MEDICAL_KEYWORDS) ? MEDICAL_KEYWORDS[sectionType as keyof typeof MEDICAL_KEYWORDS] : [];
      return sectionKeywords.some(keyword => textLower.includes(keyword.toLowerCase()));
    });
    
    score += (sectionMatches.length / template.sections.length) * 0.3;
    if (sectionMatches.length > 2) {
      reasons.push(`matches ${sectionMatches.length} sections`);
    }
    
    if (score > bestMatch.confidence) {
      bestMatch = {
        templateId: template.id,
        confidence: score,
        reasoning: reasons.join(', ')
      };
    }
  }
  
  return bestMatch.confidence > 0.2 ? bestMatch : null;
}

/**
 * Enhanced AI-powered content categorization using Claude/OpenAI API
 * Analyzes medical transcription and categorizes content into template sections
 * Also adds relevant ICD-10 codes for symptoms and diagnoses
 */
export async function aiCategorizeContent(
  transcription: string, 
  template: Template
): Promise<{
  categorizations: Array<{
    sectionId: string;
    content: string;
    confidence: number;
    icd10Codes?: Array<{ code: string; description: string; }>;
  }>;
  summary: string;
}> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = createCategorizationPrompt(transcription, template);
  const selectedModel = getSelectedAIModel();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: selectedModel === 'gpt-3.5-turbo' ? 1500 : 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Track API usage
    trackCategorization(transcription.length);
    
    return result;
  } catch (error) {
    console.error('AI categorization failed:', error);
    throw error;
  }
}

/**
 * Creates a detailed prompt for AI-powered content categorization
 */
function createCategorizationPrompt(transcription: string, template: Template): string {
  const sectionsDescription = template.sections.map(section => 
    `- ${section.title} (${section.type}): ${section.placeholder}`
  ).join('\n');

  return `
You are a medical AI assistant specializing in clinical documentation. Analyze the following medical transcription and categorize the content into the appropriate template sections. Also provide relevant ICD-10 codes where applicable.

Transcription to analyze:
"${transcription}"

Template sections available:
${sectionsDescription}

Instructions:
1. Carefully read the transcription and identify medical content
2. Categorize each relevant piece of information into the most appropriate section
3. For symptoms and diagnoses, include relevant ICD-10 codes with descriptions
4. Maintain the exact wording from the transcription when possible
5. Only include content that clearly belongs to a section
6. Provide a confidence score (0-1) for each categorization
7. Create a brief summary of the key medical points

Return your response as a JSON object with this exact structure:
{
  "categorizations": [
    {
      "sectionId": "section_id_from_template",
      "content": "extracted content from transcription",
      "confidence": 0.95,
      "icd10Codes": [
        {
          "code": "R50.9",
          "description": "Fever, unspecified"
        }
      ]
    }
  ],
  "summary": "Brief summary of key medical findings and recommendations"
}

Notes:
- Only include icd10Codes for sections related to symptoms, diagnoses, or conditions
- Use the most specific ICD-10 codes available
- Confidence should reflect how certain you are about the categorization
- Preserve medical terminology and exact phrases from the original transcription
- If no relevant content is found for a section, don't include it in the response
`;
}

/**
 * Enhanced medical entity extraction with detailed recognition
 */
export interface MedicalEntity {
  type: 'medication' | 'procedure' | 'device' | 'vital' | 'symptom' | 'diagnosis';
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  details?: {
    dosage?: string;
    frequency?: string;
    route?: string;
    severity?: string;
    value?: string;
    unit?: string;
  };
}

export function extractMedicalEntities(text: string): MedicalEntity[] {
  const entities: MedicalEntity[] = [];
  const textLower = text.toLowerCase();

  // Extract medications with dosage patterns
  const medicationRegex = /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|ml|units?|tablets?)\s*(once|twice|three times?|bd|od|tds|qds)?\s*(daily|a day|per day)?/gi;
  let match;
  
  while ((match = medicationRegex.exec(text)) !== null) {
    entities.push({
      type: 'medication',
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 0.9,
      details: {
        dosage: `${match[2]} ${match[3]}`,
        frequency: match[4] || match[5] || 'as needed'
      }
    });
  }

  // Extract vital signs with values
  const vitalPatterns = [
    { pattern: /blood pressure\s+(\d+)\/(\d+)\s*(mmhg)?/gi, type: 'vital' as const },
    { pattern: /bp\s+(\d+)\/(\d+)/gi, type: 'vital' as const },
    { pattern: /heart rate\s+(\d+)\s*(bpm)?/gi, type: 'vital' as const },
    { pattern: /hr\s+(\d+)/gi, type: 'vital' as const },
    { pattern: /temperature\s+(\d+(?:\.\d+)?)\s*(°c|celsius|°f|fahrenheit)?/gi, type: 'vital' as const },
    { pattern: /temp\s+(\d+(?:\.\d+)?)/gi, type: 'vital' as const },
    { pattern: /oxygen saturation\s+(\d+)%?/gi, type: 'vital' as const },
    { pattern: /o2 sat\s+(\d+)%?/gi, type: 'vital' as const }
  ];

  for (const { pattern, type } of vitalPatterns) {
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type,
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
        details: {
          value: match[1],
          unit: match[2] || (match[0].toLowerCase().includes('bp') ? 'mmHg' : '')
        }
      });
    }
  }

  // Extract procedures
  for (const procedure of MEDICAL_KEYWORDS.procedures) {
    const regex = new RegExp(`\\b${procedure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type: 'procedure',
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.8
      });
    }
  }

  // Extract medical devices
  for (const device of MEDICAL_KEYWORDS.medical_devices) {
    const regex = new RegExp(`\\b${device.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type: 'device',
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.85
      });
    }
  }

  // Sort by start index and remove overlaps
  return removeOverlappingEntities(entities.sort((a, b) => a.startIndex - b.startIndex));
}

function removeOverlappingEntities(entities: MedicalEntity[]): MedicalEntity[] {
  const filtered: MedicalEntity[] = [];
  
  for (let i = 0; i < entities.length; i++) {
    const current = entities[i];
    let isOverlapping = false;
    
    for (const existing of filtered) {
      if (
        (current.startIndex >= existing.startIndex && current.startIndex < existing.endIndex) ||
        (current.endIndex > existing.startIndex && current.endIndex <= existing.endIndex)
      ) {
        // Keep the entity with higher confidence
        if (current.confidence > existing.confidence) {
          const index = filtered.indexOf(existing);
          filtered.splice(index, 1);
          break;
        } else {
          isOverlapping = true;
          break;
        }
      }
    }
    
    if (!isOverlapping) {
      filtered.push(current);
    }
  }
  
  return filtered;
}

/**
 * Enhanced medication extraction with dosage, frequency, and route detection
 */
export interface MedicationDetails {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
  confidence: number;
}

export function extractMedications(text: string): MedicationDetails[] {
  const medications: MedicationDetails[] = [];
  
  // Common medication patterns with dosage and frequency
  const patterns = [
    // Pattern: "medication dose frequency"
    /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|ml|units?|tablets?)\s+(once|twice|three times?|bd|od|tds|qds)\s+(daily|a day|per day|at night|in morning)/gi,
    
    // Pattern: "medication dose"
    /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|ml|units?|tablets?)/gi,
    
    // Pattern: "take/give medication"
    /(?:take|give|prescribe|start)\s+(\w+(?:\s+\w+)*)\s*(?:(\d+(?:\.\d+)?)\s*(mg|mcg|ml|units?|tablets?))?/gi
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0; // Reset regex
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      const medicationName = match[1].toLowerCase();
      
      // Check if it's a known medication
      const isKnownMedication = MEDICAL_KEYWORDS.medications.some(med => 
        medicationName.includes(med.toLowerCase()) || med.toLowerCase().includes(medicationName)
      );
      
      if (isKnownMedication || medicationName.length > 3) {
        medications.push({
          name: match[1],
          dosage: match[2] && match[3] ? `${match[2]} ${match[3]}` : undefined,
          frequency: match[4] ? `${match[4]} ${match[5] || ''}`.trim() : undefined,
          confidence: isKnownMedication ? 0.9 : 0.7
        });
      }
    }
  }

  // Remove duplicates and sort by confidence
  const uniqueMedications = medications.filter((med, index, arr) => 
    arr.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase()) === index
  );

  return uniqueMedications.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Context-aware symptom severity assessment
 */
export function assessSymptomSeverity(text: string): { symptom: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number }[] {
  const assessments: { symptom: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number }[] = [];
  
  const severityKeywords = {
    severe: ['severe', 'excruciating', 'unbearable', 'intense', 'agonizing', '10/10', '9/10', '8/10'],
    moderate: ['moderate', 'significant', 'noticeable', '6/10', '7/10', '5/10'],
    mild: ['mild', 'slight', 'minor', 'minimal', '1/10', '2/10', '3/10', '4/10']
  };

  for (const symptom of MEDICAL_KEYWORDS.symptoms) {
    const symptomRegex = new RegExp(`\\b${symptom}\\b`, 'gi');
    const matches = text.match(symptomRegex);
    
    if (matches) {
      for (const match of matches) {
        const matchIndex = text.toLowerCase().indexOf(match.toLowerCase());
        const contextWindow = text.substring(Math.max(0, matchIndex - 50), matchIndex + 50);
        
        let severity: 'mild' | 'moderate' | 'severe' = 'moderate';
        let confidence = 0.5;
        
        for (const [level, keywords] of Object.entries(severityKeywords)) {
          for (const keyword of keywords) {
            if (contextWindow.toLowerCase().includes(keyword)) {
              severity = level as 'mild' | 'moderate' | 'severe';
              confidence = 0.8;
              break;
            }
          }
          if (confidence > 0.5) break;
        }
        
        assessments.push({
          symptom: match,
          severity,
          confidence
        });
      }
    }
  }
  
  return assessments;
}