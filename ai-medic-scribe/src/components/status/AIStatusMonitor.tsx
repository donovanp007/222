'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Heart, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw,
  Info
} from 'lucide-react'
import { Patient, Session } from '@/types'

interface HealthMetric {
  id: string
  name: string
  value: number
  unit: string
  normalRange: { min: number; max: number }
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
  status: 'normal' | 'warning' | 'critical'
}

interface StatusAssessment {
  overallStatus: 'stable' | 'monitoring' | 'critical' | 'improving' | 'declining'
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  lastAssessment: Date
  keyFindings: string[]
  recommendations: string[]
  metrics: HealthMetric[]
  alertsCount: number
}

interface AIStatusMonitorProps {
  patient: Patient
  consultations: Session[]
  onStatusUpdate?: (assessment: StatusAssessment) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

export function AIStatusMonitor({ 
  patient, 
  consultations = [], 
  onStatusUpdate,
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}: AIStatusMonitorProps) {
  const [assessment, setAssessment] = useState<StatusAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    performStatusAssessment()
  }, [patient, consultations])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        performStatusAssessment()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const performStatusAssessment = async () => {
    setIsLoading(true)
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockAssessment = generateMockAssessment(patient, consultations)
      setAssessment(mockAssessment)
      setLastRefresh(new Date())
      onStatusUpdate?.(mockAssessment)
      
    } catch (error) {
      console.error('Status assessment failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockAssessment = (patient: Patient, consultations: Session[]): StatusAssessment => {
    // Mock health metrics based on patient data
    const mockMetrics: HealthMetric[] = [
      {
        id: 'bp_systolic',
        name: 'Blood Pressure (Systolic)',
        value: 135,
        unit: 'mmHg',
        normalRange: { min: 90, max: 140 },
        trend: 'stable',
        lastUpdated: new Date(),
        status: 'normal'
      },
      {
        id: 'bp_diastolic',
        name: 'Blood Pressure (Diastolic)',
        value: 85,
        unit: 'mmHg',
        normalRange: { min: 60, max: 90 },
        trend: 'down',
        lastUpdated: new Date(),
        status: 'normal'
      },
      {
        id: 'glucose',
        name: 'Blood Glucose',
        value: 7.2,
        unit: 'mmol/L',
        normalRange: { min: 4.0, max: 7.8 },
        trend: 'stable',
        lastUpdated: new Date(),
        status: 'normal'
      }
    ]

    // Determine overall status based on recent consultations
    let overallStatus: StatusAssessment['overallStatus'] = 'stable'
    let riskLevel: StatusAssessment['riskLevel'] = 'low'
    
    if (consultations.length > 0) {
      const recentConsultation = consultations[0]
      if (recentConsultation.content.toLowerCase().includes('improving')) {
        overallStatus = 'improving'
      } else if (recentConsultation.content.toLowerCase().includes('concern')) {
        overallStatus = 'monitoring'
        riskLevel = 'medium'
      }
    }

    return {
      overallStatus,
      riskLevel,
      confidence: 0.87,
      lastAssessment: new Date(),
      keyFindings: [
        'Blood pressure within target range',
        'Glucose levels well controlled',
        'No acute concerns identified',
        'Medication compliance good'
      ],
      recommendations: [
        'Continue current medication regimen',
        'Monitor blood pressure weekly',
        'Follow-up in 4-6 weeks',
        'Maintain current lifestyle modifications'
      ],
      metrics: mockMetrics,
      alertsCount: 0
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100'
      case 'improving': return 'text-blue-600 bg-blue-100'
      case 'monitoring': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      case 'declining': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getMetricStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (!assessment && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Click to generate AI status assessment</p>
          <Button onClick={performStatusAssessment} className="mt-3">
            Generate Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span>AI Health Status Monitor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {assessment && (
              <>
                <Badge className={getStatusColor(assessment.overallStatus)}>
                  {assessment.overallStatus.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={getRiskColor(assessment.riskLevel)}>
                  {assessment.riskLevel.toUpperCase()} RISK
                </Badge>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={performStatusAssessment}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-600">AI analyzing patient status...</p>
          </div>
        ) : assessment ? (
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{Math.round(assessment.confidence * 100)}%</div>
                <div className="text-sm text-gray-500">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{assessment.metrics.length}</div>
                <div className="text-sm text-gray-500">Metrics Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{assessment.alertsCount}</div>
                <div className="text-sm text-gray-500">Active Alerts</div>
              </div>
            </div>

            {/* Health Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Health Metrics</h4>
              <div className="space-y-3">
                {assessment.metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getMetricStatusIcon(metric.status)}
                      <div>
                        <div className="font-medium text-sm">{metric.name}</div>
                        <div className="text-xs text-gray-500">
                          Normal: {metric.normalRange.min}-{metric.normalRange.max} {metric.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">
                        {metric.value} {metric.unit}
                      </span>
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Findings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {assessment.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
              <ul className="space-y-2">
                {assessment.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Last Update */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
              <span>Last assessment: {assessment.lastAssessment.toLocaleString()}</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Updated {Math.round((Date.now() - lastRefresh.getTime()) / 60000)} min ago</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default AIStatusMonitor