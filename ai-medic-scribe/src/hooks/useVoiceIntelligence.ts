import { useState, useRef, useCallback, useEffect } from 'react';
import { createRealTimeProcessor, StreamingAnalysisResult } from '@/utils/realTimeAnalysis';
import { MedicalAutoCompleter, performPredictiveAnalysis } from '@/utils/predictiveFeatures';
import { performClinicalDecisionSupport, ContraindicationAlert, RiskFactor } from '@/utils/clinicalDecisionSupport';
import { extractMedications } from '@/utils/contentCategorization';
import { getStoredApiKey } from '@/components/settings/ApiSettings';
import { Template } from '@/types/template';
import { Patient, Session } from '@/types';

interface VoiceCommand {
  command: string;
  action: 'add_to_section' | 'check_interactions' | 'suggest_diagnosis' | 'complete_note' | 'save_session';
  parameters?: Record<string, any>;
  confidence: number;
}

interface VoiceIntelligenceState {
  isListening: boolean;
  isProcessing: boolean;
  currentTranscription: string;
  streamingAnalysis: StreamingAnalysisResult | null;
  voiceCommands: VoiceCommand[];
  suggestions: Array<{
    type: 'completion' | 'command' | 'warning';
    content: string;
    confidence: number;
  }>;
  alerts: {
    contraindications: ContraindicationAlert[];
    riskFactors: RiskFactor[];
  };
}

interface UseVoiceIntelligenceOptions {
  template: Template;
  patient: Patient;
  patientHistory: Session[];
  onTranscriptionUpdate?: (text: string) => void;
  onCommandDetected?: (command: VoiceCommand) => void;
  onStreamingAnalysis?: (analysis: StreamingAnalysisResult) => void;
}

const VOICE_COMMANDS = [
  { phrase: 'add to symptoms', action: 'add_to_section', section: 'symptoms' },
  { phrase: 'add to vitals', action: 'add_to_section', section: 'vitals' },
  { phrase: 'add to examination', action: 'add_to_section', section: 'examination' },
  { phrase: 'add to diagnosis', action: 'add_to_section', section: 'diagnosis' },
  { phrase: 'add to treatment', action: 'add_to_section', section: 'treatment' },
  { phrase: 'add to plan', action: 'add_to_section', section: 'plan' },
  { phrase: 'check interactions', action: 'check_interactions' },
  { phrase: 'check drug interactions', action: 'check_interactions' },
  { phrase: 'suggest diagnosis', action: 'suggest_diagnosis' },
  { phrase: 'complete note', action: 'complete_note' },
  { phrase: 'save session', action: 'save_session' },
  { phrase: 'save note', action: 'save_session' }
];

