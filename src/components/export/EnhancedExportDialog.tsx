'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Settings, 
  Palette, 
  FileType, 
  Stamp,
  Building2,
  UserCheck,
  Shield,
  Eye,
  Printer
} from 'lucide-react'
import { Patient, Consultation } from '@/types'
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter'

interface ExportDialogProps {
  patient: Patient
  consultations: Consultation[]
  selectedConsultations?: string[]
  isOpen: boolean
  onClose: () => void
}

interface ExportSettings {
  template: 'clinical' | 'specialist' | 'discharge' | 'prescription' | 'referral'
  includeLetterhead: boolean
  includeBranding: boolean
  includeSignature: boolean
  includeWatermark: boolean
  pageFormat: 'A4' | 'Letter'
  colorScheme: 'blue' | 'green' | 'gray' | 'medical'
  fontSize: 'small' | 'medium' | 'large'
  exportType: 'single' | 'multiple'
}

interface LetterheadSettings {
  hospitalName: string
  address: string
  phone: string
  email: string
  website: string
  practiceNumber: string
  hpcsaNumber: string
}

interface SignatureSettings {
  doctorName: string
  title: string
  credentials: string
}

export function EnhancedExportDialog({ 
  patient, 
  consultations, 
  selectedConsultations = [],
  isOpen, 
  onClose 
}: ExportDialogProps) {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    template: 'clinical',
    includeLetterhead: true,
    includeBranding: true,
    includeSignature: true,
    includeWatermark: false,
    pageFormat: 'A4',
    colorScheme: 'medical',
    fontSize: 'medium',
    exportType: 'single'
  })

  const [letterheadSettings, setLetterheadSettings] = useState<LetterheadSettings>({
    hospitalName: 'Private Practice',
    address: '123 Medical Street, Cape Town, 8001',
    phone: '+27 21 123 4567',
    email: 'doctor@medical.co.za',
    website: 'www.medical.co.za',
    practiceNumber: 'PR-123456',
    hpcsaNumber: 'MP-789012'
  })

  const [signatureSettings, setSignatureSettings] = useState<SignatureSettings>({
    doctorName: 'Dr. A. Smith',
    title: 'General Practitioner',
    credentials: 'MBChB, MMed (Fam Med)'
  })

  const [activeTab, setActiveTab] = useState<'format' | 'letterhead' | 'signature' | 'preview'>('format')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exporter = new EnhancedPDFExporter({
        template: exportSettings.template,
        includeLetterhead: exportSettings.includeLetterhead,
        includeBranding: exportSettings.includeBranding,
        includeSignature: exportSettings.includeSignature,
        includeWatermark: exportSettings.includeWatermark,
        pageFormat: exportSettings.pageFormat,
        colorScheme: exportSettings.colorScheme,
        fontSize: exportSettings.fontSize
      })

      const letterhead = exportSettings.includeLetterhead ? letterheadSettings : undefined
      const signature = exportSettings.includeSignature ? signatureSettings : undefined

      if (exportSettings.exportType === 'multiple' || selectedConsultations.length > 1) {
        const consultationsToExport = selectedConsultations.length > 0 
          ? consultations.filter(c => selectedConsultations.includes(c.id))
          : consultations
        
        await exporter.exportMultipleConsultations(patient, consultationsToExport, letterhead, signature)
      } else {
        const consultationToExport = selectedConsultations.length > 0
          ? consultations.find(c => c.id === selectedConsultations[0]) || consultations[0]
          : consultations[0]
        
        if (consultationToExport) {
          await exporter.exportConsultation(patient, consultationToExport, letterhead, signature)
        }
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'clinical':
        return 'Standard clinical consultation format with comprehensive patient information'
      case 'specialist':
        return 'Specialized format for referrals and specialist consultations'
      case 'discharge':
        return 'Hospital discharge summary format with treatment outcomes'
      case 'prescription':
        return 'Focused prescription format with medication details'
      case 'referral':
        return 'Referral letter format for inter-professional communication'
      default:
        return 'Clinical consultation format'
    }
  }

  const getColorSchemePreview = (scheme: string) => {
    switch (scheme) {
      case 'blue':
        return { primary: '#007AFF', secondary: '#5AC8FA' }
      case 'green':
        return { primary: '#34C759', secondary: '#30D158' }
      case 'medical':
        return { primary: '#0066CC', secondary: '#006699' }
      default:
        return { primary: '#495057', secondary: '#6C757D' }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Export Medical Documents</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('format')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'format' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileType className="w-4 h-4" />
                <span className="text-sm font-medium">Format & Style</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('letterhead')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'letterhead' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Letterhead</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('signature')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'signature' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Signature</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Preview</span>
              </div>
            </button>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {/* Format & Style Tab */}
            {activeTab === 'format' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {(['clinical', 'specialist', 'discharge', 'prescription', 'referral'] as const).map((template) => (
                        <div
                          key={template}
                          onClick={() => setExportSettings(prev => ({ ...prev, template }))}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            exportSettings.template === template
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h4 className="font-medium capitalize">{template}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {getTemplateDescription(template)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appearance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Color Scheme</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {(['blue', 'green', 'medical', 'gray'] as const).map((scheme) => {
                            const colors = getColorSchemePreview(scheme)
                            return (
                              <button
                                key={scheme}
                                onClick={() => setExportSettings(prev => ({ ...prev, colorScheme: scheme }))}
                                className={`p-2 border rounded-lg flex items-center space-x-2 ${
                                  exportSettings.colorScheme === scheme
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: colors.primary }}
                                  />
                                  <div 
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: colors.secondary }}
                                  />
                                </div>
                                <span className="text-xs capitalize">{scheme}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <Label>Font Size</Label>
                        <select
                          value={exportSettings.fontSize}
                          onChange={(e) => setExportSettings(prev => ({ 
                            ...prev, 
                            fontSize: e.target.value as 'small' | 'medium' | 'large' 
                          }))}
                          className="w-full mt-2 p-2 border border-gray-200 rounded-md"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <div>
                        <Label>Page Format</Label>
                        <select
                          value={exportSettings.pageFormat}
                          onChange={(e) => setExportSettings(prev => ({ 
                            ...prev, 
                            pageFormat: e.target.value as 'A4' | 'Letter' 
                          }))}
                          className="w-full mt-2 p-2 border border-gray-200 rounded-md"
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Include Watermark</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={exportSettings.includeWatermark}
                          onChange={(e) => setExportSettings(prev => ({ 
                            ...prev, 
                            includeWatermark: e.target.checked 
                          }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Stamp className="w-4 h-4" />
                          <span className="text-sm font-medium">Include Branding</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={exportSettings.includeBranding}
                          onChange={(e) => setExportSettings(prev => ({ 
                            ...prev, 
                            includeBranding: e.target.checked 
                          }))}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Export Type</Label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="single"
                              checked={exportSettings.exportType === 'single'}
                              onChange={(e) => setExportSettings(prev => ({ 
                                ...prev, 
                                exportType: e.target.value as 'single' | 'multiple' 
                              }))}
                            />
                            <span className="text-sm">Single consultation</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="multiple"
                              checked={exportSettings.exportType === 'multiple'}
                              onChange={(e) => setExportSettings(prev => ({ 
                                ...prev, 
                                exportType: e.target.value as 'single' | 'multiple' 
                              }))}
                            />
                            <span className="text-sm">Multiple consultations (complete history)</span>
                          </label>
                        </div>
                      </div>

                      {selectedConsultations.length > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            {selectedConsultations.length} consultation(s) selected for export
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Letterhead Tab */}
            {activeTab === 'letterhead' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Practice Information</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeLetterhead}
                      onChange={(e) => setExportSettings(prev => ({ 
                        ...prev, 
                        includeLetterhead: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Include letterhead</span>
                  </div>
                </div>

                {exportSettings.includeLetterhead && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Practice/Hospital Name</Label>
                          <Input
                            value={letterheadSettings.hospitalName}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              hospitalName: e.target.value 
                            }))}
                            placeholder="Enter practice name..."
                          />
                        </div>

                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            value={letterheadSettings.phone}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              phone: e.target.value 
                            }))}
                            placeholder="+27 21 123 4567"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Address</Label>
                          <Input
                            value={letterheadSettings.address}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              address: e.target.value 
                            }))}
                            placeholder="123 Medical Street, Cape Town, 8001"
                          />
                        </div>

                        <div>
                          <Label>Email</Label>
                          <Input
                            value={letterheadSettings.email}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              email: e.target.value 
                            }))}
                            placeholder="doctor@medical.co.za"
                          />
                        </div>

                        <div>
                          <Label>Website</Label>
                          <Input
                            value={letterheadSettings.website}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              website: e.target.value 
                            }))}
                            placeholder="www.medical.co.za"
                          />
                        </div>

                        <div>
                          <Label>Practice Number</Label>
                          <Input
                            value={letterheadSettings.practiceNumber}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              practiceNumber: e.target.value 
                            }))}
                            placeholder="PR-123456"
                          />
                        </div>

                        <div>
                          <Label>HPCSA Number</Label>
                          <Input
                            value={letterheadSettings.hpcsaNumber}
                            onChange={(e) => setLetterheadSettings(prev => ({ 
                              ...prev, 
                              hpcsaNumber: e.target.value 
                            }))}
                            placeholder="MP-789012"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Signature Tab */}
            {activeTab === 'signature' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Digital Signature</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeSignature}
                      onChange={(e) => setExportSettings(prev => ({ 
                        ...prev, 
                        includeSignature: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Include signature</span>
                  </div>
                </div>

                {exportSettings.includeSignature && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Doctor Name</Label>
                          <Input
                            value={signatureSettings.doctorName}
                            onChange={(e) => setSignatureSettings(prev => ({ 
                              ...prev, 
                              doctorName: e.target.value 
                            }))}
                            placeholder="Dr. A. Smith"
                          />
                        </div>

                        <div>
                          <Label>Title</Label>
                          <Input
                            value={signatureSettings.title}
                            onChange={(e) => setSignatureSettings(prev => ({ 
                              ...prev, 
                              title: e.target.value 
                            }))}
                            placeholder="General Practitioner"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Credentials</Label>
                          <Input
                            value={signatureSettings.credentials}
                            onChange={(e) => setSignatureSettings(prev => ({ 
                              ...prev, 
                              credentials: e.target.value 
                            }))}
                            placeholder="MBChB, MMed (Fam Med)"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Patient:</strong> {patient.name} {patient.surname}
                      </div>
                      <div>
                        <strong>Age:</strong> {patient.age} years
                      </div>
                      <div>
                        <strong>Template:</strong> {exportSettings.template}
                      </div>
                      <div>
                        <strong>Color Scheme:</strong> {exportSettings.colorScheme}
                      </div>
                      <div>
                        <strong>Page Format:</strong> {exportSettings.pageFormat}
                      </div>
                      <div>
                        <strong>Font Size:</strong> {exportSettings.fontSize}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Consultations to Export:</h4>
                      <div className="space-y-2">
                        {(selectedConsultations.length > 0 
                          ? consultations.filter(c => selectedConsultations.includes(c.id))
                          : [consultations[0]]
                        ).map((consultation) => (
                          <div key={consultation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{consultation.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {consultation.visitDate.toLocaleDateString()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Document Features:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={exportSettings.includeLetterhead ? 'text-green-600' : 'text-gray-400'}>
                            ✓ Letterhead
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={exportSettings.includeSignature ? 'text-green-600' : 'text-gray-400'}>
                            ✓ Digital Signature
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={exportSettings.includeBranding ? 'text-green-600' : 'text-gray-400'}>
                            ✓ AI Scribe Branding
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={exportSettings.includeWatermark ? 'text-green-600' : 'text-gray-400'}>
                            ✓ Confidential Watermark
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-500">
            {consultations.length} consultation(s) available
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || consultations.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedExportDialog