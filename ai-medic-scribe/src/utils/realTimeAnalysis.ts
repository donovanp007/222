import { Template, TemplateSection } from "@/types/template";
import { extractMedicalEntities, MedicalEntity, categorizeSentence } from "./contentCategorization";
import { analyzeTranscription } from "./aiTaskAnalysis";

export interface StreamingAnalysisResult {
  processedText: string;
  templateSections: Record<string, {
    content: string;
    confidence: number;
    entities: MedicalEntity[];
    lastUpdated: number;
  }>;
  suggestedActions: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  completeness: number;
}

export interface RealTimeProcessor {
  addText: (newText: string) => StreamingAnalysisResult;
  getResult: () => StreamingAnalysisResult;
  reset: () => void;
  getCurrentSections: () => Record<string, any>;
}

/**
 * Creates a real-time streaming processor for medical transcription
 */
export function createRealTimeProcessor(template: Template): RealTimeProcessor {
  let accumulatedText = '';
  let templateSections: Record<string, {
    content: string;
    confidence: number;
    entities: MedicalEntity[];
    lastUpdated: number;
  }> = {};

  // Initialize template sections
  template.sections.forEach(section => {
    templateSections[section.id] = {
      content: '',
      confidence: 0,
      entities: [],
      lastUpdated: Date.now()
    };
  });

  let suggestedActions: Array<{
    type: string;
    description: string;
    confidence: number;
  }> = [];
  
  let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'low';

  const addText = (newText: string): StreamingAnalysisResult => {
    accumulatedText += ' ' + newText;
    
    // Process the new text incrementally
    const sentences = newText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    for (const sentence of sentences) {
      processSentenceIncrementally(sentence.trim(), template.sections);
    }

    // Update urgency and suggestions periodically
    if (accumulatedText.length % 100 < newText.length) {
      updateSuggestionsAndUrgency();
    }

    return getResult();
  };

  const processSentenceIncrementally = (sentence: string, sections: TemplateSection[]) => {
    // Extract entities from this sentence
    const entities = extractMedicalEntities(sentence);
    
    // Find best matching section using existing categorization logic
    const bestMatch = findBestSection(sentence, sections);
    
    if (bestMatch && bestMatch.confidence > 0.3) {
      const section = templateSections[bestMatch.sectionId];
      
      // Append to existing content with proper formatting
      if (section.content) {
        section.content += sentence.endsWith('.') ? ' ' + sentence : '. ' + sentence;
      } else {
        section.content = sentence;
      }
      
      section.confidence = Math.max(section.confidence, bestMatch.confidence);
      section.entities.push(...entities);
      section.lastUpdated = Date.now();
      
      // Remove duplicate entities
      section.entities = removeDuplicateEntities(section.entities);
    }
  };

  const findBestSection = (sentence: string, sections: TemplateSection[]) => {
    let bestMatch = { sectionId: '', confidence: 0 };
    
    for (const section of sections) {
      const score = calculateSectionScore(sentence.toLowerCase(), section);
      if (score > bestMatch.confidence) {
        bestMatch = { sectionId: section.id, confidence: score };
      }
    }
    
    return bestMatch.confidence > 0 ? bestMatch : null;
  };

  const calculateSectionScore = (sentence: string, section: TemplateSection): number => {
    // Simplified scoring - can be enhanced with ML models
    const keywords = section.keywords || [];
    let score = 0;
    
    for (const keyword of keywords) {
      if (sentence.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }
    
    // Type-specific scoring
    switch (section.type) {
      case 'symptoms':
        if (sentence.includes('pain') || sentence.includes('feel') || sentence.includes('complain')) {
          score += 0.4;
        }
        break;
      case 'vitals':
        if (/\d+\/\d+|\d+\s*bpm|\d+\s*degrees/i.test(sentence)) {
          score += 0.6;
        }
        break;
      case 'diagnosis':
        if (sentence.includes('diagnos') || sentence.includes('condition') || sentence.includes('assess')) {
          score += 0.4;
        }
        break;
      case 'treatment':
        if (sentence.includes('prescrib') || sentence.includes('treat') || sentence.includes('mg')) {
          score += 0.4;
        }
        break;
    }
    
    return Math.min(score, 1);
  };

  const updateSuggestionsAndUrgency = () => {
    if (accumulatedText.length > 50) {
      const analysis = analyzeTranscription(accumulatedText);
      
      suggestedActions = analysis.suggestedTasks.map(task => ({
        type: task.type,
        description: task.description,
        confidence: 0.8
      }));
      
      urgencyLevel = analysis.urgencyLevel;
    }
  };

  const removeDuplicateEntities = (entities: MedicalEntity[]): MedicalEntity[] => {
    const seen = new Set();
    return entities.filter(entity => {
      const key = `${entity.type}-${entity.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getResult = (): StreamingAnalysisResult => {
    const totalSections = Object.keys(templateSections).length;
    const populatedSections = Object.values(templateSections).filter(s => s.content.length > 0).length;
    const completeness = populatedSections / totalSections;

    return {
      processedText: accumulatedText,
      templateSections,
      suggestedActions,
      urgencyLevel,
      completeness
    };
  };

  const reset = () => {
    accumulatedText = '';
    suggestedActions = [];
    urgencyLevel = 'low';
    
    // Reset template sections
    template.sections.forEach(section => {
      templateSections[section.id] = {
        content: '',
        confidence: 0,
        entities: [],
        lastUpdated: Date.now()
      };
    });
  };

  const getCurrentSections = () => {
    return { ...templateSections };
  };

  return {
    addText,
    getResult,
    reset,
    getCurrentSections
  };
}

/**
 * Progressive template population with confidence scoring
 */
export class ProgressiveTemplatePopulator {
  private template: Template;
  private sectionContents: Map<string, string[]> = new Map();
  private confidenceScores: Map<string, number> = new Map();
  private lastAnalysis: number = 0;
  private analysisBuffer: string = '';

  constructor(template: Template) {
    this.template = template;
    this.initializeSections();
  }

  private initializeSections() {
    this.template.sections.forEach(section => {
      this.sectionContents.set(section.id, []);
      this.confidenceScores.set(section.id, 0);
    });
  }

  addTranscriptionSegment(text: string): void {
    this.analysisBuffer += ' ' + text;
    
    // Analyze every 10 seconds or 100 characters
    const now = Date.now();
    if (now - this.lastAnalysis > 10000 || this.analysisBuffer.length > 100) {
      this.analyzeAndPopulate();
      this.lastAnalysis = now;
    }
  }

  private analyzeAndPopulate(): void {
    if (!this.analysisBuffer.trim()) return;

    const sentences = this.analysisBuffer.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      this.processSentence(sentence.trim());
    }

    this.analysisBuffer = '';
  }

  private processSentence(sentence: string): void {
    const bestSection = this.findBestSectionForSentence(sentence);
    
    if (bestSection) {
      const existingContent = this.sectionContents.get(bestSection.sectionId) || [];
      
      // Avoid duplicates
      if (!existingContent.some(content => 
        this.calculateSimilarity(content, sentence) > 0.8
      )) {
        existingContent.push(sentence);
        this.sectionContents.set(bestSection.sectionId, existingContent);
        
        // Update confidence
        const currentConfidence = this.confidenceScores.get(bestSection.sectionId) || 0;
        this.confidenceScores.set(
          bestSection.sectionId, 
          Math.max(currentConfidence, bestSection.confidence)
        );
      }
    }
  }

  private findBestSectionForSentence(sentence: string): { sectionId: string; confidence: number } | null {
    let bestMatch = { sectionId: '', confidence: 0 };

    for (const section of this.template.sections) {
      const confidence = this.calculateSectionConfidence(sentence, section);
      if (confidence > bestMatch.confidence) {
        bestMatch = { sectionId: section.id, confidence };
      }
    }

    return bestMatch.confidence > 0.3 ? bestMatch : null;
  }

  private calculateSectionConfidence(sentence: string, section: TemplateSection): number {
    // Enhanced confidence calculation with medical context
    let confidence = 0;
    const sentenceLower = sentence.toLowerCase();

    // Keyword matching
    const keywords = section.keywords || [];
    for (const keyword of keywords) {
      if (sentenceLower.includes(keyword.toLowerCase())) {
        confidence += 0.2;
      }
    }

    // Section type specific analysis
    switch (section.type) {
      case 'symptoms':
        if (this.containsSymptomIndicators(sentenceLower)) confidence += 0.4;
        break;
      case 'vitals':
        if (this.containsVitalSigns(sentence)) confidence += 0.6;
        break;
      case 'diagnosis':
        if (this.containsDiagnosisIndicators(sentenceLower)) confidence += 0.4;
        break;
      case 'treatment':
        if (this.containsTreatmentIndicators(sentenceLower)) confidence += 0.4;
        break;
      case 'history':
        if (this.containsHistoryIndicators(sentenceLower)) confidence += 0.4;
        break;
      case 'examination':
        if (this.containsExaminationIndicators(sentenceLower)) confidence += 0.4;
        break;
    }

    return Math.min(confidence, 1);
  }

  private containsSymptomIndicators(sentence: string): boolean {
    const indicators = ['pain', 'ache', 'feel', 'complain', 'experience', 'suffer', 'symptoms'];
    return indicators.some(indicator => sentence.includes(indicator));
  }

  private containsVitalSigns(sentence: string): boolean {
    return /\d+\/\d+|\d+\s*bpm|\d+\s*(degrees|°)|\d+%\s*o2/i.test(sentence);
  }

  private containsDiagnosisIndicators(sentence: string): boolean {
    const indicators = ['diagnos', 'condition', 'disease', 'assess', 'impression', 'likely'];
    return indicators.some(indicator => sentence.includes(indicator));
  }

  private containsTreatmentIndicators(sentence: string): boolean {
    const indicators = ['prescrib', 'treat', 'medication', 'mg', 'dose', 'therapy'];
    return indicators.some(indicator => sentence.includes(indicator));
  }

  private containsHistoryIndicators(sentence: string): boolean {
    const indicators = ['history', 'previous', 'past', 'before', 'family', 'allerg'];
    return indicators.some(indicator => sentence.includes(indicator));
  }

  private containsExaminationIndicators(sentence: string): boolean {
    const indicators = ['exam', 'inspect', 'palpat', 'auscult', 'look', 'feel', 'listen'];
    return indicators.some(indicator => sentence.includes(indicator));
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  getPopulatedTemplate(): Record<string, { content: string; confidence: number }> {
    const result: Record<string, { content: string; confidence: number }> = {};

    for (const section of this.template.sections) {
      const contents = this.sectionContents.get(section.id) || [];
      const confidence = this.confidenceScores.get(section.id) || 0;
      
      result[section.id] = {
        content: contents.join('. '),
        confidence
      };
    }

    return result;
  }

  reset(): void {
    this.sectionContents.clear();
    this.confidenceScores.clear();
    this.analysisBuffer = '';
    this.lastAnalysis = 0;
    this.initializeSections();
  }
}