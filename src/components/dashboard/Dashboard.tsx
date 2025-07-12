"use client";

import { useState } from "react";
import { Plus, Search, User, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewPatientModal } from "./NewPatientModal";
import { PatientProfile } from "./PatientProfile";
import { TemplatedTranscriptionScreen } from "../transcription/TemplatedTranscriptionScreen";
import { usePatients } from "@/hooks/usePatients";
import { Patient } from "@/types";

type ViewState = "dashboard" | "profile" | "transcription";

export function Dashboard() {
  const {
    patients,
    addPatient,
    deletePatient,
    searchPatients,
    getTotalSessions,
    getTodaySessions,
  } = usePatients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const filteredPatients = searchPatients(searchTerm);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getDaysAgo = (date: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView("profile");
  };

  const handleBackToDashboard = () => {
    setSelectedPatient(null);
    setCurrentView("dashboard");
  };

  const handleStartTranscription = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView("transcription");
  };

  const handleBackToProfile = () => {
    setCurrentView("profile");
  };

  const handleEditPatient = (patient: Patient) => {
    // TODO: Implement edit modal
    console.log("Edit patient:", patient);
  };

  const handleDeletePatient = (patientId: string) => {
    if (confirm("Are you sure you want to delete this patient?")) {
      deletePatient(patientId);
      setSelectedPatient(null);
      setCurrentView("dashboard");
    }
  };

  const handleSaveSession = (content: string, audioBlob?: Blob, templateData?: Record<string, string>) => {
    console.log("Saving session:", { content, audioBlob, templateData });
    // TODO: Implement session saving to localStorage/database
    // For now, just go back to profile
    setCurrentView("profile");
  };

  // Show transcription screen
  if (currentView === "transcription" && selectedPatient) {
    return (
      <TemplatedTranscriptionScreen
        patient={selectedPatient}
        onBack={handleBackToProfile}
        onSaveSession={handleSaveSession}
      />
    );
  }

  // Show patient profile
  if (currentView === "profile" && selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        onBack={handleBackToDashboard}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onStartTranscription={handleStartTranscription}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">AI Medical Scribe</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-semibold text-gray-900">{patients.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today&apos;s Sessions</p>
                  <p className="text-3xl font-semibold text-gray-900">{getTodaySessions()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-semibold text-gray-900">{getTotalSessions()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients Grid */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-500">{filteredPatients.length} patients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="bg-white border-gray-200 hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer group"
              onClick={() => handlePatientClick(patient)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {patient.sessionCount} sessions
                  </Badge>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {patient.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Age {patient.age}</p>

                <div className="space-y-2">
                  {patient.lastVisit && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last visit: {formatDate(patient.lastVisit)} ({getDaysAgo(patient.lastVisit)} days ago)
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Patient since {formatDate(patient.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first patient"}
            </p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <NewPatientModal onPatientCreated={addPatient}>
        <Button
          size="lg"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all duration-200 ease-out shadow-lg hover:shadow-xl border-0"
          style={{ boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)' }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </NewPatientModal>
    </div>
  );
}