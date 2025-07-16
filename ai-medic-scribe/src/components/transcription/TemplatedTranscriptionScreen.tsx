"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Mic, Square, Save, Settings, FileText, Sparkles, RotateCcw, Code, AlertCircle, Pause, Play, Clock, Brain, Edit, Mail, Zap, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiSettings, getStoredApiKey } from "../settings/ApiSettings";
import { LanguageSettings, getSelectedLanguage } from "../settings/LanguageSettings";
import { VoiceEnhancementSettings } from "../settings/VoiceEnhancementSettings";
import { FileManagerInterface } from "../media/FileManagerInterface";
import { EmailComposer } from "../communication/EmailComposer";
import { TemplateSelector } from "../templates/TemplateSelector";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { categorizeContent, suggestTemplate, aiCategorizeContent } from "@/utils/contentCategorization";
import { createIntelligentMedicalNote, IntelligentAnalysis } from "@/utils/intelligentFormatting";
import { IntelligentMedicalNote } from "./IntelligentMedicalNote";
import { AIBehaviorSettings, getStoredAIConfig } from "../settings/AIBehaviorSettings";
import { SmartRecordingInterface } from "./SmartRecordingInterface";
import { DocumentOutputRenderer } from "./DocumentOutputRenderer";
import { AudioUploadInterface } from "./AudioUploadInterface";
import { Template, SECTION_TYPES } from "@/types/template";
import { DEFAULT_TEMPLATES } from "@/data/defaultTemplates";
import { Patient } from "@/types";

interface TemplatedTranscriptionScreenProps {
  patient: Patient;
  onBack: () => void;
  onSaveSession?: (content: string, audioBlob?: Blob, templateData?: Record<string, string>) => void;
}

export function TemplatedTranscriptionScreen({ patient, onBack, onSaveSession }: TemplatedTranscriptionScreenProps) {
  const {
    recordingState,
    duration,
    audioBlob,
    isTranscribing,
    currentSession,
    voiceCommands,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    transcribeAudio,
    enhanceTranscribedText,
    clearVoiceCommands,
    formatDuration,
    formatTimestamp,
    streamRef,
  } = useAudioRecording();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [rawTranscription, setRawTranscription] = useState("");
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [autoCategorizationEnabled] = useState(true);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiCategorizationError, setAiCategorizationError] = useState<string | null>(null);
  const [intelligentAnalysis, setIntelligentAnalysis] = useState<IntelligentAnalysis | null>(null);
  const [isGeneratingIntelligentNote, setIsGeneratingIntelligentNote] = useState(false);
  const [showIntelligentView, setShowIntelligentView] = useState(true);
  const [manualNotes, setManualNotes] = useState("");
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [viewMode, setViewMode] = useState<'recording' | 'upload' | 'document'>('recording');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Waveform visualization
  const drawWaveform = useCallback(() => {
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

      // Clear canvas
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 3;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [recordingState]);

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
  }, [recordingState, streamRef, drawWaveform]);

  const handleTranscription = useCallback(async () => {
    if (!audioBlob) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setTranscriptionError("OpenAI API key not configured. Please set it up in settings.");
      return;
    }

    setTranscriptionError(null);
    
    try {
      const selectedLanguage = getSelectedLanguage();
      const result = await transcribeAudio(audioBlob, apiKey, selectedLanguage);
      const rawText = typeof result === 'string' ? result : result.text;
      
      // Enhance transcribed text with voice processing features
      const enhancedText = enhanceTranscribedText(rawText);
      setRawTranscription(enhancedText);
      
      // Auto-suggest template if none selected
      if (!selectedTemplate && autoCategorizationEnabled) {
        const suggestion = suggestTemplate(enhancedText, DEFAULT_TEMPLATES);
        if (suggestion && suggestion.confidence > 0.4) {
          const suggestedTemplate = DEFAULT_TEMPLATES.find(t => t.id === suggestion.templateId);
          if (suggestedTemplate) {
            setSelectedTemplate(suggestedTemplate);
          }
        }
      }
      
      // Auto-categorize content if template is selected
      if (selectedTemplate && autoCategorizationEnabled) {
        if (showIntelligentView) {
          await generateIntelligentNote(enhancedText, selectedTemplate);
        } else {
          await aiCategorizeTranscription(enhancedText, selectedTemplate);
        }
      }
    } catch (error) {
      console.error("Transcription failed:", error);
      setTranscriptionError("Transcription failed. Please check your API key and try again.");
    }
  }, [audioBlob, selectedTemplate, autoCategorizationEnabled, showIntelligentView]);

  // Handle automatic transcription when recording stops
  useEffect(() => {
    if (recordingState === "stopped" && audioBlob) {
      handleTranscription();
    }
  }, [recordingState, audioBlob, handleTranscription]);

  const categorizeTranscription = (text: string, template: Template) => {
    const categorizations = categorizeContent(text, template.sections);
    const newTemplateData = { ...templateData };
    
    for (const cat of categorizations) {
      if (cat.confidence > 0.4) {
        const existingContent = newTemplateData[cat.sectionId] || "";
        newTemplateData[cat.sectionId] = existingContent 
          ? `${existingContent}\n\n${cat.suggestedContent}`
          : cat.suggestedContent;
      }
    }
    
    setTemplateData(newTemplateData);
  };

  const generateIntelligentNote = async (text: string, template: Template) => {
    setIsGeneratingIntelligentNote(true);
    setAiCategorizationError(null);
    
    try {
      const patientContext = `Patient: ${patient.name}, Age: ${patient.age}`;
      const aiConfig = getStoredAIConfig();
      const analysis = await createIntelligentMedicalNote(text, template, patientContext, aiConfig);
      setIntelligentAnalysis(analysis);
      
      // Also populate template data for compatibility
      const newTemplateData = { ...templateData };
      if (analysis.formattedSections) {
        for (const section of analysis.formattedSections) {
          newTemplateData[section.sectionId] = section.content;
        }
        setTemplateData(newTemplateData);
      }
      
    } catch (error) {
      console.error('Intelligent note generation failed:', error);
      setAiCategorizationError('AI analysis failed. Using basic categorization...');
      // Fallback to basic categorization
      await aiCategorizeTranscription(text, template);
    } finally {
      setIsGeneratingIntelligentNote(false);
    }
  };

  const aiCategorizeTranscription = async (text: string, template: Template) => {
    setIsAiCategorizing(true);
    setAiCategorizationError(null);
    
    try {
      const result = await aiCategorizeContent(text, template);
      const newTemplateData = { ...templateData };
      
      for (const cat of result.categorizations) {
        if (cat.confidence > 0.6) {
          const existingContent = newTemplateData[cat.sectionId] || "";
          
          // Format content with ICD-10 codes if available
          let formattedContent = cat.content;
          if (cat.icd10Codes && cat.icd10Codes.length > 0) {
            const icdCodes = cat.icd10Codes
              .map(icd => `• ${icd.code}: ${icd.description}`)
              .join('\n');
            formattedContent = `${cat.content}\n\n📅 Related ICD-10 Codes:\n${icdCodes}`;
          }
          
          newTemplateData[cat.sectionId] = existingContent 
            ? `${existingContent}\n\n${formattedContent}`
            : formattedContent;
        }
      }
      
      setTemplateData(newTemplateData);
    } catch (error) {
      console.error('AI categorization failed:', error);
      setAiCategorizationError('AI analysis failed. Using basic categorization...');
      // Fallback to basic categorization
      categorizeTranscription(text, template);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const updateVoiceSettings = () => {
    // Handle voice settings update
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleSave = () => {
    if (onSaveSession) {
      let finalContent = '';
      
      if (selectedTemplate) {
        // Template-based content
        const templateContent = Object.entries(templateData).map(([sectionId, content]) => {
          const section = selectedTemplate.sections.find(s => s.id === sectionId);
          return content ? `**${section?.title || 'Section'}:**\n${content}` : '';
        }).filter(Boolean).join('\n\n');
        
        finalContent = templateContent;
        
        // Add manual notes if present
        if (manualNotes.trim()) {
          finalContent += finalContent ? '\n\n**Manual Notes & Additional Observations:**\n' + manualNotes : manualNotes;
        }
      } else {
        // Free-form content with manual notes
        finalContent = rawTranscription;
        if (manualNotes.trim()) {
          finalContent += finalContent ? '\n\n**Additional Notes:**\n' + manualNotes : manualNotes;
        }
      }
      
      // Include manual notes in template data for export
      const extendedTemplateData = {
        ...templateData,
        ...(manualNotes.trim() && { manual_notes: manualNotes }),
        patient_name: patient.name,
        patient_age: patient.age,
        session_date: new Date().toISOString(),
        duration: formatDuration(duration)
      };
      
      // Show success feedback
      console.log('Session saved successfully for patient:', patient.name);
      
      onSaveSession(finalContent, audioBlob || undefined, extendedTemplateData);
    }
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    setTemplateData(prev => ({
      ...prev,
      [sectionId]: content
    }));
  };

  const resetSession = () => {
    resetRecording();
    setRawTranscription("");
    setTemplateData({});
    setTranscriptionError(null);
    setSelectedTemplate(null);
    setIntelligentAnalysis(null);
    setIsGeneratingIntelligentNote(false);
    setUploadProgress(0);
  };

  const transcribeUploadedFile = async (file: File): Promise<string> => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    setUploadProgress(0);
    setTranscriptionError(null);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', getSelectedLanguage());

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      const transcription = data.text || '';
      
      // Update progress
      setUploadProgress(100);
      
      // Set the transcription
      setRawTranscription(transcription);
      
      // Auto-categorize if template is selected
      if (selectedTemplate && autoCategorizationEnabled) {
        if (showIntelligentView) {
          await generateIntelligentNote(transcription, selectedTemplate);
        } else {
          await aiCategorizeTranscription(transcription, selectedTemplate);
        }
      }
      
      // Switch to recording view to see results
      setViewMode('recording');
      
      return transcription;
    } catch (error) {
      console.error('File transcription error:', error);
      setTranscriptionError(error instanceof Error ? error.message : 'Transcription failed');
      throw error;
    }
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name, file.size, file.type);
    setUploadProgress(0);
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
              {selectedTemplate && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {selectedTemplate.name}
                </Badge>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'recording' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('recording')}
                  className="text-xs"
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Live
                </Button>
                <Button
                  variant={viewMode === 'upload' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('upload')}
                  className="text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
                <Button
                  variant={viewMode === 'document' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('document')}
                  className="text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Document
                </Button>
              </div>

              {/* AI Behavior Settings */}
              <AIBehaviorSettings 
                currentConfig={getStoredAIConfig()}
                onConfigChange={(config) => {
                  // Regenerate analysis if we have transcription and template
                  if (rawTranscription && selectedTemplate) {
                    generateIntelligentNote(rawTranscription, selectedTemplate);
                  }
                }}
              />
              
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <ApiSettings />
                    <LanguageSettings />
                    <VoiceEnhancementSettings 
                      onSettingsChange={updateVoiceSettings}
                      onSpeakerProfileAdd={(profile) => {
                        console.log('Speaker profile added:', profile);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {selectedTemplate ? 'Change Template' : 'Select Template'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Choose Template</DialogTitle>
                  </DialogHeader>
                  <TemplateSelector
                    onTemplateSelect={(template) => {
                      setSelectedTemplate(template);
                      setShowTemplateSelector(false);
                      // Re-categorize existing transcription if available
                      if (rawTranscription && autoCategorizationEnabled) {
                        if (showIntelligentView) {
                          generateIntelligentNote(rawTranscription, template);
                        } else {
                          aiCategorizeTranscription(rawTranscription, template);
                        }
                      }
                    }}
                    selectedTemplateId={selectedTemplate?.id}
                  />
                </DialogContent>
              </Dialog>

              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'recording' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* Recording Section */}
            <div className="space-y-6">
              <SmartRecordingInterface
                recordingState={recordingState}
                duration={duration}
                isTranscribing={isTranscribing}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onResetRecording={resetSession}
                formatDuration={formatDuration}
                voiceCommands={voiceCommands}
                streamRef={streamRef}
              />

              {/* Action Buttons */}
              {recordingState === "stopped" && (
                <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={resetSession}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New
                      </Button>
                      <Button
                        onClick={handleSave}
                        size="sm"
                        disabled={!rawTranscription.trim() && !Object.values(templateData).some(v => v.trim())}
                        className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!rawTranscription.trim() && !Object.values(templateData).some(v => v.trim())}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Email Medical Notes</DialogTitle>
                          </DialogHeader>
                          <EmailComposer
                            patient={patient}
                            initialTemplate="follow-up-care"
                            onSend={(message) => {
                              console.log('Session notes emailed:', message);
                              setShowEmailComposer(false);
                            }}
                            onClose={() => setShowEmailComposer(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {(transcriptionError || aiCategorizationError) && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-red-700 text-sm">
                        {transcriptionError || aiCategorizationError}
                      </p>
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
            </div>

            {/* Template/Transcription Section for Recording View */}
            <div className="space-y-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setShowIntelligentView(true)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showIntelligentView
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🧠 Intelligent View
                    </button>
                    <button
                      onClick={() => setShowIntelligentView(false)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        !showIntelligentView
                          ? 'bg-gray-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📝 Template View
                    </button>
                  </div>
                  
                  {autoCategorizationEnabled && rawTranscription && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showIntelligentView 
                        ? generateIntelligentNote(rawTranscription, selectedTemplate)
                        : aiCategorizeTranscription(rawTranscription, selectedTemplate)
                      }
                      disabled={isAiCategorizing || isGeneratingIntelligentNote}
                      className="text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {(isAiCategorizing || isGeneratingIntelligentNote) ? 'Analyzing...' : 'AI Analysis'}
                    </Button>
                  )}
                </div>

                {/* Intelligent View */}
                {showIntelligentView ? (
                  <IntelligentMedicalNote
                    analysis={intelligentAnalysis}
                    isGenerating={isGeneratingIntelligentNote}
                    manualNotes={manualNotes}
                    onManualNotesChange={setManualNotes}
                    onSectionEdit={(sectionId, newContent) => {
                      if (intelligentAnalysis && intelligentAnalysis.formattedSections) {
                        const updatedAnalysis = {
                          ...intelligentAnalysis,
                          formattedSections: intelligentAnalysis.formattedSections.map(section =>
                            section.sectionId === sectionId 
                              ? { ...section, content: newContent }
                              : section
                          )
                        };
                        setIntelligentAnalysis(updatedAnalysis);
                        
                        // Update template data too
                        setTemplateData(prev => ({
                          ...prev,
                          [sectionId]: newContent
                        }));
                      }
                    }}
                    onRegenerate={() => {
                      if (rawTranscription && selectedTemplate) {
                        generateIntelligentNote(rawTranscription, selectedTemplate);
                      }
                    }}
                  />
                ) : (
                  /* Template View */
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          {selectedTemplate.name}
                        </div>
                      </CardTitle>
                    </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate.sections.map((section) => {
                    const sectionType = SECTION_TYPES[section.type as keyof typeof SECTION_TYPES];
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {section.title}
                            {section.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${sectionType?.color || 'bg-gray-50 border-gray-200 text-gray-800'}`}
                          >
                            {section.type}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            placeholder={section.placeholder}
                            value={templateData[section.id] || ""}
                            onChange={(e) => updateSectionContent(section.id, e.target.value)}
                            className="min-h-[80px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-medium leading-relaxed"
                          />
                          {/* Show ICD-10 codes if present in content */}
                          {templateData[section.id]?.includes('📅 Related ICD-10 Codes:') && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                                <Code className="w-4 h-4" />
                                Suggested ICD-10 Codes
                              </div>
                              <div className="text-xs text-blue-600">
                                💡 These codes were automatically suggested based on the transcribed content
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Manual Notes Section */}
                  <div className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Edit className="w-4 h-4 text-purple-600" />
                        Manual Notes & Additional Observations
                      </label>
                      <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-800">
                        manual
                      </Badge>
                    </div>
                    <Textarea
                      placeholder="Add any additional notes, observations, or free-form text here. This section allows you to type or dictate additional information that may not fit into the template sections above..."
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="min-h-[120px] border-gray-200 focus:border-purple-500 focus:ring-purple-500 font-medium leading-relaxed bg-purple-50/30"
                    />
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>💡 Tip: You can combine voice dictation with manual typing for complete documentation</span>
                    </div>
                  </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                  <p className="text-gray-500 mb-6">
                    Choose a template to structure your medical notes, or continue with free-form transcription.
                  </p>
                  <Button
                    onClick={() => setShowTemplateSelector(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Select Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Session Timeline */}
            {currentSession && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Clock className="w-4 h-4" />
                    Recording Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <div className="font-medium">{formatTimestamp(currentSession.startTime.getTime())}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Duration:</span>
                        <div className="font-medium">{formatDuration(duration)}</div>
                      </div>
                    </div>
                    
                    {currentSession.segments.length > 1 && (
                      <div className="border-t pt-3">
                        <div className="text-xs text-gray-500 mb-2">Recording Segments:</div>
                        <div className="space-y-1">
                          {currentSession.segments.map((segment, index) => (
                            <div key={segment.id} className="flex justify-between items-center text-xs bg-gray-50 rounded p-2">
                              <span>Segment {index + 1}</span>
                              <span className="text-gray-600">
                                {formatTimestamp(segment.startTime)} - {segment.endTime ? formatTimestamp(segment.endTime) : 'Recording...'}
                              </span>
                              <span className="font-medium">{formatDuration(segment.duration)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Transcription */}
            {rawTranscription && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Raw Transcription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      value={rawTranscription}
                      onChange={(e) => setRawTranscription(e.target.value)}
                      className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-medium leading-relaxed text-gray-800"
                      placeholder="Transcribed text will appear here..."
                    />
                    {rawTranscription && selectedTemplate && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs text-amber-700">
                          Use &quot;AI Analysis&quot; to automatically categorize this content into the template sections above.
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Files */}
            <FileManagerInterface
              patient={patient}
              sessionId={currentSession?.id}
              compact={true}
            />
          </div>
        </div>
        ) : viewMode === 'upload' ? (
          /* Upload View Mode */
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    Upload Audio Recording
                  </CardTitle>
                  <p className="text-gray-600">
                    Upload pre-recorded audio files for transcription. Perfect for when you have poor signal or recorded offline.
                  </p>
                </CardHeader>
              </Card>

              <AudioUploadInterface
                onFileUpload={handleFileUpload}
                onTranscribeFile={transcribeUploadedFile}
                isTranscribing={isTranscribing}
                transcriptionProgress={uploadProgress}
              />

              {/* Show transcription results */}
              {rawTranscription && (
                <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Transcription Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">Transcribed Text:</div>
                        <div className="text-gray-900 leading-relaxed">{rawTranscription}</div>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={() => setViewMode('recording')}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit & Process
                        </Button>
                        
                        {selectedTemplate && (
                          <Button
                            onClick={() => setViewMode('document')}
                            variant="outline"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Document
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Template selection for upload mode */}
              {!selectedTemplate && (
                <Card className="border border-gray-200">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                    <p className="text-gray-500 mb-6">
                      Choose a template to structure your transcribed content into a professional medical note.
                    </p>
                    <Button
                      onClick={() => setShowTemplateSelector(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Select Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Document View Mode */
          <div className="w-full">
            {selectedTemplate && intelligentAnalysis ? (
              <DocumentOutputRenderer
                analysis={intelligentAnalysis}
                patient={patient}
                template={selectedTemplate}
                isGenerating={isGeneratingIntelligentNote}
                onSectionEdit={(sectionId, newContent) => {
                  if (intelligentAnalysis && intelligentAnalysis.formattedSections) {
                    const updatedAnalysis = {
                      ...intelligentAnalysis,
                      formattedSections: intelligentAnalysis.formattedSections.map(section =>
                        section.sectionId === sectionId 
                          ? { ...section, content: newContent }
                          : section
                      )
                    };
                    setIntelligentAnalysis(updatedAnalysis);
                    
                    // Update template data too
                    setTemplateData(prev => ({
                      ...prev,
                      [sectionId]: newContent
                    }));
                  }
                }}
                onExportPdf={() => {
                  // Implement PDF export
                  console.log('Exporting PDF...');
                }}
                onEmailDocument={() => {
                  setShowEmailComposer(true);
                }}
                onPrintDocument={() => {
                  window.print();
                }}
              />
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-4">No Document Generated</h3>
                  <p className="text-gray-500 mb-8">
                    Start a recording session and select a template to generate a beautiful medical document.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setViewMode('recording')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                    <Button
                      onClick={() => setShowTemplateSelector(true)}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Select Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Dialog for Document View */}
            <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
              <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Medical Document</DialogTitle>
                </DialogHeader>
                <EmailComposer
                  patient={patient}
                  initialTemplate="follow-up-care"
                  onSend={(message) => {
                    console.log('Document emailed:', message);
                    setShowEmailComposer(false);
                  }}
                  onClose={() => setShowEmailComposer(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}