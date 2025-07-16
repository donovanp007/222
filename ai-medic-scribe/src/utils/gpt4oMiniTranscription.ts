'use client'

import { useState } from 'react'
import { SAMedicalDatabaseService } from './saHealthDatabases'

export interface TranscriptionConfig {
  apiKey: string
  model: 'gpt-4o-mini' | 'whisper-1'
  language?: string
  temperature?: number
  maxTokens?: number
  enableMedicalTerminology?: boolean
  enableSAHealthContext?: boolean
}

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
  duration: number
  medicalTermsDetected: string[]
  saHealthContextApplied: boolean
  cost: {
    inputTokens: number
    outputTokens: number
    totalCost: number
  }
  processingTime: number
}

export interface MedicalTranscriptionEnhancement {
  originalText: string
  enhancedText: string
  medicalTerminology: {
    detected: string[]
    standardized: string[]
    abbreviationsExpanded: string[]
  }
  saHealthContext: {
    medicinesIdentified: string[]
    guidelinesApplied: string[]
    localTerminology: string[]
  }
  icd10Codes: string[]
  structuredData: {
    chiefComplaint?: string
    historyOfPresentIllness?: string
    physicalExamination?: string
    assessment?: string
    plan?: string
  }
}

class GPT4oMiniTranscriptionService {
  private static instance: GPT4oMiniTranscriptionService
  private saDatabase: SAMedicalDatabaseService
  
  // South African medical terminology dictionary
  private samedicalTerms = {
    // Afrikaans medical terms
    'hartsiektes': 'heart disease',
    'suikersiekte': 'diabetes',
    'hoë bloeddruk': 'hypertension',
    'asemhaling': 'breathing',
    'pyn': 'pain',
    'medisyne': 'medicine',
    'dokter': 'doctor',
    'hospitaal': 'hospital',
    'operasie': 'operation',
    'behandeling': 'treatment',
    
    // Zulu medical terms
    'isifo senhliziyo': 'heart disease',
    'isifo sikashukela': 'diabetes',
    'umfutho': 'blood pressure',
    'ukuphila': 'breathing',
    'ubuhlungu': 'pain',
    'imithi': 'medicine',
    'udokotela': 'doctor',
    'isibhedlela': 'hospital',
    'ukusika': 'operation',
    'ukwelapha': 'treatment',
    
    // Xhosa medical terms
    'isifo sentliziyo': 'heart disease',
    'isifo seswekile': 'diabetes',
    'uxinzelelo lwegazi': 'blood pressure',
    'ukuphefumla': 'breathing',
    'intlungu': 'pain',
    'amayeza': 'medicine',
    'ugqirha': 'doctor',
    'isibhedlele': 'hospital',
    'utyando': 'operation',
    'unyango': 'treatment',
    
    // Common SA medical abbreviations
    'DOH': 'Department of Health',
    'SAHPRA': 'South African Health Products Regulatory Authority',
    'NAPPI': 'National Pharmaceutical Product Interface',
    'STG': 'Standard Treatment Guidelines',
    'EML': 'Essential Medicines List',
    'PHC': 'Primary Health Care',
    'CHC': 'Community Health Centre',
    'ARV': 'Antiretroviral',
    'TB': 'Tuberculosis',
    'MDR-TB': 'Multi-Drug Resistant Tuberculosis',
    'XDR-TB': 'Extensively Drug Resistant Tuberculosis'
  }

  private constructor() {
    this.saDatabase = SAMedicalDatabaseService.getInstance()
  }

  public static getInstance(): GPT4oMiniTranscriptionService {
    if (!GPT4oMiniTranscriptionService.instance) {
      GPT4oMiniTranscriptionService.instance = new GPT4oMiniTranscriptionService()
    }
    return GPT4oMiniTranscriptionService.instance
  }

