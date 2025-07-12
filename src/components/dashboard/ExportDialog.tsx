"use client";

import { useState } from "react";
import { Download, FileText, File, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalReportExporter, ExportOptions } from "@/utils/exportUtils";
import { Patient, Session } from "@/types";
import { useSessions } from "@/hooks/useSessions";

interface ExportDialogProps {
  patient: Patient;
  session?: Session;
  sessions?: Session[];
  children: React.ReactNode;
}

export function ExportDialog({ patient, session, sessions, children }: ExportDialogProps) {
  const { addExportRecord } = useSessions();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includePatientInfo: true,
    includeSessionContent: true,
    includeTaskSuggestions: true,
    includeDiagnosis: true,
    format: 'pdf',
    title: 'Medical Consultation Report',
    hospitalName: '',
    doctorName: '',
    doctorCredentials: '',
  });

  const handleExport = async () => {
    if (!session && (!sessions || sessions.length === 0)) {
      console.error('No session data to export');
      return;
    }

    setIsExporting(true);
    
    try {
      if (session) {
        // Single session export
        await MedicalReportExporter.exportSession(patient, session, exportOptions);
        
        // Record the export
        addExportRecord(session.id, {
          format: exportOptions.format,
          fileName: `${patient.surname}_${patient.name}_${session.visitDate.toISOString().split('T')[0]}.${exportOptions.format}`,
          exportedBy: exportOptions.doctorName || 'Unknown Doctor'
        });
      } else if (sessions && sessions.length > 0) {
        // Multiple sessions export
        await MedicalReportExporter.exportMultipleSessions(patient, sessions, exportOptions);
        
        // Record export for all sessions
        sessions.forEach(sess => {
          addExportRecord(sess.id, {
            format: exportOptions.format,
            fileName: `${patient.surname}_${patient.name}_complete_history.${exportOptions.format}`,
            exportedBy: exportOptions.doctorName || 'Unknown Doctor'
          });
        });
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'docx':
        return <File className="w-4 h-4 text-blue-500" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'Professional PDF report with formatting';
      case 'docx':
        return 'Editable Microsoft Word document';
      case 'txt':
        return 'Plain text file for simple viewing';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Medical Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {patient.name} {patient.surname}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {session ? (
                      `${session.title} - ${session.visitDate.toLocaleDateString()}`
                    ) : (
                      `Complete medical history (${sessions?.length || 0} sessions)`
                    )}
                  </p>
                </div>
                <Badge variant="secondary">
                  {session ? 'Single Session' : 'Complete History'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Export Format
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(['pdf', 'docx', 'txt'] as const).map(format => (
                <Card
                  key={format}
                  className={`cursor-pointer transition-all duration-200 ${
                    exportOptions.format === format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getFormatIcon(format)}
                    </div>
                    <div className="font-semibold text-sm uppercase">
                      {format}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getFormatDescription(format)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Options */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Include in Report
            </Label>
            <div className="space-y-3">
              {[
                {
                  key: 'includePatientInfo',
                  label: 'Patient Information',
                  description: 'Name, age, contact details, medical aid'
                },
                {
                  key: 'includeSessionContent',
                  label: 'Session Content',
                  description: 'Full consultation notes and transcription'
                },
                {
                  key: 'includeDiagnosis',
                  label: 'Diagnosis Information',
                  description: 'Extracted diagnoses and medical conditions'
                },
                {
                  key: 'includeTaskSuggestions',
                  label: 'Recommended Actions',
                  description: 'AI-suggested follow-ups and tasks'
                }
              ].map(option => (
                <div key={option.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={option.key}
                    checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                    onChange={(e) =>
                      setExportOptions(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.key} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Report Title
              </Label>
              <Input
                id="title"
                value={exportOptions.title}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Medical Consultation Report"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hospital" className="text-sm font-medium text-gray-700">
                Hospital/Practice Name
              </Label>
              <Input
                id="hospital"
                value={exportOptions.hospitalName}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, hospitalName: e.target.value }))
                }
                placeholder="Your Practice Name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="doctor" className="text-sm font-medium text-gray-700">
                Doctor Name
              </Label>
              <Input
                id="doctor"
                value={exportOptions.doctorName}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, doctorName: e.target.value }))
                }
                placeholder="Dr. John Smith"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="credentials" className="text-sm font-medium text-gray-700">
                Credentials
              </Label>
              <Input
                id="credentials"
                value={exportOptions.doctorCredentials}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, doctorCredentials: e.target.value }))
                }
                placeholder="MBChB, FCP(SA)"
                className="mt-1"
              />
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Export {exportOptions.format.toUpperCase()}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}