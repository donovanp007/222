'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Brain, 
  Stethoscope,
  Pill,
  CalendarClock,
  FileHeart,
  FileCheck,
  FileX,
  Settings,
  Eye,
  Edit3,
  RefreshCw,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Building2
} from 'lucide-react'
import { Patient } from '@/types'
import { useSAMedicalDatabases } from '@/utils/saHealthDatabases'
import RichTextEditor from '@/components/ui/rich-text-editor'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface DocumentTemplate {
  id: string
  name: string
  type: 'medical_certificate' | 'referral_letter' | 'prescription' | 'discharge_summary' | 'sick_note' | 'specialist_report' | 'procedure_consent' | 'patient_summary'
  description: string
  icon: React.ComponentType<{ className?: string }>
  requiredFields: string[]
  aiGenerated: boolean
}

interface GeneratedDocument {
  id: string
  templateId: string
  templateName: string
  patient: Patient
  content: string
  metadata: {
    generatedAt: Date
    doctorName: string
    practiceNumber: string
    facilityName: string
    diagnosis?: string[]
    medications?: string[]
    recommendations?: string[]
  }
  customizations: {
    letterhead?: string
    signature?: string
    practiceStamp?: boolean
    customFields?: Record<string, string>
  }
}

interface AIDocumentGeneratorProps {
  patient: Patient
  consultationContent?: string
  onDocumentGenerated?: (document: GeneratedDocument) => void
}

const documentTemplates: DocumentTemplate[] = [
  {
    id: 'medical_cert',
    name: 'Medical Certificate',
    type: 'medical_certificate',
    description: 'Official medical certificate for work/school absence',
    icon: FileHeart,
    requiredFields: ['duration', 'reason', 'recommendations'],
    aiGenerated: true
  },
  {
    id: 'referral',
    name: 'Specialist Referral',
    type: 'referral_letter',
    description: 'Referral letter to specialist or secondary care',
    icon: FileText,
    requiredFields: ['specialist', 'reason', 'urgency', 'history'],
    aiGenerated: true
  },
  {
    id: 'prescription',
    name: 'Prescription',
    type: 'prescription',
    description: 'Electronic prescription with SA medicine database',
    icon: Pill,
    requiredFields: ['medications', 'dosage', 'duration', 'instructions'],
    aiGenerated: true
  },
  {
    id: 'sick_note',
    name: 'Sick Note',
    type: 'sick_note',
    description: 'Simple sick leave certificate',
    icon: FileCheck,
    requiredFields: ['fromDate', 'toDate', 'reason'],
    aiGenerated: true
  },
  {
    id: 'discharge',
    name: 'Discharge Summary',
    type: 'discharge_summary',
    description: 'Hospital/clinic discharge documentation',
    icon: FileX,
    requiredFields: ['admission_reason', 'treatment', 'discharge_plan', 'follow_up'],
    aiGenerated: true
  },
  {
    id: 'patient_summary',
    name: 'Patient Summary',
    type: 'patient_summary',
    description: 'Comprehensive patient management summary',
    icon: Stethoscope,
    requiredFields: ['current_status', 'medications', 'follow_up_plan'],
    aiGenerated: true
  }
]

export function AIPatientDocumentGenerator({ 
  patient, 
  consultationContent = '',
  onDocumentGenerated 
}: AIDocumentGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableContent, setEditableContent] = useState('')
  const [customizations, setCustomizations] = useState({
    doctorName: 'Dr. John Smith',
    practiceNumber: 'MP123456',
    facilityName: 'Primary Healthcare Clinic',
    letterhead: 'Primary Healthcare Solutions',
    includeSignature: true,
    includePracticeStamp: true
  })

  const { dbService, isLoading: dbLoading } = useSAMedicalDatabases()
  const documentRef = useRef<HTMLDivElement>(null)

  const generateDocument = async (template: DocumentTemplate) => {
    setIsGenerating(true)
    setSelectedTemplate(template)

    try {
      // Simulate AI document generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const aiGeneratedContent = await generateAIContent(template, patient, consultationContent)
      
      const document: GeneratedDocument = {
        id: `doc_${Date.now()}`,
        templateId: template.id,
        templateName: template.name,
        patient,
        content: aiGeneratedContent,
        metadata: {
          generatedAt: new Date(),
          doctorName: customizations.doctorName,
          practiceNumber: customizations.practiceNumber,
          facilityName: customizations.facilityName,
          diagnosis: extractDiagnosis(consultationContent),
          medications: extractMedications(consultationContent),
          recommendations: extractRecommendations(consultationContent)
        },
        customizations: {
          letterhead: customizations.letterhead,
          signature: customizations.includeSignature ? 'Dr. Signature' : undefined,
          practiceStamp: customizations.includePracticeStamp
        }
      }

      setGeneratedDocument(document)
      setEditableContent(aiGeneratedContent)
      setShowPreview(true)
      onDocumentGenerated?.(document)
      
    } catch (error) {
      console.error('Document generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAIContent = async (
    template: DocumentTemplate, 
    patient: Patient, 
    consultation: string
  ): Promise<string> => {
    // Mock AI-generated content based on template type
    const currentDate = new Date().toLocaleDateString('en-ZA')
    
    switch (template.type) {
      case 'medical_certificate':
        return `
          <div class="medical-certificate">
            <h2>MEDICAL CERTIFICATE</h2>
            <p><strong>Patient:</strong> ${patient.name} ${patient.surname}</p>
            <p><strong>ID Number:</strong> ${patient.idNumber || 'Not provided'}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            
            <p>I hereby certify that I have examined the above-named patient on ${currentDate} and found them to be suffering from a medical condition that prevents them from carrying out their normal duties.</p>
            
            <p><strong>Clinical Findings:</strong></p>
            <p>${extractClinicalFindings(consultation)}</p>
            
            <p><strong>Recommended Rest Period:</strong> 3 days</p>
            <p><strong>Expected Return Date:</strong> ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA')}</p>
            
            <p><strong>Recommendations:</strong></p>
            <ul>
              <li>Complete bed rest</li>
              <li>Adequate hydration</li>
              <li>Follow-up if symptoms persist</li>
            </ul>
          </div>
        `

      case 'referral_letter':
        return `
          <div class="referral-letter">
            <h2>SPECIALIST REFERRAL LETTER</h2>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>To:</strong> Specialist Physician</p>
            <p><strong>Re:</strong> ${patient.name} ${patient.surname} (Age: ${patient.age})</p>
            
            <p>Dear Colleague,</p>
            
            <p>I would appreciate your specialist opinion and management of this ${patient.age}-year-old patient.</p>
            
            <p><strong>Presenting Complaint:</strong></p>
            <p>${extractChiefComplaint(consultation)}</p>
            
            <p><strong>History:</strong></p>
            <p>${extractHistory(consultation)}</p>
            
            <p><strong>Current Medications:</strong></p>
            <p>${extractMedications(consultation).join(', ') || 'None currently'}</p>
            
            <p><strong>Reason for Referral:</strong></p>
            <p>Further evaluation and specialist management required.</p>
            
            <p>Thank you for your assistance with this patient's care.</p>
            
            <p>Kind regards,</p>
          </div>
        `

      case 'prescription':
        const medications = extractMedications(consultation)
        return `
          <div class="prescription">
            <h2>PRESCRIPTION</h2>
            <p><strong>Patient:</strong> ${patient.name} ${patient.surname}</p>
            <p><strong>Age:</strong> ${patient.age} years</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            
            <div class="medications">
              ${medications.map((med, index) => `
                <div class="medication-item">
                  <p><strong>Rx ${index + 1}:</strong> ${med}</p>
                  <p><strong>Dosage:</strong> As directed</p>
                  <p><strong>Quantity:</strong> 30 days supply</p>
                  <p><strong>Instructions:</strong> Take as prescribed</p>
                </div>
              `).join('')}
            </div>
            
            <p><strong>Patient Counseling:</strong></p>
            <ul>
              <li>Take medications as prescribed</li>
              <li>Complete the full course</li>
              <li>Report any adverse effects</li>
            </ul>
          </div>
        `

      case 'sick_note':
        return `
          <div class="sick-note">
            <h2>SICK LEAVE CERTIFICATE</h2>
            <p><strong>Patient:</strong> ${patient.name} ${patient.surname}</p>
            <p><strong>ID Number:</strong> ${patient.idNumber || 'Not provided'}</p>
            <p><strong>Date of Examination:</strong> ${currentDate}</p>
            
            <p>This is to certify that the above-named patient was examined and found to be unfit for work due to illness.</p>
            
            <p><strong>Period of Incapacity:</strong></p>
            <p>From: ${currentDate}</p>
            <p>To: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA')}</p>
            
            <p><strong>Nature of Illness:</strong> Medical condition requiring rest</p>
          </div>
        `

      case 'patient_summary':
        return `
          <div class="patient-summary">
            <h2>PATIENT MANAGEMENT SUMMARY</h2>
            <p><strong>Patient:</strong> ${patient.name} ${patient.surname}</p>
            <p><strong>Age:</strong> ${patient.age} years</p>
            <p><strong>Report Date:</strong> ${currentDate}</p>
            
            <p><strong>Current Status:</strong></p>
            <p>${extractCurrentStatus(consultation)}</p>
            
            <p><strong>Active Problems:</strong></p>
            <ul>
              ${extractDiagnosis(consultation).map(dx => `<li>${dx}</li>`).join('')}
            </ul>
            
            <p><strong>Current Medications:</strong></p>
            <ul>
              ${extractMedications(consultation).map(med => `<li>${med}</li>`).join('')}
            </ul>
            
            <p><strong>Follow-up Plan:</strong></p>
            <ul>
              <li>Continue current treatment</li>
              <li>Monitor progress</li>
              <li>Return in 4-6 weeks</li>
            </ul>
            
            <p><strong>Patient Education Provided:</strong></p>
            <ul>
              <li>Medication compliance</li>
              <li>Lifestyle modifications</li>
              <li>Warning signs to watch for</li>
            </ul>
          </div>
        `

      default:
        return `
          <div class="generic-document">
            <h2>${template.name.toUpperCase()}</h2>
            <p><strong>Patient:</strong> ${patient.name} ${patient.surname}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p>Document content would be generated here based on the consultation notes and patient information.</p>
          </div>
        `
    }
  }

  // Helper functions to extract information from consultation
  const extractClinicalFindings = (consultation: string): string => {
    if (consultation.toLowerCase().includes('fever')) return 'Fever and associated symptoms'
    if (consultation.toLowerCase().includes('headache')) return 'Headache and malaise'
    if (consultation.toLowerCase().includes('pain')) return 'Pain and discomfort'
    return 'Clinical examination findings consistent with presenting complaint'
  }

  const extractChiefComplaint = (consultation: string): string => {
    const sentences = consultation.split('.').filter(s => s.trim().length > 0)
    return sentences[0]?.trim() + '.' || 'Patient presents with medical complaints requiring evaluation.'
  }

  const extractHistory = (consultation: string): string => {
    return consultation.length > 200 ? consultation.substring(0, 200) + '...' : consultation
  }

  const extractDiagnosis = (consultation: string): string[] => {
    const diagnoses: string[] = []
    if (consultation.toLowerCase().includes('hypertension')) diagnoses.push('Hypertension')
    if (consultation.toLowerCase().includes('diabetes')) diagnoses.push('Diabetes mellitus')
    if (consultation.toLowerCase().includes('infection')) diagnoses.push('Bacterial infection')
    return diagnoses.length > 0 ? diagnoses : ['Medical condition under evaluation']
  }

  const extractMedications = (consultation: string): string[] => {
    const medications: string[] = []
    if (consultation.toLowerCase().includes('amlodipine')) medications.push('Amlodipine 5mg daily')
    if (consultation.toLowerCase().includes('metformin')) medications.push('Metformin 500mg twice daily')
    if (consultation.toLowerCase().includes('antibiotic')) medications.push('Antibiotic therapy as prescribed')
    return medications
  }

  const extractRecommendations = (consultation: string): string[] => {
    return [
      'Continue current treatment plan',
      'Follow-up as scheduled',
      'Monitor for improvement'
    ]
  }

  const extractCurrentStatus = (consultation: string): string => {
    if (consultation.toLowerCase().includes('improving')) return 'Patient showing clinical improvement'
    if (consultation.toLowerCase().includes('stable')) return 'Patient condition is stable'
    return 'Patient under active medical management'
  }

  const downloadPDF = async () => {
    if (!documentRef.current || !generatedDocument) return

    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${generatedDocument.templateName}_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    }
  }

  const saveChanges = () => {
    if (generatedDocument) {
      const updatedDocument = {
        ...generatedDocument,
        content: editableContent
      }
      setGeneratedDocument(updatedDocument)
      setIsEditing(false)
      onDocumentGenerated?.(updatedDocument)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Document Generator</h2>
            <p className="text-sm text-gray-500">Generate professional medical documents instantly</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {/* Document Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
            onClick={() => generateDocument(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <template.icon className="w-8 h-8 text-blue-600" />
                {template.aiGenerated && (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.requiredFields.slice(0, 3).map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {template.requiredFields.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.requiredFields.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <h3 className="font-medium text-blue-900">Generating Document</h3>
                <p className="text-sm text-blue-700">
                  AI is analyzing consultation notes and creating {selectedTemplate?.name}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>{generatedDocument?.templateName}</span>
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
                <Button size="sm" onClick={downloadPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Header */}
            <div className="border-b pb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{customizations.letterhead}</h3>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      {customizations.facilityName}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      +27 11 123 4567
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      info@clinic.co.za
                    </span>
                    <span>Practice No: {customizations.practiceNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div ref={documentRef} className="min-h-[500px] p-6 bg-white">
              {isEditing ? (
                <div className="space-y-4">
                  <RichTextEditor
                    content={editableContent}
                    onChange={setEditableContent}
                    minHeight="400px"
                    className="border-gray-300"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveChanges}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedDocument?.content || '' }}
                />
              )}
            </div>

            {/* Document Footer */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  <p>Generated: {generatedDocument?.metadata.generatedAt.toLocaleString()}</p>
                  <p>Doctor: {customizations.doctorName}</p>
                </div>
                {customizations.includeSignature && (
                  <div className="text-center">
                    <div className="w-48 border-b border-gray-400 mb-2"></div>
                    <p className="text-sm">{customizations.doctorName}</p>
                    <p className="text-xs text-gray-600">Practice No: {customizations.practiceNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AIPatientDocumentGenerator