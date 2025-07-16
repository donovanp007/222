"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Edit, 
  Save, 
  Lock, 
  Unlock, 
  Download, 
  Eye, 
  X,
  Clock,
  User,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient, Session } from "@/types";
import { exportSessionToPDF } from "@/utils/pdfExporter";
import { TranscriptionSharer } from "../sharing/TranscriptionSharer";

interface DocumentViewerProps {
  session: Session | null;
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdate?: (updatedSession: Session) => void;
  onExportPDF?: (session: Session) => void;
}

export function DocumentViewer({ 
  session, 
  patient, 
  open, 
  onOpenChange, 
  onSessionUpdate, 
  onExportPDF 
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedTemplateData, setEditedTemplateData] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'structured' | 'comparison' | 'share'>('structured');

  React.useEffect(() => {
    if (session) {
      setEditedContent(session.content || "");
      setEditedTemplateData(session.templateData || {});
    }
  }, [session]);

  if (!session) return null;

  const isLocked = session.isLocked || false;
  const canEdit = !isLocked;

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onSessionUpdate) {
      const updatedSession: Session = {
        ...session,
        content: editedContent,
        templateData: editedTemplateData,
        updatedAt: new Date(),
      };
      onSessionUpdate(updatedSession);
      
      // Persist to localStorage
      try {
        const savedSessions = localStorage.getItem('medicalSessions');
        if (savedSessions) {
          const allSessions = JSON.parse(savedSessions);
          const updatedSessions = allSessions.map((s: any) => 
            s.id === session.id ? { 
              ...s, 
              content: editedContent,
              templateData: editedTemplateData,
              updatedAt: new Date().toISOString() 
            } : s
          );
          localStorage.setItem('medicalSessions', JSON.stringify(updatedSessions));
        }
      } catch (error) {
        console.error('Failed to persist edit:', error);
      }
    }
    setIsEditing(false);
  };

  const handleLockDocument = () => {
    if (onSessionUpdate) {
      const updatedSession: Session = {
        ...session,
        isLocked: true,
        updatedAt: new Date(),
      };
      onSessionUpdate(updatedSession);
      
      // Persist to localStorage
      try {
        const savedSessions = localStorage.getItem('medicalSessions');
        if (savedSessions) {
          const allSessions = JSON.parse(savedSessions);
          const updatedSessions = allSessions.map((s: any) => 
            s.id === session.id ? { ...s, isLocked: true, updatedAt: new Date().toISOString() } : s
          );
          localStorage.setItem('medicalSessions', JSON.stringify(updatedSessions));
        }
      } catch (error) {
        console.error('Failed to persist lock state:', error);
      }
    }
  };

  const handleUnlockDocument = () => {
    if (onSessionUpdate) {
      const updatedSession: Session = {
        ...session,
        isLocked: false,
        updatedAt: new Date(),
      };
      onSessionUpdate(updatedSession);
      
      // Persist to localStorage
      try {
        const savedSessions = localStorage.getItem('medicalSessions');
        if (savedSessions) {
          const allSessions = JSON.parse(savedSessions);
          const updatedSessions = allSessions.map((s: any) => 
            s.id === session.id ? { ...s, isLocked: false, updatedAt: new Date().toISOString() } : s
          );
          localStorage.setItem('medicalSessions', JSON.stringify(updatedSessions));
        }
      } catch (error) {
        console.error('Failed to persist unlock state:', error);
      }
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };

  const handleShare = (shareData: any) => {
    console.log('Sharing transcription:', shareData);
    // Here you could implement actual email sending, file sharing, etc.
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 -mx-6 -mt-6 mb-6 rounded-t-lg">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{session.title || "Medical Session"}</h2>
                <p className="text-blue-100 text-sm">{patient.name} {patient.surname}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Badge className="bg-red-500 text-white">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-white">
                  <Unlock className="w-3 h-3 mr-1" />
                  Editable
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Visit Date</p>
                    <p className="text-gray-600">
                      {session.visitDate ? formatDate(session.visitDate) : formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-gray-600">N/A</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p className="text-gray-600">{session.doctorId || 'Current User'}</p>
                  </div>
                </div>
              </div>
              
              {session.diagnosis && session.diagnosis.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Diagnosis:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.diagnosis.map((diag, index) => (
                      <Badge key={index} variant="outline">{diag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('structured')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'structured'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Structured View
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'comparison'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Comparison View
              </button>
              <button
                onClick={() => setViewMode('share')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'share'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📤 Share
              </button>
            </div>
          </div>

          {viewMode === 'comparison' ? (
            /* Comparison View */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Raw vs Processed Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Raw Transcription */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        📝 Original Raw Transcription
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 min-h-[300px]">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {session.content || 'No raw transcription available'}
                        </pre>
                      </div>
                    </div>

                    {/* Processed/Structured */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        🎯 Processed & Structured
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[300px]">
                        {session.templateData && Object.keys(session.templateData).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(session.templateData).map(([sectionId, content]) => (
                              <div key={sectionId} className="bg-white rounded-lg p-3 border border-blue-300">
                                <h5 className="font-medium text-blue-900 mb-2 capitalize text-sm">
                                  {sectionId.replace(/_/g, ' ')}
                                </h5>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {content || 'No content'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 italic text-center mt-8">
                            No structured data available.<br/>
                            Content was saved as raw transcription only.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🧠 Processing Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border">
                        <span className="text-gray-500">Raw Length:</span>
                        <div className="font-semibold">{session.content?.length || 0} characters</div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <span className="text-gray-500">Structured Sections:</span>
                        <div className="font-semibold">
                          {session.templateData ? Object.keys(session.templateData).length : 0} sections
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <span className="text-gray-500">Processing Status:</span>
                        <div className="font-semibold text-green-600">
                          {session.templateData && Object.keys(session.templateData).length > 0 ? 'Structured' : 'Raw Only'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'share' ? (
            /* Share View */
            <div className="space-y-6">
              <TranscriptionSharer
                patient={patient}
                session={session}
                onShare={handleShare}
              />
            </div>
          ) : (
            /* Structured View */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Medical Notes</CardTitle>
                  <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartEdit}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        exportSessionToPDF(patient, session);
                      } catch (error) {
                        console.error('PDF export failed:', error);
                        // Could add toast notification here
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>

                  {!isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLockDocument}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Lock className="w-4 h-4" />
                      Lock Final
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnlockDocument}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700"
                    >
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Data */}
              {session.templateData && Object.keys(session.templateData).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Structured Notes:</h4>
                  {Object.entries(session.templateData).map(([sectionId, content]) => (
                    <div key={sectionId} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-2 capitalize">
                        {sectionId.replace(/_/g, ' ')}
                      </h5>
                      {isEditing ? (
                        <Textarea
                          value={editedTemplateData[sectionId] || content}
                          onChange={(e) => setEditedTemplateData(prev => ({
                            ...prev,
                            [sectionId]: e.target.value
                          }))}
                          className="min-h-[80px]"
                          placeholder={`Enter ${sectionId.replace(/_/g, ' ')}...`}
                        />
                      ) : (
                        <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {content || 'No content recorded'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw Content */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Raw Transcription:</h4>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="Enter transcription content..."
                  />
                ) : (
                  <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                    {session.content || 'No transcription content'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(session.updatedAt || session.createdAt)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}