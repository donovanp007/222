"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Mic, Square, Save, Settings, Brain, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RichTextEditor, { RichTextEditorRef } from "@/components/ui/rich-text-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiSettings, getStoredApiKey } from "../settings/ApiSettings";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { Patient, Session } from "@/types";
import { createRealTimeProcessor, StreamingAnalysisResult } from "@/utils/realTimeAnalysis";
import { performPredictiveAnalysis, AutoCompletionSuggestion } from "@/utils/predictiveFeatures";
import { performClinicalDecisionSupport, ContraindicationAlert, RiskFactor } from "@/utils/clinicalDecisionSupport";
import { extractMedications } from "@/utils/contentCategorization";
import { DEFAULT_TEMPLATES } from "@/data/defaultTemplates";
import { AILearningPanel } from "./AILearningPanel";
import { useAILearning } from "@/hooks/useAILearning";
// TODO: Create missing components
// import PrescriptionManager from "@/components/prescriptions/PrescriptionManager";
// import FollowUpManager from "@/components/followup/FollowUpManager";
// import TranslationPanel from "@/components/translation/TranslationPanel";
// import EnhancedAudioUpload from "@/components/audio/EnhancedAudioUpload";
import { useGPT4oMiniTranscription } from "@/utils/gpt4oMiniTranscription";
import AIPatientDocumentGenerator from "@/components/documents/AIPatientDocumentGenerator";

interface TranscriptionScreenProps {
  patient: Patient;
  onBack: () => void;
  onSaveSession?: (content: string, audioBlob?: Blob) => void;
  patientHistory?: Session[];
}