  async transcribeAudio(
    audioBlob: Blob,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    const startTime = Date.now()
    
    try {
      // First, use Whisper for basic transcription
      const whisperResult = await this.performWhisperTranscription(audioBlob, config)
      
      // Then enhance with GPT-4o Mini for medical context
      const enhancedResult = await this.enhanceWithGPT4oMini(whisperResult, config)
      
      const processingTime = Date.now() - startTime
      
      return {
        ...enhancedResult,
        processingTime
      }
    } catch (error) {
      console.error('Transcription failed:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async performWhisperTranscription(
    audioBlob: Blob,
    config: TranscriptionConfig
  ): Promise<Partial<TranscriptionResult>> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')
    
    if (config.language) {
      formData.append('language', config.language)
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    return {
      text: result.text,
      language: result.language || config.language || 'en',
      duration: audioBlob.size / 16000, // Approximate duration
      confidence: 0.85 // Whisper doesn't provide confidence, using default
    }
  }

  private async enhanceWithGPT4oMini(
    whisperResult: Partial<TranscriptionResult>,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    if (!config.enableMedicalTerminology && !config.enableSAHealthContext) {
      return {
        text: whisperResult.text || '',
        confidence: whisperResult.confidence || 0.85,
        language: whisperResult.language || 'en',
        duration: whisperResult.duration || 0,
        medicalTermsDetected: [],
        saHealthContextApplied: false,
        cost: { inputTokens: 0, outputTokens: 0, totalCost: 0 },
        processingTime: 0
      }
    }

    const enhancement = await this.performMedicalEnhancement(
      whisperResult.text || '',
      config
    )

    // Estimate token usage and cost for GPT-4o Mini
    const inputTokens = Math.ceil((whisperResult.text?.length || 0) / 4)
    const outputTokens = Math.ceil((enhancement.enhancedText.length) / 4)
    const totalCost = this.calculateGPT4oMiniCost(inputTokens, outputTokens)

    return {
      text: enhancement.enhancedText,
      confidence: whisperResult.confidence || 0.85,
      language: whisperResult.language || 'en',
      duration: whisperResult.duration || 0,
      medicalTermsDetected: enhancement.medicalTerminology.detected,
      saHealthContextApplied: enhancement.saHealthContext.medicinesIdentified.length > 0,
      cost: { inputTokens, outputTokens, totalCost },
      processingTime: 0
    }
  }

  private async performMedicalEnhancement(
    text: string,
    config: TranscriptionConfig
  ): Promise<MedicalTranscriptionEnhancement> {
    // Apply SA medical terminology normalization
    const enhancedText = this.applySAMedicalTerminology(text)
    
    // Use GPT-4o Mini to structure and enhance medical content
    const systemPrompt = this.buildSystemPrompt(config)
    const userPrompt = this.buildUserPrompt(enhancedText, config)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: config.temperature || 0.1,
          max_tokens: config.maxTokens || 1500
        }),
      })

      if (!response.ok) {
        throw new Error(`GPT-4o Mini API error: ${response.status}`)
      }

      const result = await response.json()
      const enhancementData = JSON.parse(result.choices[0].message.content)

      return {
        originalText: text,
        enhancedText: enhancementData.enhancedText || enhancedText,
        medicalTerminology: {
          detected: this.extractMedicalTerms(text),
          standardized: enhancementData.standardizedTerms || [],
          abbreviationsExpanded: enhancementData.abbreviationsExpanded || []
        },
        saHealthContext: {
          medicinesIdentified: enhancementData.medicinesIdentified || [],
          guidelinesApplied: enhancementData.guidelinesApplied || [],
          localTerminology: enhancementData.localTerminology || []
        },
        icd10Codes: enhancementData.icd10Codes || [],
        structuredData: enhancementData.structuredData || {}
      }
    } catch (error) {
      console.error('Medical enhancement failed:', error)
      // Return basic enhancement if GPT-4o Mini fails
      return {
        originalText: text,
        enhancedText,
        medicalTerminology: {
          detected: this.extractMedicalTerms(text),
          standardized: [],
          abbreviationsExpanded: []
        },
        saHealthContext: {
          medicinesIdentified: [],
          guidelinesApplied: [],
          localTerminology: []
        },
        icd10Codes: [],
        structuredData: {}
      }
    }
  }

  private buildSystemPrompt(config: TranscriptionConfig): string {
    return `You are a South African medical transcription assistant specializing in healthcare documentation. Your task is to enhance medical transcriptions with:

1. MEDICAL TERMINOLOGY: Standardize medical terms, expand abbreviations, correct terminology
2. SOUTH AFRICAN CONTEXT: Apply local medical guidelines, medicine names, and healthcare practices
3. STRUCTURE: Organize content into SOAP format when possible
4. ACCURACY: Maintain clinical accuracy while improving readability

Context:
- Use South African medical terminology and guidelines
- Reference SAHPRA-approved medicines where applicable
- Apply DOH Essential Medicines List preferences
- Consider Standard Treatment Guidelines (STG)
- Include relevant ICD-10 codes when conditions are mentioned

Return response as JSON with this structure:
{
  "enhancedText": "improved medical transcription",
  "standardizedTerms": ["list of standardized terms"],
  "abbreviationsExpanded": ["list of expanded abbreviations"],
  "medicinesIdentified": ["medicines mentioned"],
  "guidelinesApplied": ["relevant SA guidelines"],
  "localTerminology": ["SA-specific terms used"],
  "icd10Codes": ["relevant ICD-10 codes"],
  "structuredData": {
    "chiefComplaint": "main complaint",
    "historyOfPresentIllness": "HPI details",
    "physicalExamination": "PE findings",
    "assessment": "clinical assessment",
    "plan": "treatment plan"
  }
}`
  }

  private buildUserPrompt(text: string, config: TranscriptionConfig): string {
    return `Please enhance this medical transcription for South African healthcare context:

"${text}"

Requirements:
- Correct medical terminology and abbreviations
- Apply South African medical guidelines where relevant
- Structure into SOAP format if possible
- Identify medicines and reference SA database preferences
- Add relevant ICD-10 codes for mentioned conditions
- Maintain clinical accuracy while improving clarity`
  }

  private applySAMedicalTerminology(text: string): string {
    let enhancedText = text

    // Replace SA medical terms with English equivalents
    Object.entries(this.samedicalTerms).forEach(([local, english]) => {
      const regex = new RegExp(`\\b${local}\\b`, 'gi')
      enhancedText = enhancedText.replace(regex, english)
    })

    return enhancedText
  }

  private extractMedicalTerms(text: string): string[] {
    const medicalTerms: string[] = []
    const commonMedicalWords = [
      'hypertension', 'diabetes', 'medication', 'prescription', 'diagnosis',
      'treatment', 'symptoms', 'examination', 'blood pressure', 'heart rate',
      'temperature', 'respiratory', 'cardiovascular', 'neurological',
      'gastrointestinal', 'musculoskeletal', 'dermatological'
    ]

    commonMedicalWords.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        medicalTerms.push(term)
      }
    })

    return [...new Set(medicalTerms)]
  }

  private calculateGPT4oMiniCost(inputTokens: number, outputTokens: number): number {
    // GPT-4o Mini pricing (as of 2024)
    const inputCostPerToken = 0.00015 / 1000  // $0.15 per 1K tokens
    const outputCostPerToken = 0.0006 / 1000  // $0.60 per 1K tokens
    
    return (inputTokens * inputCostPerToken) + (outputTokens * outputCostPerToken)
  }
}

// React Hook for GPT-4o Mini Transcription
export function useGPT4oMiniTranscription() {
  const [transcriptionService] = useState(() => GPT4oMiniTranscriptionService.getInstance())
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null)

  const transcribeAudio = async (
    audioBlob: Blob,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> => {
    setIsTranscribing(true)
    setError(null)

    try {
      const result = await transcriptionService.transcribeAudio(audioBlob, config)
      setLastResult(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsTranscribing(false)
    }
  }

  return {
    transcribeAudio,
    isTranscribing,
    error,
    lastResult,
    clearError: () => setError(null)
  }
}

export default GPT4oMiniTranscriptionService