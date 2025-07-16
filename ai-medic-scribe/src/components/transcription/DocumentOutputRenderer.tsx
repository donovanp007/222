"use client";

import { useState, useRef } from "react";
import { FileText, Download, Mail, Printer, Eye, Edit, Save, CheckCircle, AlertTriangle, Clock, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { IntelligentAnalysis } from "@/utils/intelligentFormatting";
import { Patient } from "@/types";
import { Template } from "@/types/template";

interface DocumentOutputRendererProps {
  analysis: IntelligentAnalysis | null;
  patient: Patient;
  template: Template;
  isGenerating: boolean;
  onSectionEdit: (sectionId: string, newContent: string) => void;
  onExportPdf?: () => void;
  onEmailDocument?: () => void;
  onPrintDocument?: () => void;
  className?: string;
}

interface DocumentStyle {
  headerColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: string;
  showWatermark: boolean;
  showConfidenceScores: boolean;
}

const DEFAULT_STYLE: DocumentStyle = {
  headerColor: '#007AFF',
  accentColor: '#34C759',
  fontFamily: 'Inter',
  fontSize: '14px',
  showWatermark: false,
  showConfidenceScores: true
};

export function DocumentOutputRenderer({
  analysis,
  patient,
  template,
  isGenerating,
  onSectionEdit,
  onExportPdf,
  onEmailDocument,
  onPrintDocument,
  className
}: DocumentOutputRendererProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [documentStyle, setDocumentStyle] = useState<DocumentStyle>(DEFAULT_STYLE);
  const [showStyleControls, setShowStyleControls] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleEditStart = (sectionId: string, currentContent: string) => {
    setEditingSectionId(sectionId);
    setEditingContent(currentContent);
  };

  const handleEditSave = () => {
    if (editingSectionId) {
      onSectionEdit(editingSectionId, editingContent);
      setEditingSectionId(null);
      setEditingContent("");
    }
  };

  const handleEditCancel = () => {
    setEditingSectionId(null);
    setEditingContent("");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const formatPatientAge = () => {
    if (patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    }
    return patient.age;
  };

  if (isGenerating) {
    return (
      <Card className={`bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-6 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Creating Beautiful Medical Document</h3>
              <p className="text-gray-600">AI is analyzing and formatting your transcription...</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={`border-2 border-gray-200 ${className}`}>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No document generated</h3>
          <p className="text-gray-500">Start recording to generate a medical document</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Controls */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medical Document</h3>
                <p className="text-sm text-gray-600">{template.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStyleControls(!showStyleControls)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Style
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPrintDocument}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEmailDocument}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                size="sm"
                onClick={onExportPdf}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Document Quality Indicators */}
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className={`flex items-center gap-2 ${
                analysis.urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
                analysis.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                analysis.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {analysis.urgencyLevel === 'critical' && <AlertTriangle className="w-4 h-4" />}
                {analysis.urgencyLevel !== 'critical' && <CheckCircle className="w-4 h-4" />}
                {analysis.urgencyLevel.charAt(0).toUpperCase() + analysis.urgencyLevel.slice(1)} Priority
              </Badge>
              <Badge className="bg-blue-100 text-blue-700">
                {Math.round(analysis.completeness * 100)}% Complete
              </Badge>
              <Badge className="bg-purple-100 text-purple-700">
                {analysis.formattedSections.length} Sections
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              Generated {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card 
        ref={documentRef}
        className="border-2 border-gray-200 bg-white shadow-lg print:shadow-none print:border-none"
        style={{ fontFamily: documentStyle.fontFamily, fontSize: documentStyle.fontSize }}
      >
        {/* Document Header */}
        <div 
          className="p-8 border-b-4 print:p-6"
          style={{ borderColor: documentStyle.headerColor }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Consultation</h1>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Patient:</span>
                  <span>{patient.name} {patient.surname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Age:</span>
                  <span>{formatPatientAge()} years</span>
                </div>
                {patient.medicalAid && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Medical Aid:</span>
                    <span>{patient.medicalAid.provider} - {patient.medicalAid.memberNumber}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: documentStyle.headerColor }}>
                AI Medical Scribe
              </div>
              <div className="text-sm text-gray-600">Smart Healthcare Documentation</div>
              {documentStyle.showWatermark && (
                <div className="text-xs text-gray-400 mt-2 opacity-50">
                  DRAFT - REVIEW REQUIRED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Summary */}
        {analysis.clinicalSummary && (
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: documentStyle.accentColor }}
              >
                ✓
              </div>
              Clinical Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{analysis.clinicalSummary}</p>
          </div>
        )}

        {/* Document Sections */}
        <div className="p-8 space-y-8">
          {analysis.formattedSections.map((section, index) => (
            <div key={section.sectionId} className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg text-white text-sm font-bold flex items-center justify-center"
                    style={{ backgroundColor: documentStyle.headerColor }}
                  >
                    {index + 1}
                  </div>
                  {section.sectionTitle}
                </h2>
                <div className="flex items-center gap-2">
                  {documentStyle.showConfidenceScores && (
                    <Badge className={`text-xs ${getConfidenceColor(section.confidence)} border`}>
                      {getConfidenceIcon(section.confidence)}
                      {Math.round(section.confidence * 100)}%
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStart(section.sectionId, section.content)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {editingSectionId === section.sectionId ? (
                <div className="space-y-3">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={6}
                    className="w-full border-2 border-blue-300 focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-3 last:mb-0 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Formatting Highlights */}
                  {section.formatting && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {section.formatting.medicalTerms?.slice(0, 3).map((term, termIndex) => (
                        <Badge key={termIndex} className="bg-blue-100 text-blue-700 text-xs">
                          {term}
                        </Badge>
                      ))}
                      {section.formatting.icd10Codes?.slice(0, 2).map((code, codeIndex) => (
                        <Badge key={codeIndex} className="bg-purple-100 text-purple-700 text-xs">
                          {code.code}: {code.description}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Actions */}
        {analysis.suggestedActions.length > 0 && (
          <div className="p-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Suggested Actions
            </h2>
            <ul className="space-y-2">
              {analysis.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: documentStyle.accentColor }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Document Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-600">
            <p>Generated by AI Medical Scribe on {new Date().toLocaleString()}</p>
            <p className="mt-1">This document was generated using artificial intelligence and should be reviewed by a qualified healthcare professional.</p>
          </div>
        </div>
      </Card>

      {/* Style Controls */}
      {showStyleControls && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg">Document Styling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Header Color</label>
                <input
                  type="color"
                  value={documentStyle.headerColor}
                  onChange={(e) => setDocumentStyle({ ...documentStyle, headerColor: e.target.value })}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <input
                  type="color"
                  value={documentStyle.accentColor}
                  onChange={(e) => setDocumentStyle({ ...documentStyle, accentColor: e.target.value })}
                  className="w-full h-10 rounded border"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={documentStyle.showWatermark}
                  onChange={(e) => setDocumentStyle({ ...documentStyle, showWatermark: e.target.checked })}
                />
                <span className="text-sm">Show draft watermark</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={documentStyle.showConfidenceScores}
                  onChange={(e) => setDocumentStyle({ ...documentStyle, showConfidenceScores: e.target.checked })}
                />
                <span className="text-sm">Show confidence scores</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}