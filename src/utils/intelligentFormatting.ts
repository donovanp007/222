import { getStoredApiKey, getSelectedAIModel } from "@/components/settings/ApiSettings";
import { trackCategorization } from "./apiUsageTracker";
import { Template } from "@/types/template";

export interface IntelligentAnalysis {
  formattedSections: {
    sectionId: string;
    sectionTitle: string;
    content: string;
    confidence: number;
    formatting: {
      highlighted: string[];
      icd10Codes: Array<{ code: string; description: string; }>;
      medicalTerms: string[];
      dosages: string[];
      vitals: string[];
    };
  }[];
  clinicalSummary: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  completeness: number; // 0-1 score
  suggestedActions: string[];
}

/**
 * Enhanced AI-powered intelligent formatting inspired by Heidi Health
 * This creates beautifully structured medical notes with proper formatting
 */
export async function createIntelligentMedicalNote(
  rawTranscription: string,
  template: Template,
  patientContext?: string
): Promise<IntelligentAnalysis> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const selectedModel = getSelectedAIModel();
  const prompt = createIntelligentFormattingPrompt(rawTranscription, template, patientContext);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert South African medical AI assistant specialized in creating beautifully formatted, clinically accurate medical documentation. You understand South African medical standards, ICD-10-AM coding, and local healthcare context including common conditions like TB, HIV, diabetes, and hypertension.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: selectedModel === 'gpt-3.5-turbo' ? 2000 : 2500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up the response if it contains markdown code blocks
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '');
    }
    if (content.includes('```')) {
      content = content.replace(/```\s*/g, '').replace(/\s*```/g, '');
    }
    
    // Remove any leading/trailing whitespace
    content = content.trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content received:', content);
      
      // Fallback: create a basic structure
      result = {
        formattedSections: [{
          sectionId: 'notes_1',
          sectionTitle: 'Clinical Notes',
          content: rawTranscription,
          confidence: 0.8,
          formatting: {
            highlighted: [],
            icd10Codes: [],
            medicalTerms: [],
            dosages: [],
            vitals: []
          }
        }],
        clinicalSummary: 'Transcription processed with basic formatting due to parsing error.',
        urgencyLevel: 'medium',
        completeness: 0.7,
        suggestedActions: ['Review and edit content as needed']
      };
    }
    
    // Track API usage
    trackCategorization(rawTranscription.length);
    
    return result;
  } catch (error) {
    console.error('Intelligent formatting failed:', error);
    throw error;
  }
}

function createIntelligentFormattingPrompt(
  transcription: string,
  template: Template,
  patientContext?: string
): string {
  const sectionsDescription = template.sections.map(section => 
    `- ${section.title} (${section.type}): ${section.placeholder}`
  ).join('\n');

  return `
You are an expert South African medical scribe AI. Transform this raw medical transcription into a beautifully formatted, professionally structured medical note.

TRANSCRIPTION TO ANALYZE:
"${transcription}"

TEMPLATE STRUCTURE:
${sectionsDescription}

${patientContext ? `PATIENT CONTEXT:\n${patientContext}\n` : ''}

INSTRUCTIONS:
1. **Intelligent Content Allocation**: Analyze each sentence and allocate content to the most appropriate template sections
2. **Professional Medical Formatting**: 
   - Use proper medical terminology
   - Structure content with clear headings and bullet points
   - Highlight critical information
   - Format vital signs, medications, and dosages properly
3. **South African Medical Context**:
   - Include relevant ICD-10-AM codes
   - Consider local disease patterns (TB, HIV, diabetes, hypertension)
   - Use South African medical terminology and standards
4. **Clinical Intelligence**:
   - Identify and highlight critical findings
   - Suggest medical terms where lay language is used
   - Extract and format vital signs, medications, allergies
   - Assess urgency and completeness
5. **Beautiful Formatting**:
   - Use markdown formatting for readability
   - Create structured lists for medications, symptoms, findings
   - Highlight important medical information
   - Ensure professional presentation

⚠️ CRITICAL: Return ONLY valid JSON. No markdown code blocks, no extra text, no explanation. Start directly with { and end with }.

JSON FORMAT:
{
  "formattedSections": [
    {
      "sectionId": "section_id_from_template",
      "sectionTitle": "Section Title",
      "content": "**Beautifully formatted content with:**\\n\\n• Proper bullet points\\n• **Bold critical findings**\\n• Clear structure\\n• Professional terminology",
      "confidence": 0.95,
      "formatting": {
        "highlighted": ["critical findings", "important symptoms"],
        "icd10Codes": [
          {
            "code": "R50.9",
            "description": "Fever, unspecified"
          }
        ],
        "medicalTerms": ["hypertension", "tachycardia"],
        "dosages": ["20mg daily", "500mg BD"],
        "vitals": ["BP 140/90", "HR 85", "Temp 37.2°C"]
      }
    }
  ],
  "clinicalSummary": "Brief professional summary of key clinical findings and management",
  "urgencyLevel": "medium",
  "completeness": 0.85,
  "suggestedActions": [
    "Follow-up blood pressure monitoring required",
    "Consider ECG if chest pain persists"
  ]
}

CRITICAL REQUIREMENTS:
- Extract ALL medical information from the transcription
- Format content professionally with proper medical structure
- Include relevant ICD-10 codes for diagnoses and symptoms
- Highlight critical findings and important information
- Ensure content flows logically within each section
- Use South African medical standards and terminology
- Make the output look like a professional medical document
- Only include content that clearly belongs to each section
- Preserve exact medical details while enhancing presentation
`;
}

/**
 * Real-time sentence analysis for live formatting feedback
 */
export async function analyzeTranscriptionSentence(
  sentence: string,
  template: Template,
  previousContext: string = ''
): Promise<{
  suggestedSection: string;
  formattedSentence: string;
  medicalTerms: string[];
  confidence: number;
}> {
  const apiKey = getStoredApiKey();
  if (!apiKey || sentence.trim().length < 10) {
    return {
      suggestedSection: 'notes',
      formattedSentence: sentence,
      medicalTerms: [],
      confidence: 0
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Analyze this medical sentence quickly:
"${sentence}"

Context: ${previousContext}

Template sections: ${template.sections.map(s => s.title).join(', ')}

Return JSON:
{
  "suggestedSection": "best_section_id",
  "formattedSentence": "properly formatted medical sentence",
  "medicalTerms": ["extracted", "medical", "terms"],
  "confidence": 0.9
}`
        }],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Sentence analysis failed:', error);
  }

  return {
    suggestedSection: 'notes',
    formattedSentence: sentence,
    medicalTerms: [],
    confidence: 0
  };
}