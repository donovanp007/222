"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Search, Calendar, User, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Patient } from "@/types";
import { usePatients } from "@/hooks/usePatients";

export function ArchiveManager() {
  const { 
    getArchivedPatients, 
    unarchivePatient, 
    deletePatient, 
    archivePatient,
    patients: activePatients 
  } = usePatients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const archivedPatients = getArchivedPatients();
  
  const filteredArchivedPatients = archivedPatients.filter(patient =>
    `${patient.name} ${patient.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.contact && patient.contact.includes(searchTerm)) ||
    (patient.medicalAid?.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUnarchive = (patientId: string) => {
    unarchivePatient(patientId);
  };

  const handlePermanentDelete = (patientId: string) => {
    if (confirm("Are you sure you want to permanently delete this patient? This action cannot be undone.")) {
      deletePatient(patientId);
    }
  };


  const confirmArchive = () => {
    if (selectedPatient) {
      archivePatient(selectedPatient.id);
      setShowArchiveDialog(false);
      setSelectedPatient(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getArchiveAge = (date: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
            <Archive className="w-6 h-6" />
            <span>Archive Manager</span>
          </h1>
          <p className="text-gray-600">Manage archived patient records and data retention</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-3xl font-semibold text-gray-900">{activePatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived Patients</p>
                <p className="text-3xl font-semibold text-gray-900">{archivedPatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Archive className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {activePatients.length + archivedPatients.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search archived patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Archived Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="w-5 h-5" />
            <span>Archived Patients</span>
            <Badge variant="secondary">{filteredArchivedPatients.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArchivedPatients.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {archivedPatients.length === 0 ? "No archived patients" : "No patients found"}
              </h3>
              <p className="text-gray-500">
                {archivedPatients.length === 0 
                  ? "Archived patients will appear here when you archive them"
                  : "Try adjusting your search terms"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArchivedPatients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {patient.name} {patient.surname}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Age {patient.age}</span>
                        {patient.lastVisit && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last visit: {formatDate(patient.lastVisit)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Archive className="w-3 h-3" />
                          <span>Archived {getArchiveAge(patient.lastVisit || patient.createdAt)}</span>
                        </div>
                      </div>
                      {patient.medicalAid && (
                        <p className="text-xs text-gray-500 mt-1">
                          {patient.medicalAid.provider} - {patient.medicalAid.memberNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {patient.consultationCount} sessions
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(patient.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      <span>Restore</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePermanentDelete(patient.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Patient Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Patient</DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4">
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedPatient.name} {selectedPatient.surname}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Age {selectedPatient.age} • {selectedPatient.consultationCount} sessions
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">What happens when you archive?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Patient will be moved to archived section</li>
                  <li>• All session data will be preserved</li>
                  <li>• Patient won&apos;t appear in active searches</li>
                  <li>• You can restore the patient anytime</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmArchive} className="flex items-center space-x-2">
                  <Archive className="w-4 h-4" />
                  <span>Archive Patient</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}