export function TranscriptionScreen({ patient, onBack, onSaveSession, patientHistory = [] }: TranscriptionScreenProps) {
  const {
    recordingState,
    duration,
    audioBlob,
    isTranscribing,
    startRecording,
    stopRecording,
    resetRecording,
    transcribeAudio,
    formatDuration,
    streamRef,
  } = useAudioRecording();

  const [transcriptionText, setTranscriptionText] = useState("");
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Real-time intelligence state
  const [realTimeProcessor, setRealTimeProcessor] = useState<ReturnType<typeof createRealTimeProcessor> | null>(null);
  const [streamingAnalysis, setStreamingAnalysis] = useState<StreamingAnalysisResult | null>(null);
  const [autoCompletions, setAutoCompletions] = useState<AutoCompletionSuggestion[]>([]);
  const [contraindications, setContraindications] = useState<ContraindicationAlert[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [currentCursorPosition, setCurrentCursorPosition] = useState(0);
  
  // GPT-4o Mini Transcription
  const { transcribeAudio: transcribeWithGPT4o, isTranscribing: isGPT4oTranscribing } = useGPT4oMiniTranscription();
  
  // AI Learning Assistant
  const aiLearning = useAILearning({
    patient,
    patientHistory,
    enabledFeatures: {
      treatmentRecommendations: true,
      learningInsights: true,
      drugInteractions: true,
      diagnosticSuggestions: true,
      continuousLearning: true
    },
    debounceMs: 1500
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const richTextEditorRef = useRef<RichTextEditorRef>(null);

  // Initialize real-time processor
  useEffect(() => {
    const template = DEFAULT_TEMPLATES[0]; // Use default template for now
    const processor = createRealTimeProcessor(template);
    setRealTimeProcessor(processor);
  }, []);

  // Real-time text analysis
  const analyzeTextIntelligently = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) return;

    try {
      // Extract medications for clinical decision support
      const medications = extractMedications(text);
      
      // Perform clinical decision support analysis
      if (medications.length > 0) {
        const clinicalSupport = await performClinicalDecisionSupport(
          text,
          patient,
          patientHistory,
          medications
        );
        
        setContraindications(clinicalSupport.contraindications);
        setRiskFactors(clinicalSupport.riskFactors);
      }

      // Get predictive analysis
      const predictiveAnalysis = await performPredictiveAnalysis(
        text.substring(currentCursorPosition - 10, currentCursorPosition + 10),
        text,
        patient,
        patientHistory
      );
      
      setAutoCompletions(predictiveAnalysis.autoCompletions);
    } catch (error) {
      console.error('Intelligence analysis failed:', error);
    }
  }, [patient, patientHistory, currentCursorPosition]);

  // Handle real-time text changes
  const handleTextChange = useCallback((newText: string) => {
    setTranscriptionText(newText);
    
    // Update real-time processor
    if (realTimeProcessor && newText.length > transcriptionText.length) {
      const addedText = newText.substring(transcriptionText.length);
      const result = realTimeProcessor.addText(addedText);
      setStreamingAnalysis(result);
    }
    
    // Trigger AI Learning analysis
    aiLearning.analyzeContent(newText);
    
    // Debounced intelligent analysis
    const timeoutId = setTimeout(() => {
      analyzeTextIntelligently(newText);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [transcriptionText, realTimeProcessor, analyzeTextIntelligently, aiLearning]);

  // Set up waveform visualization when recording starts
  useEffect(() => {
    if (recordingState === "recording" && streamRef.current) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();
    }
  }, [recordingState, streamRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTranscription = async () => {
    if (!audioBlob) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setTranscriptionError("OpenAI API key not configured. Please set it up in settings.");
      return;
    }

    setTranscriptionError(null);
    
    try {
      // Use GPT-4o Mini enhanced transcription
      const result = await transcribeWithGPT4o(audioBlob, {
        apiKey,
        model: 'gpt-4o-mini',
        language: 'en',
        temperature: 0.1,
        enableMedicalTerminology: true,
        enableSAHealthContext: true
      });
      
      setTranscriptionText(result.text);
      
      // Log enhanced features for debugging
      console.log('GPT-4o Mini transcription result:', {
        medicalTermsDetected: result.medicalTermsDetected,
        saHealthContextApplied: result.saHealthContextApplied,
        cost: result.cost,
        processingTime: result.processingTime
      });
      
    } catch (error) {
      console.error("Enhanced transcription failed, falling back to standard:", error);
      
      // Fallback to standard transcription
      try {
        const result = await transcribeAudio(audioBlob, apiKey, 'auto');
        const transcriptionText = typeof result === 'string' ? result : result.text;
        setTranscriptionText(transcriptionText);
      } catch (fallbackError) {
        console.error("Fallback transcription failed:", fallbackError);
        setTranscriptionError("Transcription failed. Please check your API key and try again.");
      }
    }
  };

  // Handle automatic transcription when recording stops
  useEffect(() => {
    if (recordingState === "stopped" && audioBlob) {
      handleTranscription();
    }
  }, [recordingState, audioBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  // Waveform visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (recordingState !== "recording") return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const intensity = dataArray[i] / 255;
        const red = Math.floor(59 + intensity * (99 - 59)); // Blue range
        const green = Math.floor(130 + intensity * (179 - 130));
        const blue = Math.floor(246 + intensity * (255 - 246));
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleSave = () => {
    if (onSaveSession) {
      onSaveSession(transcriptionText, audioBlob || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mr-4 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              {/* Patient Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-500">Age {patient.age}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>API Configuration</DialogTitle>
                  </DialogHeader>
                  <ApiSettings />
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-xs">
                New Session
              </Badge>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Recording Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Recording Status */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {recordingState === "recording" && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="text-xl font-medium text-gray-900">
                {recordingState === "idle" && "Ready to Record"}
                {recordingState === "recording" && "Recording..."}
                {recordingState === "stopped" && "Recording Complete"}
                {isTranscribing && "Transcribing..."}
              </span>
            </div>
            
            {duration > 0 && (
              <div className="text-3xl font-mono text-blue-600">
                {formatDuration(duration)}
              </div>
            )}
          </div>

          {/* Waveform Visualization */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              className="border border-gray-200 rounded-lg bg-gray-50"
            />
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center space-x-6">
            {recordingState === "idle" && (
              <Button
                size="lg"
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "recording" && (
              <Button
                size="lg"
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "stopped" && (
              <div className="flex space-x-4">
                <Button
                  size="lg"
                  onClick={() => {
                    resetRecording();
                    setTranscriptionText("");
                    setTranscriptionError(null);
                  }}
                  variant="outline"
                  className="px-6 py-3"
                >
                  New Recording
                </Button>
                <Button
                  size="lg"
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600"
                  disabled={!transcriptionText.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Session
                </Button>
              </div>
            )}
          </div>

          {/* Transcription Loading */}
          {(isTranscribing || isGPT4oTranscribing) && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>
                  {isGPT4oTranscribing 
                    ? "Processing with GPT-4o Mini enhanced transcription..." 
                    : "Processing audio with Whisper AI..."
                  }
                </span>
              </div>
            </div>
          )}

          {/* Transcription Error */}
          {transcriptionError && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-red-700 text-sm">{transcriptionError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="text-red-600 border-red-300 hover:bg-red-100"
                  >
                    Configure API
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Text */}
          {transcriptionText && (
            <div className="space-y-4">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">Transcription</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
                        className="flex items-center space-x-1"
                      >
                        <Brain className="w-4 h-4" />
                        <span>AI Intelligence</span>
                        {(contraindications.length > 0 || riskFactors.length > 0 || aiLearning.totalInsights > 0) && (
                          <Badge variant="destructive" className="ml-1">
                            {contraindications.length + riskFactors.length + aiLearning.totalInsights}
                          </Badge>
                        )}
                      </Button>
                    </div>
                    <Badge variant="secondary">
                      {transcriptionText.split(' ').length} words
                    </Badge>
                  </div>
                  <RichTextEditor
                    ref={richTextEditorRef}
                    content={transcriptionText}
                    onChange={handleTextChange}
                    placeholder="Transcribed text will appear here... AI will provide intelligent suggestions as you type."
                    minHeight="200px"
                  />

                  {/* Translation Panel - TODO: Create component */}
                  {/* <TranslationPanel
                    originalText={transcriptionText}
                    onTranslationUpdate={(translatedText) => {
                      setTranscriptionText(translatedText);
                    }}
                    autoTranslate={true}
                    showConfidence={true}
                  /> */}
                  
                  {/* Auto-completion suggestions */}
                  {autoCompletions.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Smart Suggestions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {autoCompletions.slice(0, 5).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newText = transcriptionText + ' ' + suggestion.text;
                              handleTextChange(newText);
                            }}
                            className="text-xs bg-white hover:bg-blue-50"
                          >
                            {suggestion.text}
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Intelligence Panel */}
              {showIntelligencePanel && (
                <div className="space-y-4">
                  {/* AI Learning Assistant */}
                  <AILearningPanel
                    aiResponse={aiLearning.response}
                    isLoading={aiLearning.isLoading}
                    patient={patient}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Clinical Alerts */}
                  {contraindications.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-red-800">
                          <AlertTriangle className="w-5 h-5" />
                          <span>Clinical Alerts</span>
                          <Badge variant="destructive">{contraindications.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {contraindications.map((alert, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-red-900">{alert.medication}</div>
                                <div className="text-sm text-red-700">{alert.description}</div>
                                <div className="text-xs text-red-600 mt-1">
                                  Conflicts with: {alert.conflictWith}
                                </div>
                              </div>
                              <Badge 
                                variant={alert.severity === 'contraindicated' ? 'destructive' : 'secondary'}
                                className="ml-2"
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            {alert.alternatives && (
                              <div className="mt-2 text-xs text-gray-600">
                                Alternatives: {alert.alternatives.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Risk Factors */}
                  {riskFactors.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-orange-800">
                          <Activity className="w-5 h-5" />
                          <span>Risk Factors</span>
                          <Badge variant="secondary">{riskFactors.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {riskFactors.map((risk, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-orange-900">{risk.factor}</div>
                                <div className="text-sm text-orange-700">{risk.description}</div>
                              </div>
                              <Badge 
                                variant={risk.severity === 'high' || risk.severity === 'critical' ? 'destructive' : 'secondary'}
                                className="ml-2"
                              >
                                {risk.severity}
                              </Badge>
                            </div>
                            {risk.recommendations.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-orange-800 mb-1">Recommendations:</div>
                                <ul className="text-xs text-orange-700 space-y-1">
                                  {risk.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="mr-1">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Real-time Analysis */}
                  {streamingAnalysis && (
                    <Card className="border-blue-200 bg-blue-50 lg:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-blue-800">
                          <Brain className="w-5 h-5" />
                          <span>Real-time Analysis</span>
                          <Badge variant="secondary">
                            {Math.round(streamingAnalysis.completeness * 100)}% Complete
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">
                              {streamingAnalysis.urgencyLevel.toUpperCase()}
                            </div>
                            <div className="text-sm text-blue-700">Urgency Level</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">
                              {streamingAnalysis.suggestedActions.length}
                            </div>
                            <div className="text-sm text-blue-700">Suggested Actions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">
                              {Object.keys(streamingAnalysis.templateSections).filter(
                                key => streamingAnalysis.templateSections[key].content.length > 0
                              ).length}
                            </div>
                            <div className="text-sm text-blue-700">Populated Sections</div>
                          </div>
                        </div>
                        
                        {streamingAnalysis.suggestedActions.length > 0 && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-blue-800 mb-2">Suggested Actions:</div>
                            <div className="space-y-2">
                              {streamingAnalysis.suggestedActions.map((action, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                                  <span className="text-sm text-blue-900">{action.description}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {action.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  </div>
                </div>
              )}

              {/* Prescription Manager - TODO: Create component */}
              {/* <PrescriptionManager
                patient={patient}
                transcriptionText={transcriptionText}
                onPrescriptionGenerated={(prescription) => {
                  console.log('Prescription generated:', prescription);
                }}
              /> */}

              {/* Follow-up Manager - TODO: Create component */}
              {/* <FollowUpManager
                patient={patient}
                consultation={{
                  id: `temp_consultation_${Date.now()}`,
                  patientId: patient.id,
                  title: `Consultation - ${new Date().toLocaleDateString()}`,
                  content: transcriptionText,
                  visitDate: new Date(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  doctorId: 'current_doctor',
                  consultationType: 'consultation',
                  isLocked: false
                }}
                consultationContent={transcriptionText}
                onFollowUpScheduled={(reminder) => {
                  console.log('Follow-up scheduled:', reminder);
                }}
              /> */}

              {/* Enhanced Audio Upload - TODO: Create component */}
              {/* <EnhancedAudioUpload
                patient={patient}
                onTranscriptionComplete={(audioFile, transcription) => {
                  setTranscriptionText(prev => prev + '\n\n' + transcription);
                  console.log('Audio transcription completed:', transcription);
                }}
                onAudioStored={(audioFile) => {
                  console.log('Audio file stored:', audioFile);
                }}
                allowOfflineStorage={true}
              /> */}

              {/* AI Patient Document Generator */}
              <AIPatientDocumentGenerator
                patient={patient}
                consultationContent={transcriptionText}
                onDocumentGenerated={(document) => {
                  console.log('Patient document generated:', document);
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}