"use client";

import { useState } from "react";
import { Plus, Search, User, Calendar, Clock, Grid3X3, List, LayoutGrid, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewPatientModal } from "./NewPatientModal";
import { EditPatientModal } from "./EditPatientModal";
import { PatientProfile } from "./PatientProfile";
import { TemplatedTranscriptionScreen } from "../transcription/TemplatedTranscriptionScreen";
import { usePatients } from "@/hooks/usePatients";
import { Patient } from "@/types";

type ViewState = "dashboard" | "profile" | "transcription";
type DashboardViewMode = "grid" | "list" | "cards";

export function Dashboard() {
  const {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    getTotalSessions,
    getTodaySessions,
  } = usePatients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [dashboardViewMode, setDashboardViewMode] = useState<DashboardViewMode>("cards");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [ageFilter, setAgeFilter] = useState<{min: number; max: number} | null>(null);
  const [medicalAidFilter, setMedicalAidFilter] = useState<string>("");
  const [recentVisitsFilter, setRecentVisitsFilter] = useState<boolean>(false);
  
  const filteredPatients = searchPatients(searchTerm).filter(patient => {
    if (ageFilter && (patient.age < ageFilter.min || patient.age > ageFilter.max)) {
      return false;
    }
    if (medicalAidFilter && patient.medicalAid?.provider.toLowerCase() !== medicalAidFilter.toLowerCase()) {
      return false;
    }
    if (recentVisitsFilter) {
      if (!patient.lastVisit) return false;
      const daysSinceVisit = Math.floor((new Date().getTime() - patient.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceVisit > 30) return false;
    }
    return true;
  });

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
    setEditingPatient(patient);
    setShowEditModal(true);
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    updatePatient(updatedPatient.id, updatedPatient);
    // Update selectedPatient if it's the same patient being edited
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
  };

  const handleDeletePatient = (patientId: string) => {
    if (confirm("Are you sure you want to delete this patient?")) {
      deletePatient(patientId);
      setSelectedPatient(null);
      setCurrentView("dashboard");
    }
  };

  const handleSaveSession = (content: string, audioBlob?: Blob, templateData?: Record<string, string>) => {
    if (!selectedPatient) return;
    
    try {
      // Create new session
      const sessionId = `session_${Date.now()}`;
      const newSession = {
        id: sessionId,
        patientId: selectedPatient.id,
        content,
        templateData: templateData || {},
        date: new Date().toISOString(),
        duration: 0,
        audioBlob: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      };

      // Get existing sessions from localStorage
      const existingSessions = localStorage.getItem('medicalSessions');
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];
      
      // Add new session
      sessions.push(newSession);
      localStorage.setItem('medicalSessions', JSON.stringify(sessions));

      // Update patient with new session
      const updatedPatient = {
        ...selectedPatient,
        lastSession: new Date().toISOString(),
        sessionCount: (selectedPatient.sessionCount || 0) + 1,
      };
      
      // Update patient in localStorage (this should be done through usePatients hook ideally)
      const existingPatients = localStorage.getItem('medicalPatients');
      const patients = existingPatients ? JSON.parse(existingPatients) : [];
      const patientIndex = patients.findIndex((p: Patient) => p.id === selectedPatient.id);
      if (patientIndex !== -1) {
        patients[patientIndex] = updatedPatient;
        localStorage.setItem('medicalPatients', JSON.stringify(patients));
      }

      console.log("Session saved successfully:", newSession);
      
      // Go back to profile to show the new session
      setCurrentView("profile");
    } catch (error) {
      console.error("Error saving session:", error);
      // Still go back to profile even if save fails
      setCurrentView("profile");
    }
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
        {/* Search Bar and View Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search patients by name, condition, medication, diagnosis..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 w-96"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(ageFilter || medicalAidFilter || recentVisitsFilter) && (
                  <Badge variant="secondary" className="ml-1">
                    {[ageFilter, medicalAidFilter, recentVisitsFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* View Mode Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setDashboardViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  dashboardViewMode === 'cards'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDashboardViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  dashboardViewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDashboardViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  dashboardViewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredPatients.length} patients
            </Badge>
            </div>
          </div>
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAgeFilter(null);
                    setMedicalAidFilter("");
                    setRecentVisitsFilter(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Age Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Age Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={ageFilter?.min || ''}
                      onChange={(e) => setAgeFilter(prev => ({
                        min: parseInt(e.target.value) || 0,
                        max: prev?.max || 100
                      }))}
                      className="w-20"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={ageFilter?.max || ''}
                      onChange={(e) => setAgeFilter(prev => ({
                        min: prev?.min || 0,
                        max: parseInt(e.target.value) || 100
                      }))}
                      className="w-20"
                    />
                  </div>
                </div>
                
                {/* Medical Aid Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Medical Aid</label>
                  <select
                    value={medicalAidFilter}
                    onChange={(e) => setMedicalAidFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Medical Aids</option>
                    <option value="Discovery Health">Discovery Health</option>
                    <option value="Bonitas">Bonitas</option>
                    <option value="Momentum Health">Momentum Health</option>
                    <option value="Medscheme">Medscheme</option>
                  </select>
                </div>
                
                {/* Recent Visits Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Visit Recency</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recentVisits"
                      checked={recentVisitsFilter}
                      onChange={(e) => setRecentVisitsFilter(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="recentVisits" className="text-sm text-gray-600">
                      Visited in last 30 days
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Patients Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
        </div>

        {/* Cards View */}
        {dashboardViewMode === 'cards' && (
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
        )}

        {/* Grid View */}
        {dashboardViewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 hover:scale-105 transition-all duration-300 cursor-pointer group text-center"
                onClick={() => handlePatientClick(patient)}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-3">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors truncate">
                  {patient.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">Age {patient.age}</p>
                <Badge variant="secondary" className="text-xs">
                  {patient.sessionCount}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {dashboardViewMode === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
              <div>Patient</div>
              <div>Age</div>
              <div>Last Visit</div>
              <div>Sessions</div>
              <div>Status</div>
            </div>
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="grid grid-cols-5 gap-4 p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer group transition-colors"
                onClick={() => handlePatientClick(patient)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {patient.name}
                    </h3>
                    {patient.contact && (
                      <p className="text-xs text-gray-500">{patient.contact}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  {patient.age} years
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  {patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits'}
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="text-xs">
                    {patient.sessionCount} sessions
                  </Badge>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* Edit Patient Modal */}
      <EditPatientModal
        patient={editingPatient}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onPatientUpdated={handlePatientUpdated}
      />
    </div>
  );
}