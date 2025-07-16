'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain,
  User,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  Zap,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Stethoscope,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react'
import { Consultation } from '@/types'

interface DiagnosticChallengeProps {
  consultation: Consultation
  aiDiagnosis: string[]
  doctorDiagnosis?: string[]
  onDoctorDiagnosisSubmit?: (diagnosis: string[]) => void
  onChallengeComplete?: (results: ChallengeResults) => void
}

interface ChallengeResults {
  accuracy: number
  matches: string[]
  misses: string[]
  aiSuggestions: string[]
  score: number
  feedback: string
  learningPoints: string[]
}

interface DiagnosticOption {
  id: string
  diagnosis: string
  confidence: number
  reasoning: string
  icdCode?: string
}

export function DiagnosticChallenge({ 
  consultation, 
  aiDiagnosis, 
  doctorDiagnosis = [],
  onDoctorDiagnosisSubmit,
  onChallengeComplete
}: DiagnosticChallengeProps) {
  const [gamePhase, setGamePhase] = useState<'preparation' | 'challenge' | 'results'>('preparation')
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([])
  const [challengeResults, setChallengeResults] = useState<ChallengeResults | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [timeStarted, setTimeStarted] = useState<Date | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [doctorConfidence, setDoctorConfidence] = useState<{ [key: string]: number }>({})
  const [diagnosticOptions, setDiagnosticOptions] = useState<DiagnosticOption[]>([])

  // Generate diagnostic options from AI analysis - only once
  useEffect(() => {
    const options = [
      ...aiDiagnosis.map((diagnosis, index) => ({
        id: `ai_${index}`,
        diagnosis,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        reasoning: generateReasoning(diagnosis, consultation.content),
        icdCode: generateIcdCode(diagnosis)
      })),
      ...generateDistractorOptions(consultation.content, aiDiagnosis)
    ].sort(() => Math.random() - 0.5) // Randomize order
    
    setDiagnosticOptions(options)
  }, [aiDiagnosis, consultation.content])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gamePhase === 'challenge' && timeStarted) {
      interval = setInterval(() => {
        setTimeElapsed(Date.now() - timeStarted.getTime())
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gamePhase, timeStarted])

  const startChallenge = () => {
    setGamePhase('challenge')
    setTimeStarted(new Date())
  }

  const submitDiagnosis = () => {
    if (selectedDiagnoses.length === 0) return

    const results = calculateResults()
    setChallengeResults(results)
    setGamePhase('results')
    
    onDoctorDiagnosisSubmit?.(selectedDiagnoses)
    onChallengeComplete?.(results)
  }

  const calculateResults = (): ChallengeResults => {
    const matches = selectedDiagnoses.filter(diagnosis => 
      aiDiagnosis.some(ai => ai.toLowerCase().includes(diagnosis.toLowerCase()) || 
                            diagnosis.toLowerCase().includes(ai.toLowerCase()))
    )
    
    const misses = aiDiagnosis.filter(ai => 
      !selectedDiagnoses.some(selected => 
        selected.toLowerCase().includes(ai.toLowerCase()) || 
        ai.toLowerCase().includes(selected.toLowerCase())
      )
    )

    const accuracy = matches.length / Math.max(aiDiagnosis.length, selectedDiagnoses.length)
    const timeBonus = Math.max(0, 300 - timeElapsed / 1000) / 300 // Bonus for speed (max 5 min)
    const score = Math.round((accuracy * 80 + timeBonus * 20) * 100)

    const feedback = generateFeedback(accuracy, matches.length, misses.length, timeElapsed)
    const learningPoints = generateLearningPoints(misses, consultation.content)

    return {
      accuracy,
      matches,
      misses,
      aiSuggestions: aiDiagnosis.filter(ai => !matches.includes(ai)),
      score,
      feedback,
      learningPoints
    }
  }

  const toggleDiagnosis = (diagnosis: string) => {
    setSelectedDiagnoses(prev => 
      prev.includes(diagnosis) 
        ? prev.filter(d => d !== diagnosis)
        : [...prev, diagnosis]
    )
  }

  if (gamePhase === 'preparation') {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Trophy className="w-6 h-6" />
            <span>Diagnostic Challenge</span>
            <Badge variant="secondary" className="ml-2">Fun Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Stethoscope className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Test Your Diagnostic Skills!
            </h3>
            <p className="text-blue-700 mb-6">
              The AI has analyzed this consultation. Can you match or beat its diagnostic accuracy?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">Your Goal</h4>
              <p className="text-sm text-blue-700">Identify the correct diagnoses</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">Time Bonus</h4>
              <p className="text-sm text-blue-700">Faster = Higher score</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">Learning</h4>
              <p className="text-sm text-blue-700">Get AI insights & feedback</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Case Summary:</h4>
            <p className="text-sm text-blue-700 line-clamp-3">
              {consultation.content.substring(0, 200)}...
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={startChallenge} className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Start Challenge
            </Button>
            <Button variant="outline" onClick={() => setShowHints(!showHints)}>
              <Eye className="w-4 h-4 mr-2" />
              {showHints ? 'Hide' : 'Show'} Hints
            </Button>
          </div>

          {showHints && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Diagnostic Hints:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Look for key symptoms mentioned in the consultation</li>
                <li>• Consider patient age, gender, and medical history</li>
                <li>• Think about common conditions first, then rare ones</li>
                <li>• Consider differential diagnoses for symptoms</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (gamePhase === 'challenge') {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Brain className="w-6 h-6" />
              <span>Make Your Diagnosis</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-700">
                Time: {Math.floor(timeElapsed / 1000)}s
              </div>
              <Badge variant="outline" className="text-green-700">
                {selectedDiagnoses.length} selected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
            <h4 className="font-semibold text-green-900 mb-2">Patient Case:</h4>
            <p className="text-sm text-green-700">
              {consultation.content}
            </p>
          </div>

          <h4 className="font-semibold text-green-900">
            Select all diagnoses you think are correct:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {diagnosticOptions.map((option) => {
              const isSelected = selectedDiagnoses.includes(option.diagnosis)
              return (
                <div
                  key={option.id}
                  onClick={() => toggleDiagnosis(option.diagnosis)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-100' 
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{option.diagnosis}</h5>
                    {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  
                  {option.icdCode && (
                    <p className="text-xs text-gray-500 mb-1">ICD-10: {option.icdCode}</p>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-2">{option.reasoning}</p>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${option.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(option.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button 
              onClick={submitDiagnosis}
              disabled={selectedDiagnoses.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Diagnosis
            </Button>
            <Button variant="outline" onClick={() => setGamePhase('preparation')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gamePhase === 'results' && challengeResults) {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Trophy className="w-6 h-6" />
              <span>Challenge Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-purple-800 mb-2">
                {challengeResults.score}%
              </div>
              <div className="flex items-center justify-center space-x-2 mb-4">
                {challengeResults.score >= 90 && <Award className="w-6 h-6 text-yellow-500" />}
                {challengeResults.score >= 80 && <TrendingUp className="w-6 h-6 text-green-500" />}
                <span className="text-lg font-medium text-purple-700">
                  {challengeResults.score >= 90 ? 'Excellent!' : 
                   challengeResults.score >= 80 ? 'Great Job!' :
                   challengeResults.score >= 70 ? 'Good Work!' : 'Keep Learning!'}
                </span>
              </div>
              <p className="text-purple-700">{challengeResults.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">{challengeResults.matches.length}</div>
                <p className="text-sm text-green-700">Correct Matches</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-800">{challengeResults.misses.length}</div>
                <p className="text-sm text-red-700">Missed Diagnoses</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">{Math.floor(timeElapsed / 1000)}s</div>
                <p className="text-sm text-blue-700">Time Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <ThumbsUp className="w-5 h-5" />
                <span>Correct Diagnoses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challengeResults.matches.length > 0 ? (
                <div className="space-y-2">
                  {challengeResults.matches.map((match, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">{match}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No matches found</p>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Brain className="w-5 h-5" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challengeResults.aiSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {challengeResults.aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You matched all AI diagnoses!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Learning Points */}
        {challengeResults.learningPoints.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Sparkles className="w-5 h-5" />
                <span>Learning Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {challengeResults.learningPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-yellow-800">{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center space-x-4">
          <Button onClick={() => {
            setGamePhase('preparation')
            setSelectedDiagnoses([])
            setChallengeResults(null)
            setTimeStarted(null)
            setTimeElapsed(0)
          }}>
            Play Again
          </Button>
          <Button variant="outline">
            View Full Analysis
          </Button>
        </div>
      </div>
    )
  }

  return null
}

// Helper functions
function generateReasoning(diagnosis: string, content: string): string {
  const symptoms = extractSymptoms(content)
  return `Based on symptoms: ${symptoms.slice(0, 2).join(', ')}. Consider patient presentation and clinical history.`
}

function generateIcdCode(diagnosis: string): string {
  const codes: { [key: string]: string } = {
    'hypertension': 'I10',
    'diabetes': 'E11.9',
    'pneumonia': 'J18.9',
    'asthma': 'J45.9',
    'depression': 'F32.9',
    'anxiety': 'F41.1',
    'migraine': 'G43.9',
    'arthritis': 'M13.9'
  }
  
  for (const [condition, code] of Object.entries(codes)) {
    if (diagnosis.toLowerCase().includes(condition)) {
      return code
    }
  }
  return 'R06.9' // Default code for unspecified symptoms
}

function extractSymptoms(content: string): string[] {
  const commonSymptoms = [
    'fever', 'cough', 'headache', 'nausea', 'fatigue', 'dizziness',
    'chest pain', 'shortness of breath', 'abdominal pain', 'joint pain'
  ]
  
  return commonSymptoms.filter(symptom => 
    content.toLowerCase().includes(symptom)
  )
}

function generateDistractorOptions(content: string, aiDiagnosis: string[]): DiagnosticOption[] {
  const distractors = [
    'Common cold', 'Viral infection', 'Stress reaction', 'Medication side effect',
    'Dehydration', 'Sleep disorder', 'Nutritional deficiency'
  ]
  
  return distractors
    .filter(d => !aiDiagnosis.some(ai => ai.toLowerCase().includes(d.toLowerCase())))
    .slice(0, 3)
    .map((diagnosis, index) => ({
      id: `distractor_${index}`,
      diagnosis,
      confidence: Math.random() * 0.4 + 0.3, // 30-70% confidence
      reasoning: generateReasoning(diagnosis, content),
      icdCode: generateIcdCode(diagnosis)
    }))
}

function generateFeedback(accuracy: number, matches: number, misses: number, timeElapsed: number): string {
  const timeMinutes = Math.floor(timeElapsed / 1000 / 60)
  const timeBonus = timeElapsed < 180000 // under 3 minutes gets bonus points
  
  if (accuracy >= 0.9) {
    if (timeBonus) {
      return "🌟 MASTERFUL! Outstanding diagnostic accuracy achieved quickly. You demonstrate expert-level clinical reasoning!"
    }
    return "🏆 OUTSTANDING! Exceptional diagnostic accuracy. Your clinical skills are impressive!"
  } else if (accuracy >= 0.8) {
    if (timeBonus) {
      return "⭐ EXCELLENT! Great diagnostic skills with efficient decision-making. Well done!"
    }
    return "👏 EXCELLENT! You correctly identified most key diagnoses. Strong clinical judgment!"
  } else if (accuracy >= 0.7) {
    return "✅ GOOD WORK! Solid diagnostic approach. Review the missed items to enhance your skills further."
  } else if (accuracy >= 0.5) {
    return "📚 LEARNING MODE! Good foundation to build on. Focus on the feedback below to improve."
  } else {
    return "🎯 PRACTICE ROUND! Every expert started here. Use this feedback to sharpen your diagnostic skills!"
  }
}

function generateLearningPoints(misses: string[], content: string): string[] {
  return misses.map(miss => 
    `Consider ${miss} - look for supporting evidence in patient symptoms and history`
  )
}

export default DiagnosticChallenge