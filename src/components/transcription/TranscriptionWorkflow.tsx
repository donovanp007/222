'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw,
  FileText,
  Brain,
  User,
  CheckCircle,
  Clock,
  Loader2,
  Save,
  Edit3,
  Sparkles,
  Trophy,
  Target
} from 'lucide-react'
import DiagnosticChallenge from './DiagnosticChallenge'
import { Patient, Consultation } from '@/types'
import { useConsultations } from '@/hooks/useConsultations'

interface TranscriptionWorkflowProps {
  patient: Patient
  onConsultationComplete?: (consultation: Consultation) => void
}

type WorkflowPhase = 'setup' | 'recording' | 'transcribing' | 'ai-analysis' | 'challenge' | 'review' | 'complete'

interface TranscriptionState {
  audioBlob: Blob | null
  transcription: string
  aiAnalysis: {
    diagnosis: string[]
    summary: string
    recommendations: string[]
    keyFindings: string[]
  } | null
  challengeResults: any | null
}

export function TranscriptionWorkflow({ patient, onConsultationComplete }: TranscriptionWorkflowProps) {
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('setup')
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    audioBlob: null,
    transcription: '',
    aiAnalysis: null,
    challengeResults: null
  })
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [consultationTitle, setConsultationTitle] = useState('')
  const [editMode, setEditMode] = useState(false)
  
  const { createConsultation } = useConsultations()

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Auto-trigger AI analysis when phase changes to ai-analysis
  useEffect(() => {
    if (currentPhase === 'ai-analysis') {
      processTranscription()
    }
  }, [currentPhase])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setTranscriptionState(prev => ({ ...prev, audioBlob: blob }))
        setCurrentPhase('transcribing')
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setCurrentPhase('recording')
      setRecordingTime(0)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const processTranscription = async () => {
    // Simulate transcription API call
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const mockTranscription = `Patient presents with complaint of persistent cough lasting 2 weeks. Reports dry cough, worse at night, no fever. No recent travel or sick contacts. Physical examination reveals clear lungs, no wheezing. Vital signs stable. Patient appears well. Discussed likely viral upper respiratory infection. Advised supportive care, return if symptoms worsen or persist beyond 3 weeks.`
    
    setTranscriptionState(prev => ({ 
      ...prev, 
      transcription: mockTranscription 
    }))
    setCurrentPhase('ai-analysis')
    await performAIAnalysis(mockTranscription)
  }

  const performAIAnalysis = async (transcription: string) => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockAnalysis = {
      diagnosis: ['Viral upper respiratory infection', 'Post-viral cough'],
      summary: 'Patient presents with a 2-week history of persistent dry cough, worse at night. Physical examination unremarkable. Likely viral etiology.',
      recommendations: [
        'Supportive care with rest and hydration',
        'Honey for cough symptom relief',
        'Return if symptoms persist beyond 3 weeks',
        'Consider further evaluation if fever develops'
      ],
      keyFindings: [
        'Dry cough for 2 weeks',
        'Worse at night',
        'No fever or systemic symptoms',
        'Clear lung examination',
        'No recent exposures'
      ]
    }
    
    setTranscriptionState(prev => ({ 
      ...prev, 
      aiAnalysis: mockAnalysis 
    }))
    setCurrentPhase('challenge')
  }

  const handleChallengeComplete = (results: any) => {
    setTranscriptionState(prev => ({ 
      ...prev, 
      challengeResults: results 
    }))
    setCurrentPhase('review')
  }

  const skipChallenge = () => {
    setCurrentPhase('review')
  }

  const saveConsultation = () => {
    if (!transcriptionState.aiAnalysis) return

    const consultationData = {
      patientId: patient.id,
      title: consultationTitle || `Consultation - ${new Date().toLocaleDateString()}`,
      content: transcriptionState.transcription,
      visitDate: new Date(),
      diagnosis: transcriptionState.aiAnalysis.diagnosis,
      summary: transcriptionState.aiAnalysis.summary,
      recommendations: transcriptionState.aiAnalysis.recommendations,
      challengeResults: transcriptionState.challengeResults
    }

    const consultationId = createConsultation(consultationData)
    setCurrentPhase('complete')
    
    onConsultationComplete?.({
      ...consultationData,
      id: consultationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false,
      suggestedTasks: [],
      exportHistory: []
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Setup Phase
  if (currentPhase === 'setup') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>New Consultation - {patient.name} {patient.surname}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Consultation Title (Optional)</label>
            <input 
              type="text"
              value={consultationTitle}
              onChange={(e) => setConsultationTitle(e.target.value)}
              placeholder="e.g., Follow-up visit, Acute symptoms"
              className="w-full p-3 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Mic className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold">Ready to Record</h3>
            <p className="text-gray-600">
              Press the button below to start recording your consultation with {patient.name}
            </p>
            <Button 
              onClick={startRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Recording Phase
  if (currentPhase === 'recording') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-red-600">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span>Recording in Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-4xl font-mono font-bold text-red-600">
            {formatTime(recordingTime)}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={stopRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Speak clearly and ensure good audio quality for best transcription results
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transcribing Phase
  if (currentPhase === 'transcribing') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Transcription</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold">Converting Speech to Text</h3>
            <p className="text-gray-600">
              Using AI to transcribe your consultation recording...
            </p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // AI Analysis Phase
  if (currentPhase === 'ai-analysis') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Analysis in Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Analyzing Medical Content</h3>
            <p className="text-gray-600">
              AI is processing the transcription to identify key findings, diagnosis, and recommendations...
            </p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '80%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Challenge Phase
  if (currentPhase === 'challenge' && transcriptionState.aiAnalysis) {
    const mockConsultation: Consultation = {
      id: 'temp',
      patientId: patient.id,
      title: consultationTitle || 'Current Consultation',
      content: transcriptionState.transcription,
      visitDate: new Date(),
      diagnosis: transcriptionState.aiAnalysis.diagnosis,
      summary: transcriptionState.aiAnalysis.summary,
      recommendations: transcriptionState.aiAnalysis.recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false,
      suggestedTasks: [],
      exportHistory: []
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Challenge Introduction */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-blue-900">
                    🎯 Diagnostic Challenge Ready!
                  </h3>
                  <p className="text-blue-700">
                    Test your diagnostic skills against our AI analysis
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setCurrentPhase('challenge')} className="bg-blue-600 hover:bg-blue-700">
                  <Target className="w-4 h-4 mr-2" />
                  Take Challenge
                </Button>
                <Button variant="outline" onClick={skipChallenge}>
                  Skip Challenge
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DiagnosticChallenge
          consultation={mockConsultation}
          aiDiagnosis={transcriptionState.aiAnalysis.diagnosis}
          onChallengeComplete={handleChallengeComplete}
        />
      </div>
    )
  }

  // Review Phase
  if (currentPhase === 'review') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Consultation Review</h2>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {editMode ? 'View Mode' : 'Edit Mode'}
            </Button>
            <Button onClick={saveConsultation} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Consultation
            </Button>
          </div>
        </div>

        {/* Challenge Results Summary */}
        {transcriptionState.challengeResults && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-green-900">Challenge Completed!</h3>
                  <p className="text-green-700">
                    Score: {transcriptionState.challengeResults.score}% | 
                    Accuracy: {Math.round(transcriptionState.challengeResults.accuracy * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcription */}
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <textarea
                value={transcriptionState.transcription}
                onChange={(e) => setTranscriptionState(prev => ({ 
                  ...prev, 
                  transcription: e.target.value 
                }))}
                className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {transcriptionState.transcription}
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Results */}
        {transcriptionState.aiAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Diagnosis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transcriptionState.aiAnalysis.diagnosis.map((diagnosis, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {diagnosis}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {transcriptionState.aiAnalysis.summary}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {transcriptionState.aiAnalysis.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{finding}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {transcriptionState.aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Complete Phase
  if (currentPhase === 'complete') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span>Consultation Saved Successfully</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">All Done!</h3>
            <p className="text-gray-600">
              The consultation has been saved and is available in the patient's history.
            </p>
            
            {transcriptionState.challengeResults && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Challenge Results</h4>
                <p className="text-blue-700">
                  Final Score: {transcriptionState.challengeResults.score}%
                </p>
                <p className="text-sm text-blue-600">
                  {transcriptionState.challengeResults.feedback}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={() => window.location.reload()}>
              New Consultation
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

export default TranscriptionWorkflow