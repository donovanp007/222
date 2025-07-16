import { useState, useEffect, useRef } from 'react';
import { 
  AILearningResponse, 
  getAIRecommendations, 
  getSouthAfricanMedicalContext 
} from '@/utils/aiLearningAssistant';
import { Patient, Session } from '@/types';
import { extractMedicalEntities } from '@/utils/contentCategorization';

interface UseAILearningOptions {
  patient: Patient;
  patientHistory: Session[];
  enabledFeatures?: {
    treatmentRecommendations: boolean;
    learningInsights: boolean;
    drugInteractions: boolean;
    diagnosticSuggestions: boolean;
    continuousLearning: boolean;
  };
  debounceMs?: number;
}

interface AILearningState {
  response: AILearningResponse | null;
  isLoading: boolean;
  error: string | null;
  lastAnalyzedContent: string;
  analysisCount: number;
  medicalContext: any;
}

export function useAILearning(options: UseAILearningOptions) {
  const [state, setState] = useState<AILearningState>({
    response: null,
    isLoading: false,
    error: null,
    lastAnalyzedContent: '',
    analysisCount: 0,
    medicalContext: null
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    patient,
    patientHistory,
    enabledFeatures = {
      treatmentRecommendations: true,
      learningInsights: true,
      drugInteractions: true,
      diagnosticSuggestions: true,
      continuousLearning: true
    },
    debounceMs = 2000
  } = options;

  const analyzeContent = async (content: string, force = false) => {
    // Skip if content is too short or hasn't changed significantly
    if (!force && (
      content.length < 50 || 
      content === state.lastAnalyzedContent ||
      content.trim() === ''
    )) {
      return;
    }

    // Cancel any pending analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up new debounced analysis
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setState(prev => ({ 
          ...prev, 
          isLoading: true, 
          error: null 
        }));

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        // Extract entities first to determine medical context
        const entities = extractMedicalEntities(content);
        const conditions = entities
          .filter(e => e.type === 'condition')
          .map(e => e.text.toLowerCase());

        // Get South African medical context for relevant conditions
        const medicalContext = conditions.reduce((acc, condition) => {
          const context = getSouthAfricanMedicalContext(condition);
          if (context) {
            acc[condition] = context;
          }
          return acc;
        }, {} as any);

        // Get AI recommendations
        const aiResponse = await getAIRecommendations(
          content,
          patient,
          patientHistory
        );

        // Filter recommendations based on enabled features
        const filteredResponse: AILearningResponse = {
          treatmentRecommendations: enabledFeatures.treatmentRecommendations 
            ? aiResponse.treatmentRecommendations 
            : [],
          learningInsights: enabledFeatures.learningInsights 
            ? aiResponse.learningInsights 
            : [],
          drugInteractions: enabledFeatures.drugInteractions 
            ? aiResponse.drugInteractions 
            : [],
          diagnosticSuggestions: enabledFeatures.diagnosticSuggestions 
            ? aiResponse.diagnosticSuggestions 
            : [],
          continuousLearning: enabledFeatures.continuousLearning 
            ? aiResponse.continuousLearning 
            : { suggestedReading: [], skillGaps: [], improvementAreas: [] }
        };

        setState(prev => ({
          ...prev,
          response: filteredResponse,
          isLoading: false,
          lastAnalyzedContent: content,
          analysisCount: prev.analysisCount + 1,
          medicalContext,
          error: null
        }));

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, ignore
          return;
        }

        console.error('AI Learning analysis failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }));
      }
    }, debounceMs);
  };

  const clearAnalysis = () => {
    setState({
      response: null,
      isLoading: false,
      error: null,
      lastAnalyzedContent: '',
      analysisCount: 0,
      medicalContext: null
    });

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const refreshAnalysis = () => {
    if (state.lastAnalyzedContent) {
      analyzeContent(state.lastAnalyzedContent, true);
    }
  };

  const getRecommendationById = (id: string) => {
    return state.response?.treatmentRecommendations.find(rec => rec.id === id);
  };

  const getInsightById = (id: string) => {
    return state.response?.learningInsights.find(insight => insight.id === id);
  };

  const getRecommendationsByCategory = (category: string) => {
    return state.response?.treatmentRecommendations.filter(
      rec => rec.category === category
    ) || [];
  };

  const getHighPriorityAlerts = () => {
    const alerts = [];
    
    // High-severity drug interactions
    const majorInteractions = state.response?.drugInteractions.filter(
      interaction => interaction.severity === 'major' || interaction.severity === 'contraindicated'
    ) || [];
    
    alerts.push(...majorInteractions);

    // High-confidence diagnostic suggestions with red flags
    const urgentDiagnostics = state.response?.diagnosticSuggestions.filter(
      suggestion => suggestion.probability > 0.7 && suggestion.redFlags.length > 0
    ) || [];
    
    alerts.push(...urgentDiagnostics);

    return alerts;
  };

  const getPatientSpecificInsights = () => {
    if (!state.response) return [];

    const insights = [];

    // Age-specific insights
    if (patient.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      
      if (age >= 65) {
        insights.push({
          type: 'age-consideration',
          content: 'Consider age-related physiological changes and polypharmacy risks in elderly patients'
        });
      }
      
      if (age < 18) {
        insights.push({
          type: 'pediatric-consideration',
          content: 'Pediatric dosing and safety considerations apply'
        });
      }
    }

    // Gender-specific insights
    if (patient.gender === 'female') {
      insights.push({
        type: 'reproductive-health',
        content: 'Consider pregnancy status and contraceptive interactions for reproductive-age patients'
      });
    }

    return insights;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    response: state.response,
    isLoading: state.isLoading,
    error: state.error,
    analysisCount: state.analysisCount,
    medicalContext: state.medicalContext,
    
    // Actions
    analyzeContent,
    clearAnalysis,
    refreshAnalysis,
    
    // Getters
    getRecommendationById,
    getInsightById,
    getRecommendationsByCategory,
    getHighPriorityAlerts,
    getPatientSpecificInsights,
    
    // Stats
    hasRecommendations: (state.response?.treatmentRecommendations.length || 0) > 0,
    hasInsights: (state.response?.learningInsights.length || 0) > 0,
    hasAlerts: (state.response?.drugInteractions.length || 0) > 0,
    hasDiagnostics: (state.response?.diagnosticSuggestions.length || 0) > 0,
    totalInsights: (
      (state.response?.treatmentRecommendations.length || 0) +
      (state.response?.learningInsights.length || 0) +
      (state.response?.drugInteractions.length || 0) +
      (state.response?.diagnosticSuggestions.length || 0)
    )
  };
}