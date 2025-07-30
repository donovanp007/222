'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Save, 
  X,
  Heart,
  Activity,
  AlertTriangle,
  FileText,
  Clock
} from 'lucide-react'
import { Patient } from '@/types'

interface EnhancedPatientProfileProps {
  patient: Patient
  onPatientUpdate?: (patient: Patient) => void
}

export function EnhancedPatientProfile({ patient, onPatientUpdate }: EnhancedPatientProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPatient, setEditedPatient] = useState<Patient>(patient)

  const handleSave = () => {
    onPatientUpdate?.(editedPatient)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedPatient(patient)
    setIsEditing(false)
  }

  const calculateAge = (birthDate?: Date) => {
    if (!birthDate) return patient.age
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{patient.name} {patient.surname}</h2>
          <p className="text-gray-600">Patient ID: {patient.id}</p>
        </div>
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          size="sm"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Full Name</Label>
              <p className="font-medium">{patient.name} {patient.surname}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Age</Label>
              <p className="font-medium">{patient.age} years old</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Gender</Label>
              <p className="font-medium capitalize">{patient.gender || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Date of Birth</Label>
              <p className="font-medium">
                {patient.dateOfBirth 
                  ? new Date(patient.dateOfBirth).toLocaleDateString() 
                  : 'Not provided'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Contact</Label>
              <p className="font-medium">{patient.contact || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">ID Number</Label>
              <p className="font-medium">{patient.idNumber || 'Not provided'}</p>
            </div>
          </div>

          {patient.medicalAid && (
            <div className="border-t pt-4">
              <Label className="text-sm text-gray-600">Medical Aid</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-sm text-gray-500">Provider: </span>
                  <span className="font-medium">{patient.medicalAid.provider}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Member #: </span>
                  <span className="font-medium">{patient.medicalAid.memberNumber}</span>
                </div>
                {patient.medicalAid.dependentCode && (
                  <div>
                    <span className="text-sm text-gray-500">Dependent Code: </span>
                    <span className="font-medium">{patient.medicalAid.dependentCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Patient Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{patient.consultationCount}</div>
              <div className="text-sm text-gray-600">Total Consultations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Visit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(patient.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Patient Since</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={editedPatient.name}
                  onChange={(e) => setEditedPatient({...editedPatient, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Surname</Label>
                <Input
                  value={editedPatient.surname}
                  onChange={(e) => setEditedPatient({...editedPatient, surname: e.target.value})}
                />
              </div>
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={editedPatient.age}
                  onChange={(e) => setEditedPatient({...editedPatient, age: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <select
                  value={editedPatient.gender}
                  onChange={(e) => setEditedPatient({...editedPatient, gender: e.target.value as 'male' | 'female' | 'other'})}
                  className="w-full p-2 border border-gray-200 rounded-md"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  value={editedPatient.contact || ''}
                  onChange={(e) => setEditedPatient({...editedPatient, contact: e.target.value})}
                />
              </div>
              <div>
                <Label>ID Number</Label>
                <Input
                  value={editedPatient.idNumber || ''}
                  onChange={(e) => setEditedPatient({...editedPatient, idNumber: e.target.value})}
                />
              </div>
              {editedPatient.dateOfBirth && (
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={new Date(editedPatient.dateOfBirth).toISOString().split('T')[0]}
                    onChange={(e) => setEditedPatient({...editedPatient, dateOfBirth: new Date(e.target.value)})}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedPatientProfile
