'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Camera, 
  Shield, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard,
  FileText,
  Upload,
  Edit3,
  Save,
  X,
  Plus,
  Eye,
  AlertTriangle,
  Users,
  Building2
} from 'lucide-react'
import { Patient } from '@/types'
import RichTextEditor from '@/components/ui/rich-text-editor'

interface MedicalPhoto {
  id: string
  url: string
  title: string
  description?: string
  dateAdded: Date
  category: 'wound' | 'rash' | 'xray' | 'scan' | 'other'
  isVisible: boolean
}

interface InsuranceInfo {
  provider: string
  memberNumber: string
  dependentCode?: string
  policyType: 'medical_aid' | 'hospital_plan' | 'gap_cover' | 'private'
  planName: string
  validUntil?: Date
  contactNumber?: string
  authorizationRequired: boolean
  coverageDetails: string
}

interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  address?: string
  isPrimary: boolean
}

interface EnhancedPatientProfileProps {
  patient: Patient
  onUpdate?: (updatedPatient: Patient) => void
  isEditing?: boolean
  onToggleEdit?: () => void
}

export function EnhancedPatientProfile({ 
  patient, 
  onUpdate, 
  isEditing = false, 
  onToggleEdit 
}: EnhancedPatientProfileProps) {
  const [medicalPhotos, setMedicalPhotos] = useState<MedicalPhoto[]>([])
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo[]>([
    {
      provider: patient.medicalAid?.provider || 'Discovery Health',
      memberNumber: patient.medicalAid?.memberNumber || '1234567890',
      dependentCode: patient.medicalAid?.dependentCode || '01',
      policyType: 'medical_aid',
      planName: 'Executive Plan',
      validUntil: new Date(2024, 11, 31),
      contactNumber: '+27 860 99 88 77',
      authorizationRequired: true,
      coverageDetails: 'Comprehensive medical aid with unlimited private hospital cover'
    }
  ])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '+27 82 123 4567',
      email: 'jane.smith@email.com',
      isPrimary: true
    }
  ])

  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [showInsuranceDialog, setShowInsuranceDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<MedicalPhoto | null>(null)
  const [editingInsurance, setEditingInsurance] = useState<InsuranceInfo | null>(null)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'insurance' | 'contacts'>('overview')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newPhoto: MedicalPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: e.target?.result as string,
            title: file.name,
            dateAdded: new Date(),
            category: 'other',
            isVisible: true
          }
          setMedicalPhotos(prev => [...prev, newPhoto])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wound': return 'bg-red-100 text-red-800'
      case 'rash': return 'bg-orange-100 text-orange-800'
      case 'xray': return 'bg-blue-100 text-blue-800'
      case 'scan': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'medical_aid': return 'bg-green-100 text-green-800'
      case 'hospital_plan': return 'bg-blue-100 text-blue-800'
      case 'gap_cover': return 'bg-yellow-100 text-yellow-800'
      case 'private': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Patient Profile</h2>
        <Button
          onClick={onToggleEdit}
          variant={isEditing ? "default" : "outline"}
          size="sm"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'photos', label: 'Medical Photos', icon: Camera },
          { id: 'insurance', label: 'Insurance', icon: Shield },
          { id: 'contacts', label: 'Emergency Contacts', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input value={`${patient.name} ${patient.surname}`} />
                  ) : (
                    <p className="mt-1 text-sm font-medium">{patient.name} {patient.surname}</p>
                  )}
                </div>

                <div>
                  <Label>Age</Label>
                  {isEditing ? (
                    <Input type="number" value={patient.age} />
                  ) : (
                    <p className="mt-1 text-sm">{patient.age} years old</p>
                  )}
                </div>

                <div>
                  <Label>Gender</Label>
                  {isEditing ? (
                    <select className="w-full mt-1 p-2 border border-gray-200 rounded-md">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm capitalize">{patient.gender || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label>ID Number</Label>
                  {isEditing ? (
                    <Input value={patient.idNumber || ''} />
                  ) : (
                    <p className="mt-1 text-sm">{patient.idNumber || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label>Contact Number</Label>
                  {isEditing ? (
                    <Input value={patient.contact || ''} />
                  ) : (
                    <p className="mt-1 text-sm">{patient.contact || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label>Date of Birth</Label>
                  {isEditing ? (
                    <Input type="date" value={patient.dateOfBirth?.toISOString().split('T')[0] || ''} />
                  ) : (
                    <p className="mt-1 text-sm">
                      {patient.dateOfBirth?.toLocaleDateString() || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Profile Photo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              {isEditing && (
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medical Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Medical Photos</h3>
            <Button onClick={() => setShowPhotoDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </div>

          {medicalPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicalPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getCategoryColor(photo.category)}>
                        {photo.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm truncate">{photo.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {photo.dateAdded.toLocaleDateString()}
                    </p>
                    {photo.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                    <div className="flex justify-end space-x-1 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedPhoto(photo)}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMedicalPhotos(prev => prev.filter(p => p.id !== photo.id))
                        }}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medical photos</h3>
                <p className="text-gray-500 mb-4">Add photos to track medical conditions visually</p>
                <Button onClick={() => setShowPhotoDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Photo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Insurance Tab */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Insurance Information</h3>
            <Button onClick={() => setShowInsuranceDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Insurance
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insuranceInfo.map((insurance, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{insurance.provider}</CardTitle>
                    <Badge className={getPolicyTypeColor(insurance.policyType)}>
                      {insurance.policyType.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Member Number:</span>
                      <p className="font-mono">{insurance.memberNumber}</p>
                    </div>
                    {insurance.dependentCode && (
                      <div>
                        <span className="font-medium text-gray-600">Dependent Code:</span>
                        <p className="font-mono">{insurance.dependentCode}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Plan:</span>
                      <p>{insurance.planName}</p>
                    </div>
                    {insurance.validUntil && (
                      <div>
                        <span className="font-medium text-gray-600">Valid Until:</span>
                        <p>{insurance.validUntil.toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {insurance.authorizationRequired && (
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">Authorization required for procedures</span>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-gray-600 text-sm">Coverage Details:</span>
                    <p className="text-sm text-gray-700 mt-1">{insurance.coverageDetails}</p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <Button size="sm" variant="ghost" onClick={() => setEditingInsurance(insurance)}>
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setInsuranceInfo(prev => prev.filter((_, i) => i !== index))
                      }}
                      className="text-red-600"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Emergency Contacts</h3>
            <Button onClick={() => setShowContactDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {emergencyContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{contact.relationship}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {contact.address && (
                        <div className="flex items-center space-x-2 mt-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{contact.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEmergencyContacts(prev => prev.filter(c => c.id !== contact.id))
                        }}
                        className="text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medical Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload medical photo</h3>
              <p className="text-gray-500 mb-4">Select images to document medical conditions</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedPatientProfile