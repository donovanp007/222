"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Clock, Phone, User, FileText, Edit, Trash2, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Patient, Session } from "@/types";

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onStartTranscription?: (patient: Patient) => void;
}

// Mock session data
const mockSessions: Session[] = [
  {
    id: "1",
    patientId: "1",
    title: "Initial Consultation",
    content: "Patient presents with recurring headaches and fatigue. Symptoms began approximately 2 weeks ago...",
    createdAt: new Date("2024-07-10T09:30:00"),
    updatedAt: new Date("2024-07-10T10:15:00"),
  },
  {
    id: "2",
    patientId: "1", 
    title: "Follow-up Visit",
    content: "Patient reports improvement in headache frequency. Sleep quality has improved since last visit...",
    createdAt: new Date("2024-06-25T14:20:00"),
    updatedAt: new Date("2024-06-25T14:45:00"),
  },
  {
    id: "3",
    patientId: "1",
    title: "Routine Check-up",
    content: "Annual physical examination. All vital signs within normal limits. Patient is maintaining good health...",
    createdAt: new Date("2024-05-15T11:00:00"),
    updatedAt: new Date("2024-05-15T11:30:00"),
  },
];

export function PatientProfile({ patient, onBack, onEditPatient, onDeletePatient, onStartTranscription }: PatientProfileProps) {
  const [sessions] = useState<Session[]>(
    mockSessions.filter(session => session.patientId === patient.id)
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-gray-200">
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
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Sessions</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {patient.sessionCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Session History</h2>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => onStartTranscription?.(patient)}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(session.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(session.createdAt)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTimeAgo(session.createdAt)}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {session.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                  <p className="text-gray-500 mb-6">
                    Start by creating your first session with this patient.
                  </p>
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => onStartTranscription?.(patient)}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start First Recording
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}