export function useVoiceIntelligence(options: UseVoiceIntelligenceOptions) {
  const [state, setState] = useState<VoiceIntelligenceState>({
    isListening: false,
    isProcessing: false,
    currentTranscription: '',
    streamingAnalysis: null,
    voiceCommands: [],
    suggestions: [],
    alerts: {
      contraindications: [],
      riskFactors: []
    }
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processorRef = useRef<ReturnType<typeof createRealTimeProcessor> | null>(null);
  const autoCompleterRef = useRef<MedicalAutoCompleter | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition and processors
  useEffect(() => {
    initializeSpeechRecognition();
    initializeProcessors();
    
    return () => {
      cleanup();
    };
  }, []);

  // Update streaming analysis when transcription changes
  useEffect(() => {
    if (state.currentTranscription && processorRef.current) {
      const analysis = processorRef.current.getResult();
      setState(prev => ({ ...prev, streamingAnalysis: analysis }));
      options.onStreamingAnalysis?.(analysis);
    }
  }, [state.currentTranscription]);

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onresult = (event) => {
      handleSpeechResult(event);
    };

    recognitionRef.current = recognition;
  };

  const initializeProcessors = () => {
    processorRef.current = createRealTimeProcessor(options.template);
    autoCompleterRef.current = new MedicalAutoCompleter();
  };

  const handleSpeechResult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      processNewTranscription(finalTranscript.trim());
    }

    // Update current transcription with interim results
    const fullTranscription = state.currentTranscription + finalTranscript + interimTranscript;
    setState(prev => ({ ...prev, currentTranscription: fullTranscription }));
    options.onTranscriptionUpdate?.(fullTranscription);
  };

  const processNewTranscription = async (newText: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Update real-time processor
      if (processorRef.current) {
        const analysis = processorRef.current.addText(newText);
        setState(prev => ({ ...prev, streamingAnalysis: analysis }));
      }

      // Check for voice commands
      const commands = detectVoiceCommands(newText);
      if (commands.length > 0) {
        setState(prev => ({ ...prev, voiceCommands: [...prev.voiceCommands, ...commands] }));
        commands.forEach(command => options.onCommandDetected?.(command));
      }

      // Debounced intelligent analysis
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      analysisTimeoutRef.current = setTimeout(async () => {
        await performIntelligentAnalysis(state.currentTranscription + newText);
      }, 1500);

    } catch (error) {
      console.error('Error processing transcription:', error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const detectVoiceCommands = (text: string): VoiceCommand[] => {
    const commands: VoiceCommand[] = [];
    const textLower = text.toLowerCase();

    for (const commandPattern of VOICE_COMMANDS) {
      if (textLower.includes(commandPattern.phrase)) {
        commands.push({
          command: commandPattern.phrase,
          action: commandPattern.action as any,
          parameters: { section: (commandPattern as any).section },
          confidence: 0.9
        });
      }
    }

    return commands;
  };

  const performIntelligentAnalysis = async (fullText: string) => {
    if (!fullText.trim() || fullText.length < 20) return;

    try {
      // Extract medications for clinical analysis
      const medications = extractMedications(fullText);
      
      // Get auto-completion suggestions
      const suggestions = [];
      if (autoCompleterRef.current) {
        const autoCompletions = autoCompleterRef.current.getSuggestions(
          fullText.split(' ').slice(-2).join(' '), // Last two words
          fullText
        );
        
        suggestions.push(...autoCompletions.map(ac => ({
          type: 'completion' as const,
          content: ac.text,
          confidence: ac.confidence
        })));
      }

      // Perform clinical decision support if medications found
      let contraindications: ContraindicationAlert[] = [];
      let riskFactors: RiskFactor[] = [];
      
      if (medications.length > 0) {
        const clinicalSupport = await performClinicalDecisionSupport(
          fullText,
          options.patient,
          options.patientHistory,
          medications
        );
        
        contraindications = clinicalSupport.contraindications;
        riskFactors = clinicalSupport.riskFactors;

        // Add warnings as suggestions
        if (contraindications.length > 0) {
          suggestions.push(...contraindications.map(alert => ({
            type: 'warning' as const,
            content: `⚠️ ${alert.medication}: ${alert.description}`,
            confidence: 0.95
          })));
        }
      }

      // Get predictive analysis
      const predictiveAnalysis = await performPredictiveAnalysis(
        fullText.substring(-50), // Last 50 characters
        fullText,
        options.patient,
        options.patientHistory
      );

      // Add diagnosis predictions as suggestions
      if (predictiveAnalysis.diagnosisPredictions.length > 0) {
        suggestions.push(...predictiveAnalysis.diagnosisPredictions.map(diag => ({
          type: 'completion' as const,
          content: `💡 Possible diagnosis: ${diag.diagnosis} (${Math.round(diag.confidence * 100)}%)`,
          confidence: diag.confidence
        })));
      }

      setState(prev => ({
        ...prev,
        suggestions: suggestions.slice(0, 10), // Limit to top 10
        alerts: {
          contraindications,
          riskFactors
        }
      }));

    } catch (error) {
      console.error('Intelligent analysis failed:', error);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const executeVoiceCommand = useCallback(async (command: VoiceCommand) => {
    switch (command.action) {
      case 'add_to_section':
        // This would be handled by the parent component
        break;
        
      case 'check_interactions':
        const medications = extractMedications(state.currentTranscription);
        if (medications.length > 1) {
          await performIntelligentAnalysis(state.currentTranscription);
        }
        break;
        
      case 'suggest_diagnosis':
        try {
          const predictiveAnalysis = await performPredictiveAnalysis(
            '',
            state.currentTranscription,
            options.patient,
            options.patientHistory
          );
          
          const diagnosisSuggestions = predictiveAnalysis.diagnosisPredictions.map(diag => ({
            type: 'completion' as const,
            content: `💡 ${diag.diagnosis} (${Math.round(diag.confidence * 100)}% confidence)`,
            confidence: diag.confidence
          }));
          
          setState(prev => ({
            ...prev,
            suggestions: [...prev.suggestions, ...diagnosisSuggestions]
          }));
        } catch (error) {
          console.error('Failed to get diagnosis suggestions:', error);
        }
        break;
        
      case 'complete_note':
      case 'save_session':
        // These would be handled by the parent component
        break;
    }
  }, [state.currentTranscription, options.patient, options.patientHistory]);

  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  const clearAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: { contraindications: [], riskFactors: [] }
    }));
  }, []);

  const updateTranscription = useCallback((text: string) => {
    setState(prev => ({ ...prev, currentTranscription: text }));
    
    // Update real-time processor
    if (processorRef.current) {
      processorRef.current.reset();
      const analysis = processorRef.current.addText(text);
      setState(prev => ({ ...prev, streamingAnalysis: analysis }));
    }
  }, []);

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
  };

  return {
    ...state,
    startListening,
    stopListening,
    executeVoiceCommand,
    clearSuggestions,
    clearAlerts,
    updateTranscription,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}