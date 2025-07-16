'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pill, Plus, AlertTriangle, CheckCircle, X, Search } from 'lucide-react'
import { Patient } from '@/types'
import RichTextEditor from '@/components/ui/rich-text-editor'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  warnings?: string[]
  interactions?: string[]
  alternatives?: string[]
}

interface Prescription {
  id: string
  medications: Medication[]
  createdAt: Date
  notes: string
  status: 'draft' | 'finalized' | 'sent'
}

interface PrescriptionManagerProps {
  patient: Patient
  transcriptionText: string
  onPrescriptionGenerated?: (prescription: Prescription) => void
}

// Mock South African medication database
const SA_MEDICATIONS = [
  {
    name: 'Panado (Paracetamol)',
    commonDosages: ['500mg', '1000mg'],
    frequencies: ['Every 4-6 hours', 'Twice daily', 'Three times daily'],
    warnings: ['Maximum 4g per day', 'Avoid with liver disease'],
    interactions: ['Warfarin', 'Alcohol']
  },
  {
    name: 'Disprin (Aspirin)',
    commonDosages: ['75mg', '100mg', '300mg'],
    frequencies: ['Once daily', 'Twice daily'],
    warnings: ['Avoid with peptic ulcers', 'Risk of bleeding'],
    interactions: ['Warfarin', 'Clopidogrel', 'Methotrexate']
  },
  {
    name: 'Purata (Atorvastatin)',
    commonDosages: ['10mg', '20mg', '40mg', '80mg'],
    frequencies: ['Once daily (evening)'],
    warnings: ['Monitor liver function', 'Muscle pain'],
    interactions: ['Digoxin', 'Warfarin', 'Cyclosporine']
  },
  {
    name: 'Lopressor (Metoprolol)',
    commonDosages: ['25mg', '50mg', '100mg'],
    frequencies: ['Twice daily', 'Once daily (extended release)'],
    warnings: ['Do not stop abruptly', 'Monitor heart rate'],
    interactions: ['Insulin', 'Calcium channel blockers']
  },
  {
    name: 'Lexamil (Escitalopram)',
    commonDosages: ['5mg', '10mg', '20mg'],
    frequencies: ['Once daily'],
    warnings: ['Monitor for suicidal thoughts', 'Withdrawal symptoms'],
    interactions: ['MAOIs', 'Warfarin', 'Tramadol']
  }
]

