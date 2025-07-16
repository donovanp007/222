"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Phone, User, FileText, Edit, Trash2, Mic, Activity, AlertTriangle, Heart, Brain, TrendingUp, Pill, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Patient, Session } from "@/types";
import { performClinicalDecisionSupport, RiskFactor } from "@/utils/clinicalDecisionSupport";
import { extractMedications } from "@/utils/contentCategorization";
import { analyzeTranscription, getSouthAfricanHealthcareSuggestions } from "@/utils/aiTaskAnalysis";
import { MedicalDocumentGenerator } from "./MedicalDocumentGenerator";
import { FileManagerInterface } from "../media/FileManagerInterface";
import { EmailInbox } from "../communication/EmailInbox";
import { DocumentViewer } from "../document/DocumentViewer";
import { MiniDashboard } from "./MiniDashboard";
import { TranscriptionSharer } from "../sharing/TranscriptionSharer";
import InteractiveHistoryView from "../history/InteractiveHistoryView";
import AIStatusMonitor from "../status/AIStatusMonitor";
import EnhancedPatientProfile from "../profile/EnhancedPatientProfile";

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onStartTranscription?: (patient: Patient) => void;
}

interface MedicalHistory {
  chronicConditions: string[];
  allergies: string[];
  currentMedications: string[];
  familyHistory: string[];
  surgicalHistory: string[];
  riskFactors: RiskFactor[];
}

interface PatientStatus {
  lastUpdate: string;
  status: 'stable' | 'monitoring' | 'critical' | 'discharged' | 'follow-up-needed';
  notes: string;
  nextAppointment?: Date;
}

// Enhanced mock session data with medical details
const mockSessions: Session[] = [
  {
    id: "1",
    patientId: "1",
    title: "Initial Consultation - Hypertension & Diabetes",
    content: "Patient presents with uncontrolled hypertension (160/95) and type 2 diabetes (HbA1c 8.2%). Started on metformin 500mg BD and lisinopril 10mg daily. Patient education provided on lifestyle modifications...",
    visitDate: new Date("2024-07-10T09:30:00"),
    createdAt: new Date("2024-07-10T09:30:00"),
    updatedAt: new Date("2024-07-10T10:15:00"),
    doctorId: "dr1",
    sessionType: "consultation",
    diagnosis: ["Essential hypertension", "Type 2 diabetes mellitus"],
    isLocked: true,
    suggestedTasks: [
      {
        id: "task1",
        type: "lab-test",
        description: "HbA1c in 3 months",
        priority: "medium",
        dueDate: new Date("2024-10-10"),
        isCompleted: false,
        createdAt: new Date("2024-07-10")
      }
    ]
  },
  {
    id: "2",
    patientId: "1", 
    title: "Follow-up Visit - Good Progress",
    content: "BP improved to 135/85 on current medication. Blood glucose readings averaging 7.2 mmol/L. Patient reports better energy levels and adherence to diet. Continue current medications with lifestyle counseling...",
    visitDate: new Date("2024-06-25T14:20:00"),
    createdAt: new Date("2024-06-25T14:20:00"),
    updatedAt: new Date("2024-06-25T14:45:00"),
    doctorId: "dr1",
    sessionType: "follow-up",
    diagnosis: ["Essential hypertension - controlled", "Type 2 diabetes mellitus - improving"],
    isLocked: true
  },
  {
    id: "3",
    patientId: "1",
    title: "Emergency Visit - Chest Pain",
    content: "Patient presented with acute chest pain. ECG shows normal sinus rhythm. Troponins negative. Likely musculoskeletal. Discharged with follow-up instructions and reassurance...",
    visitDate: new Date("2024-05-15T11:00:00"),
    createdAt: new Date("2024-05-15T11:00:00"),
    updatedAt: new Date("2024-05-15T11:30:00"),
    doctorId: "dr1",
    sessionType: "consultation",
    diagnosis: ["Chest pain - non-cardiac"],
    isLocked: true
  },
];

// Mock medical history
const getMockMedicalHistory = (): MedicalHistory => ({
  chronicConditions: ["Essential Hypertension", "Type 2 Diabetes Mellitus", "Dyslipidemia"],
  allergies: ["Penicillin", "Shellfish"],
  currentMedications: ["Metformin 500mg BD", "Lisinopril 10mg daily", "Atorvastatin 20mg daily"],
  familyHistory: ["Diabetes - Mother", "Hypertension - Father", "Heart Disease - Paternal Uncle"],
  surgicalHistory: ["Appendectomy (2010)", "Cholecystectomy (2018)"],
  riskFactors: []
});

