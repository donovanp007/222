"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, Square, Save, Settings, FileText, Sparkles, RotateCcw, Code, AlertCircle, Pause, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiSettings, getStoredApiKey } from "../settings/ApiSettings";
import { LanguageSettings, getSelectedLanguage } from "../settings/LanguageSettings";
import { TemplateSelector } from "../templates/TemplateSelector";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { categorizeContent, suggestTemplate, aiCategorizeContent } from "@/utils/contentCategorization";
import { createIntelligentMedicalNote, IntelligentAnalysis } from "@/utils/intelligentFormatting";
import { IntelligentMedicalNote } from "./IntelligentMedicalNote";
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
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    transcribeAudio,
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

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
  }, [recordingState, streamRef]);

  const handleTranscription = async () => {
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
      const transcriptionText = typeof result === 'string' ? result : result.text;
      setRawTranscription(transcriptionText);
      
      // Auto-suggest template if none selected
      if (!selectedTemplate && autoCategorizationEnabled) {
        const suggestion = suggestTemplate(transcriptionText, DEFAULT_TEMPLATES);
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
          await generateIntelligentNote(transcriptionText, selectedTemplate);
        } else {
          await aiCategorizeTranscription(transcriptionText, selectedTemplate);
        }
      }
    } catch (error) {
      console.error("Transcription failed:", error);
      setTranscriptionError("Transcription failed. Please check your API key and try again.");
    }
  };

  // Handle automatic transcription when recording stops
  useEffect(() => {
    if (recordingState === "stopped" && audioBlob) {
      handleTranscription();
    }
  }, [recordingState, audioBlob]);

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
      const analysis = await createIntelligentMedicalNote(text, template, patientContext);
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
        const red = Math.floor(59 + intensity * (99 - 59));
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
      const finalContent = selectedTemplate 
        ? Object.entries(templateData).map(([sectionId, content]) => {
            const section = selectedTemplate.sections.find(s => s.id === sectionId);
            return content ? `**${section?.title || 'Section'}:**\n${content}` : '';
          }).filter(Boolean).join('\n\n')
        : rawTranscription;
      
      onSaveSession(finalContent, audioBlob || undefined, templateData);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Recording Section */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recording</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSession}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Status */}
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    {recordingState === "recording" && (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    {recordingState === "paused" && (
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    )}
                    <span className="text-lg font-medium text-gray-900">
                      {recordingState === "idle" && "Ready to Record"}
                      {recordingState === "recording" && "Recording..."}
                      {recordingState === "paused" && "Recording Paused"}
                      {recordingState === "stopped" && "Recording Complete"}
                      {isTranscribing && "Transcribing..."}
                    </span>
                  </div>
                  
                  {duration > 0 && (
                    <div className="text-2xl font-mono text-blue-600">
                      {formatDuration(duration)}
                    </div>
                  )}
                </div>

                {/* Waveform */}
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={80}
                    className="border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center">
                  {recordingState === "idle" && (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Mic className="w-6 h-6" />
                    </Button>
                  )}

                  {recordingState === "recording" && (
                    <div className="flex space-x-4">
                      <Button
                        size="lg"
                        onClick={pauseRecording}
                        className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Pause className="w-6 h-6" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Square className="w-6 h-6" />
                      </Button>
                    </div>
                  )}

                  {recordingState === "paused" && (
                    <div className="flex space-x-4">
                      <Button
                        size="lg"
                        onClick={resumeRecording}
                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Square className="w-6 h-6" />
                      </Button>
                    </div>
                  )}

                  {recordingState === "stopped" && (
                    <div className="flex space-x-4">
                      <Button
                        size="lg"
                        onClick={resetSession}
                        variant="outline"
                        className="px-6 py-3"
                      >
                        New Recording
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600"
                        disabled={!rawTranscription.trim() && !Object.values(templateData).some(v => v.trim())}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Session
                      </Button>
                    </div>
                  )}
                </div>

                {/* Transcription Loading/Error */}
                {(isTranscribing || isAiCategorizing || isGeneratingIntelligentNote) && (
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center space-y-3 text-gray-600">
                      {/* Elegant pulsing animation */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                        <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                        <div className="absolute inset-2 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        {isTranscribing && (
                          <div className="text-sm font-medium text-gray-700">Transcribing Audio</div>
                        )}
                        {isAiCategorizing && (
                          <div className="text-sm font-medium text-gray-700">AI Analysis in Progress</div>
                        )}
                        {isGeneratingIntelligentNote && (
                          <div className="text-sm font-medium text-gray-700">Creating Intelligent Medical Note</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {isTranscribing && 'Converting speech to text...'}
                          {isAiCategorizing && 'Categorizing content with ICD-10 codes...'}
                          {isGeneratingIntelligentNote && '🧠 AI analyzing clinical content and formatting professionally...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
              </CardContent>
            </Card>
          </div>

          {/* Template/Transcription Section */}
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
          </div>
        </div>
      </main>
    </div>
  );
}