export function PrescriptionManager({ patient, transcriptionText, onPrescriptionGenerated }: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null)
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [medicationSearch, setMedicationSearch] = useState('')
  const [selectedMedication, setSelectedMedication] = useState<typeof SA_MEDICATIONS[0] | null>(null)
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false)

  // AI-powered prescription generation from transcription text
  const generatePrescriptionFromText = async () => {
    setIsGeneratingPrescription(true)
    
    try {
      // Simulate AI analysis of transcription text
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Extract medications mentioned in transcription (mock implementation)
      const extractedMedications = extractMedicationsFromText(transcriptionText)
      
      const newPrescription: Prescription = {
        id: `presc_${Date.now()}`,
        medications: extractedMedications,
        createdAt: new Date(),
        notes: `Generated from consultation on ${new Date().toLocaleDateString()}`,
        status: 'draft'
      }
      
      setCurrentPrescription(newPrescription)
      setShowPrescriptionDialog(true)
    } catch (error) {
      console.error('Failed to generate prescription:', error)
    } finally {
      setIsGeneratingPrescription(false)
    }
  }

  // Mock function to extract medications from transcription text
  const extractMedicationsFromText = (text: string): Medication[] => {
    const medications: Medication[] = []
    const lowerText = text.toLowerCase()
    
    // Simple keyword matching (in real app, use AI/NLP)
    if (lowerText.includes('pain') || lowerText.includes('headache')) {
      medications.push({
        id: `med_${Date.now()}_1`,
        name: 'Panado (Paracetamol)',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        duration: '3-5 days',
        instructions: 'Take with food if stomach upset occurs'
      })
    }
    
    if (lowerText.includes('blood pressure') || lowerText.includes('hypertension')) {
      medications.push({
        id: `med_${Date.now()}_2`,
        name: 'Lopressor (Metoprolol)',
        dosage: '50mg',
        frequency: 'Twice daily',
        duration: 'Ongoing',
        instructions: 'Take at the same time each day. Do not stop suddenly.'
      })
    }
    
    if (lowerText.includes('cholesterol') || lowerText.includes('lipid')) {
      medications.push({
        id: `med_${Date.now()}_3`,
        name: 'Purata (Atorvastatin)',
        dosage: '20mg',
        frequency: 'Once daily in the evening',
        duration: 'Ongoing',
        instructions: 'Take with or without food. Avoid grapefruit juice.'
      })
    }
    
    return medications
  }

  const addMedication = () => {
    if (!selectedMedication || !currentPrescription) return
    
    const newMedication: Medication = {
      id: `med_${Date.now()}`,
      name: selectedMedication.name,
      dosage: selectedMedication.commonDosages[0],
      frequency: selectedMedication.frequencies[0],
      duration: '7 days',
      instructions: '',
      warnings: selectedMedication.warnings,
      interactions: selectedMedication.interactions
    }
    
    setCurrentPrescription({
      ...currentPrescription,
      medications: [...currentPrescription.medications, newMedication]
    })
    
    setSelectedMedication(null)
    setMedicationSearch('')
  }

  const removeMedication = (medicationId: string) => {
    if (!currentPrescription) return
    
    setCurrentPrescription({
      ...currentPrescription,
      medications: currentPrescription.medications.filter(med => med.id !== medicationId)
    })
  }

  const finalizePrescription = () => {
    if (!currentPrescription) return
    
    const finalizedPrescription = {
      ...currentPrescription,
      status: 'finalized' as const
    }
    
    setPrescriptions([...prescriptions, finalizedPrescription])
    onPrescriptionGenerated?.(finalizedPrescription)
    setCurrentPrescription(null)
    setShowPrescriptionDialog(false)
  }

  const filteredMedications = SA_MEDICATIONS.filter(med =>
    med.name.toLowerCase().includes(medicationSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Prescription Generation Button */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Prescription Assistant</h3>
                <p className="text-sm text-gray-600">Generate prescriptions from consultation notes</p>
              </div>
            </div>
            <Button
              onClick={generatePrescriptionFromText}
              disabled={!transcriptionText.trim() || isGeneratingPrescription}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingPrescription ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Prescription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Prescriptions */}
      {prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5" />
              <span>Recent Prescriptions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.slice(-3).map((prescription) => (
                <div key={prescription.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={prescription.status === 'finalized' ? 'default' : 'secondary'}>
                        {prescription.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {prescription.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {prescription.medications.length} medication(s)
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    {prescription.medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between">
                        <span className="font-medium">{med.name}</span>
                        <span className="text-gray-500">{med.dosage} - {med.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5" />
              <span>Prescription for {patient.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {currentPrescription && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {patient.name}
                  </div>
                  <div>
                    <span className="font-medium">Age:</span> {patient.age}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {patient.id}
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-4">
                <h3 className="font-semibold">Prescribed Medications</h3>
                {currentPrescription.medications.map((medication) => (
                  <Card key={medication.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{medication.name}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <Label className="text-gray-600">Dosage</Label>
                              <div className="font-medium">{medication.dosage}</div>
                            </div>
                            <div>
                              <Label className="text-gray-600">Frequency</Label>
                              <div className="font-medium">{medication.frequency}</div>
                            </div>
                            <div>
                              <Label className="text-gray-600">Duration</Label>
                              <div className="font-medium">{medication.duration}</div>
                            </div>
                          </div>
                          {medication.instructions && (
                            <div className="mt-2">
                              <Label className="text-gray-600">Instructions</Label>
                              <div className="text-sm">{medication.instructions}</div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(medication.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Warnings and Interactions */}
                      {(medication.warnings || medication.interactions) && (
                        <div className="space-y-2">
                          {medication.warnings && medication.warnings.length > 0 && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="flex items-center space-x-1 text-yellow-800 text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Warnings</span>
                              </div>
                              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                                {medication.warnings.map((warning, index) => (
                                  <li key={index}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {medication.interactions && medication.interactions.length > 0 && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center space-x-1 text-red-800 text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Drug Interactions</span>
                              </div>
                              <div className="text-xs text-red-700 mt-1">
                                Monitor with: {medication.interactions.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Medication */}
              <Card className="border-dashed border-gray-300">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Add Medication</h4>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                          placeholder="Search medications..."
                          value={medicationSearch}
                          onChange={(e) => setMedicationSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button onClick={addMedication} disabled={!selectedMedication}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    {medicationSearch && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {filteredMedications.map((med, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedMedication(med)}
                            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                              selectedMedication?.name === med.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm">{med.name}</div>
                            <div className="text-xs text-gray-500">
                              {med.commonDosages.join(', ')} • {med.frequencies[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Prescription Notes */}
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <RichTextEditor
                  content={currentPrescription.notes}
                  onChange={(content) => setCurrentPrescription({
                    ...currentPrescription,
                    notes: content
                  })}
                  placeholder="Add any additional notes or instructions..."
                  minHeight="100px"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={finalizePrescription}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={currentPrescription.medications.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalize Prescription
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PrescriptionManager