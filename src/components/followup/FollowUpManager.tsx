'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Clock, Plus, AlertTriangle, CheckCircle, Brain, Bell } from 'lucide-react'
import { Patient, Consultation, FollowUpReminder } from '@/types'
import RichTextEditor from '@/components/ui/rich-text-editor'

interface FollowUpSuggestion {
  type: 'routine' | 'urgent' | 'follow-test' | 'medication-review' | 'specialist-referral'
  description: string
  recommendedDays: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reason: string
  automaticReminder: boolean
}

interface FollowUpManagerProps {
  patient: Patient
  consultation: Consultation
  consultationContent: string
  onFollowUpScheduled?: (reminder: FollowUpReminder) => void
}

export function FollowUpManager({ 
  patient, 
  consultation, 
  consultationContent, 
  onFollowUpScheduled 
}: FollowUpManagerProps) {
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>([])
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<FollowUpSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<FollowUpSuggestion | null>(null)
  const [customFollowUp, setCustomFollowUp] = useState({
    date: '',
    type: 'follow-up' as const,
    message: '',
    priority: 'medium' as const
  })

  // AI-powered follow-up analysis
  const analyzeFollowUpNeeds = async () => {
    setIsAnalyzing(true)
    
    try {
      // Simulate AI analysis of consultation content
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const suggestions = generateFollowUpSuggestions(consultationContent)
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Follow-up analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate follow-up suggestions based on consultation content
  const generateFollowUpSuggestions = (content: string): FollowUpSuggestion[] => {
    const suggestions: FollowUpSuggestion[] = []
    const lowerContent = content.toLowerCase()
    
    // Blood pressure follow-up
    if (lowerContent.includes('blood pressure') || lowerContent.includes('hypertension') || lowerContent.includes('bp')) {
      suggestions.push({
        type: 'routine',
        description: 'Blood pressure monitoring follow-up',
        recommendedDays: 14,
        priority: 'medium',
        reason: 'Monitor blood pressure management and medication effectiveness',
        automaticReminder: true
      })
    }
    
    // Medication review
    if (lowerContent.includes('medication') || lowerContent.includes('prescription') || lowerContent.includes('dosage')) {
      suggestions.push({
        type: 'medication-review',
        description: 'Medication effectiveness review',
        recommendedDays: 30,
        priority: 'medium',
        reason: 'Assess medication tolerance and effectiveness',
        automaticReminder: true
      })
    }
    
    // Lab results follow-up
    if (lowerContent.includes('blood test') || lowerContent.includes('lab') || lowerContent.includes('cholesterol')) {
      suggestions.push({
        type: 'follow-test',
        description: 'Lab results review',
        recommendedDays: 7,
        priority: 'high',
        reason: 'Review and discuss laboratory test results',
        automaticReminder: true
      })
    }
    
    // Chest pain or cardiac concerns
    if (lowerContent.includes('chest pain') || lowerContent.includes('cardiac') || lowerContent.includes('heart')) {
      suggestions.push({
        type: 'urgent',
        description: 'Cardiac follow-up assessment',
        recommendedDays: 3,
        priority: 'urgent',
        reason: 'Monitor cardiac symptoms and ensure patient safety',
        automaticReminder: true
      })
    }
    
    // Mental health follow-up
    if (lowerContent.includes('depression') || lowerContent.includes('anxiety') || lowerContent.includes('mental health')) {
      suggestions.push({
        type: 'routine',
        description: 'Mental health check-in',
        recommendedDays: 21,
        priority: 'medium',
        reason: 'Monitor mental health progress and medication response',
        automaticReminder: true
      })
    }
    
    // Specialist referral follow-up
    if (lowerContent.includes('referral') || lowerContent.includes('specialist')) {
      suggestions.push({
        type: 'specialist-referral',
        description: 'Specialist consultation follow-up',
        recommendedDays: 14,
        priority: 'medium',
        reason: 'Ensure specialist appointment is scheduled and discuss outcomes',
        automaticReminder: true
      })
    }
    
    // Default routine follow-up if no specific conditions found
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'routine',
        description: 'Routine follow-up consultation',
        recommendedDays: 30,
        priority: 'low',
        reason: 'General health maintenance and monitoring',
        automaticReminder: false
      })
    }
    
    return suggestions
  }

  const scheduleFollowUp = (suggestion?: FollowUpSuggestion) => {
    const followUp = suggestion || {
      type: customFollowUp.type,
      description: 'Custom follow-up',
      recommendedDays: 7,
      priority: customFollowUp.priority,
      reason: customFollowUp.message,
      automaticReminder: true
    }
    
    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + (suggestion?.recommendedDays || 7))
    
    const newReminder: FollowUpReminder = {
      id: `reminder_${Date.now()}`,
      patientId: patient.id,
      consultationId: consultation.id,
      reminderDate: suggestion ? reminderDate : new Date(customFollowUp.date),
      reminderType: followUp.type === 'medication-review' ? 'medication-review' : 
                   followUp.type === 'follow-test' ? 'test-results' : 'follow-up',
      message: suggestion ? followUp.reason : customFollowUp.message,
      isCompleted: false,
      createdAt: new Date(),
      createdBy: 'system'
    }
    
    setFollowUpReminders(prev => [...prev, newReminder])
    onFollowUpScheduled?.(newReminder)
    
    if (suggestion) {
      setSelectedSuggestion(null)
    } else {
      setCustomFollowUp({ date: '', type: 'follow-up', message: '', priority: 'medium' })
    }
    
    setShowScheduleDialog(false)
  }

  const completeReminder = (reminderId: string) => {
    setFollowUpReminders(prev =>
      prev.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, isCompleted: true }
          : reminder
      )
    )
  }

  // Auto-analyze on mount
  useEffect(() => {
    if (consultationContent.trim()) {
      analyzeFollowUpNeeds()
    }
  }, [consultationContent])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'follow-test': return <Calendar className="w-4 h-4 text-blue-600" />
      case 'medication-review': return <Clock className="w-4 h-4 text-purple-600" />
      case 'specialist-referral': return <Bell className="w-4 h-4 text-orange-600" />
      default: return <Calendar className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Follow-up Analysis */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Follow-up Assistant</h3>
                <p className="text-sm text-gray-600">Smart scheduling based on consultation content</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {aiSuggestions.length > 0 && (
                <Badge variant="secondary">
                  {aiSuggestions.length} suggestion{aiSuggestions.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                onClick={analyzeFollowUpNeeds}
                disabled={!consultationContent.trim() || isAnalyzing}
                variant="outline"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Recommended Follow-ups</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(suggestion.type)}
                      <h4 className="font-medium">{suggestion.description}</h4>
                      <Badge variant={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      in {suggestion.recommendedDays} days
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Recommended date: {new Date(Date.now() + suggestion.recommendedDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => scheduleFollowUp(suggestion)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Follow-up Reminders */}
      {followUpReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Scheduled Follow-ups</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {followUpReminders
                .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
                .map((reminder) => (
                <div key={reminder.id} className={`p-3 border rounded-lg ${
                  reminder.isCompleted ? 'bg-green-50 border-green-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {reminder.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        getTypeIcon(reminder.reminderType)
                      )}
                      <span className={`font-medium ${reminder.isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {reminder.reminderType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {reminder.isCompleted && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reminder.reminderDate.toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{reminder.message}</p>
                  {!reminder.isCompleted && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeReminder(reminder.id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Follow-up Scheduling */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-4">
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Custom Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Follow-up</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={customFollowUp.date}
                    onChange={(e) => setCustomFollowUp(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={customFollowUp.type}
                    onChange={(e) => setCustomFollowUp(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="follow-up">General Follow-up</option>
                    <option value="test-results">Test Results Review</option>
                    <option value="medication-review">Medication Review</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    value={customFollowUp.priority}
                    onChange={(e) => setCustomFollowUp(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <RichTextEditor
                    content={customFollowUp.message}
                    onChange={(content) => setCustomFollowUp(prev => ({ ...prev, message: content }))}
                    placeholder="Add any specific notes or instructions for the follow-up..."
                    minHeight="100px"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => scheduleFollowUp()}
                    disabled={!customFollowUp.date || !customFollowUp.message.trim()}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

export default FollowUpManager