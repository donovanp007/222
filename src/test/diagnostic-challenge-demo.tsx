'use client'

import React from 'react'
import DiagnosticChallenge from '../components/transcription/DiagnosticChallenge'
import TranscriptionWorkflow from '../components/transcription/TranscriptionWorkflow'
import { Patient, Consultation } from '../types'

const mockPatient: Patient = {
  id: 'patient_1',
  name: 'John',
  surname: 'Smith',
  age: 45,
  gender: 'male',
  contact: '+27 82 123 4567',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockConsultation: Consultation = {
  id: 'consultation_1',
  patientId: 'patient_1',
  title: 'Routine Checkup',
  content: 'Patient presents with persistent cough lasting 2 weeks. Reports dry cough, worse at night, no fever. No recent travel or sick contacts. Physical examination reveals clear lungs, no wheezing. Vital signs stable.',
  visitDate: new Date(),
  diagnosis: ['Viral upper respiratory infection', 'Post-viral cough'],
  summary: 'Patient with 2-week dry cough, likely viral etiology',
  recommendations: ['Supportive care', 'Return if symptoms persist'],
  createdAt: new Date(),
  updatedAt: new Date(),
  isLocked: false,
  suggestedTasks: [],
  exportHistory: []
}

export default function DiagnosticChallengeDemo() {
  const handleChallengeComplete = (results: any) => {
    console.log('Challenge completed:', results)
  }

  const handleConsultationComplete = (consultation: Consultation) => {
    console.log('Consultation completed:', consultation)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🎯 Diagnostic Challenge Demo
        </h1>
        
        {/* Standalone Diagnostic Challenge */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Standalone Challenge</h2>
          <DiagnosticChallenge
            consultation={mockConsultation}
            aiDiagnosis={['Viral upper respiratory infection', 'Post-viral cough']}
            onChallengeComplete={handleChallengeComplete}
          />
        </section>

        {/* Full Transcription Workflow */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Full Transcription Workflow</h2>
          <TranscriptionWorkflow
            patient={mockPatient}
            onConsultationComplete={handleConsultationComplete}
          />
        </section>
      </div>
    </div>
  )
}