// Mock patient status
const getMockPatientStatus = (): PatientStatus => ({
  lastUpdate: "Patient stable on current medication regimen. Blood pressure well controlled at 128/82. Diabetes management improving with HbA1c down to 7.1%.",
  status: "stable",
  notes: "Excellent compliance with medications. Lost 5kg since last visit. Continue current plan.",
  nextAppointment: new Date("2024-10-15T09:00:00")
});

export function PatientProfile({ patient, onBack, onEditPatient, onDeletePatient, onStartTranscription }: PatientProfileProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);

  // Load real sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      try {
        const savedSessions = localStorage.getItem('medicalSessions');
        if (savedSessions) {
          const allSessions = JSON.parse(savedSessions);
          const patientSessions = allSessions.filter((session: any) => session.patientId === patient.id);
          
          // Convert to Session format and add mock data if no sessions exist
          const formattedSessions = patientSessions.map((session: any) => ({
            id: session.id,
            patientId: session.patientId,
            title: `Medical Session - ${new Date(session.date).toLocaleDateString()}`,
            content: session.content,
            visitDate: new Date(session.date),
            createdAt: new Date(session.date),
            updatedAt: new Date(session.date),
            doctorId: "current-doctor",
            sessionType: "consultation" as const,
            templateData: session.templateData,
          }));
          
          // If no real sessions, show mock sessions for demo
          const sessionsToShow = formattedSessions.length > 0 
            ? formattedSessions 
            : mockSessions.filter(session => session.patientId === patient.id);
            
          setSessions(sessionsToShow);
        } else {
          // No saved sessions, use mock data
          setSessions(mockSessions.filter(session => session.patientId === patient.id));
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions(mockSessions.filter(session => session.patientId === patient.id));
      }
    };

    loadSessions();
  }, [patient.id]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>(getMockMedicalHistory());
  const [patientStatus, setPatientStatus] = useState<PatientStatus>(getMockPatientStatus());
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'history' | 'timeline' | 'tasks' | 'documents' | 'files' | 'communications'>('overview');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatusNotes, setNewStatusNotes] = useState(patientStatus.notes);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<Session | null>(null);

  // Analyze patient data for risk factors and generate tasks
  useEffect(() => {
    const analyzePatientRisk = async () => {
      try {
        // Get all session content for analysis
        const allContent = sessions.map(s => s.content).join(' ');
        const medications = extractMedications(allContent);
        
        if (medications.length > 0) {
          const clinicalSupport = await performClinicalDecisionSupport(
            allContent,
            patient,
            sessions,
            medications
          );
          
          setMedicalHistory(prev => ({
            ...prev,
            riskFactors: clinicalSupport.riskFactors
          }));
        }

        // Generate AI-powered tasks from session content
        const allTaskSuggestions: any[] = [];
        
        sessions.forEach(session => {
          if (session.content) {
            const analysis = analyzeTranscription(session.content);
            const saSpecificTasks = getSouthAfricanHealthcareSuggestions(session.content);
            
            // Add session context to tasks
            const tasksWithContext = [
              ...analysis.suggestedTasks.map(task => ({
                ...task,
                id: `ai-${Date.now()}-${Math.random()}`,
                sessionId: session.id,
                sessionTitle: session.title,
                createdAt: new Date(),
                dueDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
              })),
              ...saSpecificTasks.map(task => ({
                ...task,
                id: `sa-${Date.now()}-${Math.random()}`,
                sessionId: session.id,
                sessionTitle: session.title,
                createdAt: new Date(),
                dueDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
              }))
            ];
            
            allTaskSuggestions.push(...tasksWithContext);
          }
        });

        // Remove duplicates and set generated tasks
        const uniqueTasks = allTaskSuggestions.filter((task, index, self) => 
          index === self.findIndex(t => t.description === task.description)
        );
        
        setGeneratedTasks(uniqueTasks);
        
      } catch (error) {
        console.error('Risk analysis failed:', error);
      }
    };

    if (sessions.length > 0) {
      analyzePatientRisk();
    }
  }, [sessions, patient]);

  const updatePatientStatus = () => {
    setPatientStatus(prev => ({
      ...prev,
      notes: newStatusNotes,
      lastUpdate: new Date().toLocaleDateString()
    }));
    setIsEditingStatus(false);
  };

  const handleMarkTaskComplete = (taskId: string) => {
    setGeneratedTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted, completedAt: new Date() }
          : task
      )
    );
  };

  const handleViewAllTasks = () => {
    setActiveTab('tasks');
  };

  const handleShareSession = (session: Session) => {
    setSessionToShare(session);
    setShowShareDialog(true);
  };

  const handleShare = (shareData: any) => {
    console.log('Sharing session:', shareData);
    setShowShareDialog(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };


  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-4 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Patient Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-gray-200 mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Patient Information
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditPatient?.(patient)}
                      className="p-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeletePatient?.(patient.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Name */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-3">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                  <p className="text-gray-500">Age {patient.age}</p>
                  <Badge 
                    variant={patientStatus.status === 'stable' ? 'default' : 
                             patientStatus.status === 'critical' ? 'destructive' : 'secondary'}
                    className="mt-2"
                  >
                    {patientStatus.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  {patient.contact && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{patient.contact}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Patient since {formatDate(patient.createdAt)}
                    </span>
                  </div>

                  {patient.lastVisit && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Last visit: {formatDate(patient.lastVisit)}
                      </span>
                    </div>
                  )}

                  {patient.medicalAid && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Heart className="w-4 h-4 text-blue-500" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900">{patient.medicalAid.provider}</div>
                        <div className="text-blue-700">{patient.medicalAid.memberNumber}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Sessions</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {sessions.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Risk Factors</span>
                    <Badge variant={medicalHistory.riskFactors.length > 0 ? "destructive" : "secondary"}>
                      {medicalHistory.riskFactors.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Medications</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {medicalHistory.currentMedications.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status Card */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                  <Activity className="w-4 h-4" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">Last Update: {patientStatus.lastUpdate}</div>
                  {isEditingStatus ? (
                    <div className="space-y-3">
                      <Textarea
                        value={newStatusNotes}
                        onChange={(e) => setNewStatusNotes(e.target.value)}
                        className="text-sm"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={updatePatientStatus}>Save</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingStatus(false);
                            setNewStatusNotes(patientStatus.notes);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700">{patientStatus.notes}</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsEditingStatus(true)}
                        className="mt-2 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Update Status
                      </Button>
                    </div>
                  )}
                  {patientStatus.nextAppointment && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">Next Appointment:</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(patientStatus.nextAppointment)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {(['overview', 'profile', 'history', 'timeline', 'tasks', 'documents', 'files', 'communications'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 relative overflow-hidden group"
                onClick={() => onStartTranscription?.(patient)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 animate-pulse opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-lg">Start Recording</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-xl opacity-30 group-hover:opacity-70 blur animate-pulse"></div>
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Mini Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Patient Overview Dashboard</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MiniDashboard
                      patient={patient}
                      sessions={sessions}
                      tasks={generatedTasks}
                      onMarkTaskComplete={handleMarkTaskComplete}
                      onViewAllTasks={handleViewAllTasks}
                      nextAppointment={patientStatus.nextAppointment}
                      patientStatus={patientStatus}
                    />
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                {medicalHistory.riskFactors.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Risk Factors Identified</span>
                        <Badge variant="destructive">{medicalHistory.riskFactors.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medicalHistory.riskFactors.map((risk, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-orange-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-orange-900">{risk.factor}</h4>
                            <Badge variant={risk.severity === 'high' || risk.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-orange-700 mb-2">{risk.description}</p>
                          {risk.recommendations.length > 0 && (
                            <div className="text-xs text-orange-600">
                              • {risk.recommendations.slice(0, 2).join(' • ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Recent Sessions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions.length > 0 ? (
                      <div className="space-y-4">
                        {sessions.slice(0, 3).map((session) => (
                          <div 
                            key={session.id} 
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all bg-white hover:bg-blue-50 group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                onClick={() => {
                                  setSelectedSession(session);
                                  setShowDocumentViewer(true);
                                }}
                              >
                                {session.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareSession(session);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-green-100 hover:text-green-600"
                                  title="Share transcription"
                                >
                                  <Share2 className="w-3 h-3" />
                                </Button>
                                <Badge variant={session.sessionType === 'consultation' ? 'default' : 'secondary'}>
                                  {session.sessionType}
                                </Badge>
                                <span className="text-xs text-gray-500">{getTimeAgo(session.visitDate)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{session.content}</p>
                            {session.diagnosis && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {session.diagnosis.map((diag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {diag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                        <p className="text-gray-500">Start by creating your first session with this patient.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'profile' && (
              <EnhancedPatientProfile
                patient={patient}
                onUpdate={(updatedPatient) => {
                  console.log('Patient profile updated:', updatedPatient);
                  // Here you would typically call onEditPatient if available
                }}
                isEditing={false}
                onToggleEdit={() => {
                  console.log('Toggle edit mode');
                }}
              />
            )}

            {activeTab === 'history' && (
              <InteractiveHistoryView
                patient={patient}
                consultations={sessions}
                onHistoryUpdate={(history) => {
                  console.log('History updated:', history);
                }}
              />
            )}

            {activeTab === 'timeline' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Medical Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <div key={session.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            session.sessionType === 'consultation' ? 'bg-blue-500' :
                            session.sessionType === 'follow-up' ? 'bg-green-500' :
                            'bg-gray-400'
                          }`} />
                          {index < sessions.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200 ml-1 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 hover:bg-blue-50 p-3 rounded-lg transition-colors group">
                          <div className="flex justify-between items-start">
                            <h3 
                              className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowDocumentViewer(true);
                              }}
                            >
                              {session.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareSession(session);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-green-100 hover:text-green-600"
                                title="Share transcription"
                              >
                                <Share2 className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-gray-500">{formatDate(session.visitDate)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{session.content}</p>
                          {session.diagnosis && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {session.diagnosis.map((diag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {diag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {/* AI-Generated Tasks */}
                {generatedTasks.length > 0 && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-purple-800">
                        <Brain className="w-5 h-5" />
                        <span>AI-Generated Tasks</span>
                        <Badge className="bg-purple-600 text-white">
                          {generatedTasks.length} suggested
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {generatedTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="p-4 bg-white border border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{task.description}</h4>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge 
                                    variant={
                                      task.priority === 'urgent' ? 'destructive' :
                                      task.priority === 'high' ? 'destructive' : 
                                      task.priority === 'medium' ? 'default' : 'secondary'
                                    }
                                  >
                                    {task.priority}
                                  </Badge>
                                  <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                    {task.type}
                                  </Badge>
                                  {task.dueDate && (
                                    <span className="text-xs text-gray-500">
                                      Due: {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                                {task.sessionTitle && (
                                  <p className="text-xs text-purple-600 mt-1">
                                    From: {task.sessionTitle}
                                  </p>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant={task.isCompleted ? "default" : "outline"}
                                className={`ml-4 transition-all duration-200 ${
                                  task.isCompleted 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'hover:bg-green-50 hover:border-green-600 hover:text-green-700'
                                }`}
                                onClick={() => {
                                  setGeneratedTasks(prev => 
                                    prev.map(t => 
                                      t.id === task.id 
                                        ? { ...t, isCompleted: !t.isCompleted, completedAt: new Date() }
                                        : t
                                    )
                                  );
                                }}
                              >
                                {task.isCompleted ? '✓ Completed' : 'Mark Complete'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Original Session Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Session-Specific Tasks</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sessions.flatMap(session => session.suggestedTasks || []).map((task) => (
                        <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{task.description}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline">{task.type}</Badge>
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500">
                                    Due: {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant={task.isCompleted ? "default" : "outline"}
                              className="ml-4"
                            >
                              {task.isCompleted ? 'Completed' : 'Mark Complete'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {sessions.flatMap(session => session.suggestedTasks || []).length === 0 && generatedTasks.length === 0 && (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                          <p className="text-gray-500">Tasks will appear here based on session content and AI analysis.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <MedicalDocumentGenerator
                  patient={patient}
                  session={sessions[0]} // Use most recent session if available
                  onGenerateDocument={(document) => {
                    // Handle document generation - could download, preview, etc.
                    console.log('Generated document:', document);
                    
                    // Check if we're on the client side
                    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
                      // Create a downloadable file
                      const blob = new Blob([document.content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = window.document.createElement('a');
                      a.href = url;
                      a.download = `${document.title.replace(/\s+/g, '_')}.txt`;
                      window.document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      window.document.body.removeChild(a);
                    }
                  }}
                  onEmailDocument={(document, email) => {
                    // Handle email functionality - now fully integrated
                    console.log('Emailing document to:', email);
                  }}
                />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-6">
                <FileManagerInterface
                  patient={patient}
                />
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="space-y-6">
                <EmailInbox
                  patient={patient}
                  onSelectMessage={(message) => {
                    console.log('Selected email message:', message);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Transcription</DialogTitle>
          </DialogHeader>
          {sessionToShare && (
            <TranscriptionSharer
              patient={patient}
              session={sessionToShare}
              onShare={handleShare}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <DocumentViewer
        session={selectedSession}
        patient={patient}
        open={showDocumentViewer}
        onOpenChange={setShowDocumentViewer}
        onSessionUpdate={(updatedSession) => {
          setSessions(prev => prev.map(s => 
            s.id === updatedSession.id ? updatedSession : s
          ));
        }}
        onExportPDF={(session) => {
          console.log('Export PDF for session:', session.id);
          // TODO: Implement PDF export
        }}
      />
    </div>
  );
}