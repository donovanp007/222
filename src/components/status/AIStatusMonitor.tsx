'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Brain,
  Heart,
  Thermometer,
  Pill,
  Calendar,
  Target,
  Eye,
  Lightbulb
} from 'lucide-react'
import { Patient, Consultation } from '@/types'

interface HealthMetric {
  id: string
  name: string
  value: string | number
  unit?: string
  trend: 'improving' | 'stable' | 'declining' | 'critical'
  lastUpdated: Date
  targetRange?: string
  notes?: string
}

interface StatusAssessment {
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  keyFindings: string[]
  recommendations: string[]
  alerts: string[]
  nextAppointmentSuggestion: {
    timeframe: string
    reason: string
    urgency: 'routine' | 'follow-up' | 'urgent'
  }
  confidenceScore: number
}

interface AIStatusMonitorProps {
  patient: Patient
  consultations: Consultation[]
  onStatusUpdate?: (assessment: StatusAssessment) => void
}

export function AIStatusMonitor({ patient, consultations, onStatusUpdate }: AIStatusMonitorProps) {
  const [currentAssessment, setCurrentAssessment] = useState<StatusAssessment | null>(null)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)
  const [showDetailedView, setShowDetailedView] = useState(false)

  // Perform AI analysis of patient status
  const analyzePatientStatus = async () => {
    setIsAnalyzing(true)
    
    try {
      // Simulate AI analysis with realistic processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const lastConsultation = consultations[0]
      const assessment = generateStatusAssessment(patient, consultations, lastConsultation)
      const metrics = generateHealthMetrics(lastConsultation)
      
      setCurrentAssessment(assessment)
      setHealthMetrics(metrics)
      setLastAnalysis(new Date())
      onStatusUpdate?.(assessment)
      
    } catch (error) {
      console.error('Status analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate AI-powered status assessment
  const generateStatusAssessment = (
    patient: Patient, 
    consultations: Consultation[], 
    lastConsultation?: Consultation
  ): StatusAssessment => {
    if (!lastConsultation) {
      return {
        overallStatus: 'fair',
        riskLevel: 'medium',
        keyFindings: ['No recent consultation data available'],
        recommendations: ['Schedule consultation for comprehensive assessment'],
        alerts: [],
        nextAppointmentSuggestion: {
          timeframe: 'within 1-2 weeks',
          reason: 'Initial assessment required',
          urgency: 'follow-up'
        },
        confidenceScore: 0.3
      }
    }

    const consultationContent = lastConsultation.content.toLowerCase()
    const diagnosis = lastConsultation.diagnosis || []
    
    // Analyze content for health indicators
    const indicators = analyzeHealthIndicators(consultationContent, diagnosis)
    
    return {
      overallStatus: indicators.overallStatus,
      riskLevel: indicators.riskLevel,
      keyFindings: indicators.keyFindings,
      recommendations: indicators.recommendations,
      alerts: indicators.alerts,
      nextAppointmentSuggestion: indicators.nextAppointment,
      confidenceScore: indicators.confidenceScore
    }
  }

  // Analyze health indicators from consultation content
  const analyzeHealthIndicators = (content: string, diagnosis: string[]) => {
    const indicators = {
      overallStatus: 'good' as const,
      riskLevel: 'low' as const,
      keyFindings: [] as string[],
      recommendations: [] as string[],
      alerts: [] as string[],
      nextAppointment: {
        timeframe: 'in 3-6 months',
        reason: 'Routine follow-up',
        urgency: 'routine' as const
      },
      confidenceScore: 0.8
    }

    // Analyze for concerning symptoms
    const concerningSymptoms = [
      'chest pain', 'shortness of breath', 'severe headache', 'high fever',
      'severe pain', 'bleeding', 'confusion', 'dizziness'
    ]
    
    const foundConcerns = concerningSymptoms.filter(symptom => content.includes(symptom))
    
    if (foundConcerns.length > 0) {
      indicators.riskLevel = 'high'
      indicators.overallStatus = 'poor'
      indicators.alerts.push(`Concerning symptoms reported: ${foundConcerns.join(', ')}`)
      indicators.nextAppointment.timeframe = 'within 1-2 weeks'
      indicators.nextAppointment.urgency = 'urgent'
    }

    // Analyze chronic conditions
    const chronicConditions = ['diabetes', 'hypertension', 'heart disease', 'asthma']
    const foundConditions = chronicConditions.filter(condition => 
      content.includes(condition) || diagnosis.some(d => d.toLowerCase().includes(condition))
    )

    if (foundConditions.length > 0) {
      indicators.keyFindings.push(`Managing chronic conditions: ${foundConditions.join(', ')}`)
      indicators.recommendations.push('Continue regular monitoring of chronic conditions')
      
      if (foundConditions.length > 1) {
        indicators.riskLevel = 'medium'
        indicators.nextAppointment.timeframe = 'in 1-2 months'
      }
    }

    // Analyze medication compliance
    if (content.includes('medication') || content.includes('treatment')) {
      if (content.includes('compliant') || content.includes('taking as prescribed')) {
        indicators.keyFindings.push('Good medication compliance reported')
      } else if (content.includes('missed') || content.includes('stopped')) {
        indicators.alerts.push('Medication compliance concerns identified')
        indicators.recommendations.push('Review medication adherence strategies')
        indicators.riskLevel = 'medium'
      }
    }

    // Analyze vital signs mentions
    if (content.includes('blood pressure')) {
      if (content.includes('controlled') || content.includes('normal')) {
        indicators.keyFindings.push('Blood pressure well controlled')
      } else if (content.includes('elevated') || content.includes('high')) {
        indicators.alerts.push('Elevated blood pressure noted')
        indicators.recommendations.push('Monitor blood pressure more frequently')
      }
    }

    // Analyze lifestyle factors
    if (content.includes('exercise') || content.includes('diet')) {
      indicators.keyFindings.push('Lifestyle factors discussed')
      indicators.recommendations.push('Continue lifestyle modifications')
    }

    // Analyze follow-up needs
    if (content.includes('follow-up') || content.includes('return')) {
      indicators.recommendations.push('Follow-up appointment scheduled as discussed')
    }

    // Adjust overall assessment
    if (indicators.alerts.length > 2) {
      indicators.overallStatus = 'poor'
      indicators.riskLevel = 'high'
    } else if (indicators.alerts.length > 0) {
      indicators.overallStatus = 'fair'
      indicators.riskLevel = 'medium'
    }

    // Set confidence based on data quality
    if (content.length > 100 && diagnosis.length > 0) {
      indicators.confidenceScore = 0.9
    } else if (content.length > 50) {
      indicators.confidenceScore = 0.7
    } else {
      indicators.confidenceScore = 0.5
    }

    return indicators
  }

  // Generate health metrics from consultation
  const generateHealthMetrics = (consultation?: Consultation): HealthMetric[] => {
    if (!consultation) return []

    const metrics: HealthMetric[] = []
    const content = consultation.content.toLowerCase()

    // Extract vital signs and other metrics
    if (content.includes('blood pressure') || content.includes('bp')) {
      metrics.push({
        id: 'bp',
        name: 'Blood Pressure',
        value: content.includes('elevated') ? '145/90' : '125/80',
        unit: 'mmHg',
        trend: content.includes('elevated') ? 'declining' : 'stable',
        lastUpdated: consultation.visitDate,
        targetRange: '<140/90',
        notes: content.includes('elevated') ? 'Elevated, requires monitoring' : 'Within target range'
      })
    }

    if (content.includes('weight') || content.includes('bmi')) {
      metrics.push({
        id: 'weight',
        name: 'Weight',
        value: 75,
        unit: 'kg',
        trend: 'stable',
        lastUpdated: consultation.visitDate,
        targetRange: '65-80 kg'
      })
    }

    if (content.includes('diabetes') || content.includes('blood sugar') || content.includes('glucose')) {
      metrics.push({
        id: 'glucose',
        name: 'Blood Glucose',
        value: content.includes('elevated') ? 8.5 : 6.2,
        unit: 'mmol/L',
        trend: content.includes('controlled') ? 'improving' : 'stable',
        lastUpdated: consultation.visitDate,
        targetRange: '4.0-7.0',
        notes: 'Fasting glucose level'
      })
    }

    if (content.includes('pain')) {
      const painLevel = content.includes('severe') ? 7 : content.includes('mild') ? 3 : 5
      metrics.push({
        id: 'pain',
        name: 'Pain Level',
        value: painLevel,
        unit: '/10',
        trend: content.includes('improving') ? 'improving' : 'stable',
        lastUpdated: consultation.visitDate,
        targetRange: '0-3',
        notes: 'Self-reported pain scale'
      })
    }

    // Add medication adherence metric
    if (content.includes('medication')) {
      metrics.push({
        id: 'adherence',
        name: 'Medication Adherence',
        value: content.includes('compliant') ? '95%' : '80%',
        trend: 'stable',
        lastUpdated: consultation.visitDate,
        targetRange: '>90%',
        notes: 'Self-reported compliance'
      })
    }

    return metrics
  }

  // Auto-analyze on mount or when consultations change
  useEffect(() => {
    if (consultations.length > 0) {
      analyzePatientStatus()
    }
  }, [consultations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100 border-green-200'
      case 'good': return 'text-green-700 bg-green-100 border-green-200'
      case 'fair': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'poor': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-100'
      case 'medium': return 'text-yellow-700 bg-yellow-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'critical': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getMetricIcon = (metricId: string) => {
    switch (metricId) {
      case 'bp': return <Heart className="w-4 h-4" />
      case 'weight': return <Activity className="w-4 h-4" />
      case 'glucose': return <Thermometer className="w-4 h-4" />
      case 'pain': return <AlertTriangle className="w-4 h-4" />
      case 'adherence': return <Pill className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (!currentAssessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Status Monitor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            {isAnalyzing ? (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-600">Analyzing patient status...</p>
              </>
            ) : (
              <>
                <Brain className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-600">No consultation data available for analysis</p>
                <Button onClick={analyzePatientStatus} variant="outline">
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Status
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Status Assessment</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {Math.round(currentAssessment.confidenceScore * 100)}% confidence
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzePatientStatus}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Status */}
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentAssessment.overallStatus)}`}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {currentAssessment.overallStatus.toUpperCase()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall Status</p>
            </div>

            {/* Risk Level */}
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getRiskColor(currentAssessment.riskLevel)}`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {currentAssessment.riskLevel.toUpperCase()} RISK
              </div>
              <p className="text-xs text-gray-500 mt-1">Risk Level</p>
            </div>

            {/* Next Appointment */}
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                {currentAssessment.nextAppointmentSuggestion.timeframe}
              </div>
              <p className="text-xs text-gray-500 mt-1">Next Appointment</p>
            </div>
          </div>

          {lastAnalysis && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              Last analyzed: {lastAnalysis.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Metrics */}
      {healthMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Health Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthMetrics.map((metric) => (
                <div key={metric.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getMetricIcon(metric.id)}
                      <span className="font-medium text-sm">{metric.name}</span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-lg font-bold">
                      {metric.value}{metric.unit && <span className="text-sm font-normal text-gray-500"> {metric.unit}</span>}
                    </div>
                    
                    {metric.targetRange && (
                      <div className="text-xs text-gray-500">
                        Target: {metric.targetRange}
                      </div>
                    )}
                    
                    {metric.notes && (
                      <div className="text-xs text-gray-600">
                        {metric.notes}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      {metric.lastUpdated.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Findings & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Eye className="w-4 h-4" />
              <span>Key Findings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentAssessment.keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{finding}</span>
                </div>
              ))}
              
              {currentAssessment.keyFindings.length === 0 && (
                <p className="text-sm text-gray-500">No significant findings to report</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>AI Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentAssessment.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </div>
              ))}
              
              {currentAssessment.recommendations.length === 0 && (
                <p className="text-sm text-gray-500">No specific recommendations at this time</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {currentAssessment.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              <span>Clinical Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentAssessment.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-orange-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Appointment Details */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Calendar className="w-5 h-5" />
            <span>Next Appointment Recommendation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Timeframe: {currentAssessment.nextAppointmentSuggestion.timeframe}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Reason: {currentAssessment.nextAppointmentSuggestion.reason}</span>
            </div>
            <Badge 
              variant={currentAssessment.nextAppointmentSuggestion.urgency === 'urgent' ? 'destructive' : 'default'}
              className="mt-2"
            >
              {currentAssessment.nextAppointmentSuggestion.urgency.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIStatusMonitor