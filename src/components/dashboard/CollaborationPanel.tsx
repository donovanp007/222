"use client";

import { useState } from "react";
import { Users, Plus, UserPlus, Mail, Stethoscope, Crown, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient, Doctor } from "@/types";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";

interface CollaborationPanelProps {
  patient: Patient;
  onPatientUpdate?: (patient: Patient) => void;
}

export function CollaborationPanel({ patient, onPatientUpdate }: CollaborationPanelProps) {
  const { doctors, currentDoctor, searchDoctors } = useDoctors();
  const { addDoctorToPatient } = usePatients();
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);

  const assignedDoctors = doctors.filter(doctor => 
    patient.assignedDoctors?.includes(doctor.id)
  );

  const availableDoctors = searchDoctors(searchQuery).filter(doctor => 
    !patient.assignedDoctors?.includes(doctor.id)
  );

  const handleAddDoctors = () => {
    selectedDoctors.forEach(doctorId => {
      addDoctorToPatient(patient.id, doctorId);
    });
    
    setSelectedDoctors([]);
    setSearchQuery("");
    setShowAddDoctor(false);
    
    // Notify parent of patient update if callback provided
    if (onPatientUpdate) {
      const updatedPatient = {
        ...patient,
        assignedDoctors: [...(patient.assignedDoctors || []), ...selectedDoctors]
      };
      onPatientUpdate(updatedPatient);
    }
  };

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctors(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const getRoleIcon = (role: Doctor['role']) => {
    switch (role) {
      case 'primary':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'specialist':
        return <Stethoscope className="w-4 h-4 text-blue-500" />;
      case 'consultant':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: Doctor['role']) => {
    switch (role) {
      case 'primary':
        return 'bg-yellow-100 text-yellow-800';
      case 'specialist':
        return 'bg-blue-100 text-blue-800';
      case 'consultant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Collaborating Doctors</span>
          </CardTitle>
          
          <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center space-x-1">
                <UserPlus className="w-4 h-4" />
                <span>Add Doctor</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Collaborating Doctors</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="doctor-search" className="text-sm font-medium">
                    Search Doctors
                  </Label>
                  <Input
                    id="doctor-search"
                    placeholder="Search by name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Available Doctors */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableDoctors.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchQuery ? 'No doctors found' : 'All doctors are already assigned'}
                    </p>
                  ) : (
                    availableDoctors.map(doctor => (
                      <div
                        key={doctor.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedDoctors.includes(doctor.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleDoctorSelection(doctor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doctor.name}</p>
                              <p className="text-xs text-gray-600">{doctor.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(doctor.role)}
                            <input
                              type="checkbox"
                              checked={selectedDoctors.includes(doctor.id)}
                              onChange={() => toggleDoctorSelection(doctor.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDoctor(false);
                      setSelectedDoctors([]);
                      setSearchQuery("");
                    }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleAddDoctors}
                    disabled={selectedDoctors.length === 0}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add {selectedDoctors.length} Doctor{selectedDoctors.length !== 1 ? 's' : ''}</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {assignedDoctors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborating doctors</h3>
            <p className="text-gray-500 mb-4">
              Add other doctors to collaborate on this patient's care
            </p>
            <Button
              variant="outline"
              onClick={() => setShowAddDoctor(true)}
              className="flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Doctor</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedDoctors.map(doctor => (
              <div key={doctor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      {doctor.id === currentDoctor?.id && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{doctor.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getRoleIcon(doctor.role)}
                  <Badge className={`text-xs ${getRoleBadgeColor(doctor.role)}`}>
                    {doctor.role}
                  </Badge>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{assignedDoctors.length} doctor{assignedDoctors.length !== 1 ? 's' : ''} collaborating</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDoctor(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add more
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}