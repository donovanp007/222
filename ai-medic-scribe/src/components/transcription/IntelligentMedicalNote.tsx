"use client";

import { useState } from "react";
import { Brain, Stethoscope, FileText, Zap, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { IntelligentAnalysis } from "@/utils/intelligentFormatting";

interface IntelligentMedicalNoteProps {
  analysis: IntelligentAnalysis | null;
  isGenerating: boolean;
  onSectionEdit: (sectionId: string, newContent: string) => void;
  onRegenerate: () => void;
  manualNotes?: string;
  onManualNotesChange?: (notes: string) => void;
}

export function IntelligentMedicalNote({ 
  analysis, 
  isGenerating, 
  onSectionEdit, 
  onRegenerate,
  manualNotes = "",
  onManualNotesChange
}: IntelligentMedicalNoteProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Ensure we have safe defaults
  const safeAnalysis = analysis ? {
    ...analysis,
    formattedSections: analysis.formattedSections || [],
    suggestedActions: analysis.suggestedActions || [],
    clinicalSummary: analysis.clinicalSummary || '',
    urgencyLevel: analysis.urgencyLevel || 'low',
    completeness: analysis.completeness || 0
  } : null;

  if (isGenerating) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Intelligent Processing Animation */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-4 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800 mb-2">
                AI Medical Analysis in Progress
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>🧠 Analyzing clinical content...</p>
                <p>📋 Structuring medical sections...</p>
                <p>🏥 Adding ICD-10 codes...</p>
                <p>✨ Creating professional formatting...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!safeAnalysis) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Medical Analysis Ready</h3>
          <p className="text-gray-500 mb-6">
            Record audio to generate an intelligent, beautifully formatted medical note
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Use safeAnalysis for all references
  const sections = safeAnalysis?.formattedSections || [];
  const actions = safeAnalysis?.suggestedActions || [];
  const summary = safeAnalysis?.clinicalSummary || '';
  const urgency = safeAnalysis?.urgencyLevel || 'low';
  const completeness = safeAnalysis?.completeness || 0;

  return (
    <div className="space-y-6">
      {/* Intelligence Dashboard */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Stethoscope className="w-5 h-5" />
            Clinical Intelligence Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Urgency Level */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium text-gray-600">Urgency</span>
              </div>
              <Badge className={`${getUrgencyColor(urgency)} capitalize`}>
                {urgency}
              </Badge>
            </div>

            {/* Completeness Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium text-gray-600">Complete</span>
              </div>
              <div className={`text-lg font-bold ${getCompletenessColor(completeness)}`}>
                {Math.round(completeness * 100)}%
              </div>
            </div>

            {/* Sections Filled */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium text-gray-600">Sections</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {sections.length}
              </div>
            </div>

            {/* AI Enhancement */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium text-gray-600">Enhanced</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                AI Powered
              </Badge>
            </div>
          </div>

          {/* Clinical Summary */}
          {summary && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Clinical Summary</span>
              </div>
              <p className="text-sm text-gray-700">{summary}</p>
            </div>
          )}

          {/* Suggested Actions */}
          {actions.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Suggested Actions</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formatted Medical Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.sectionId} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {section.sectionTitle}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${section.confidence > 0.8 ? 'border-green-300 text-green-700' : 'border-yellow-300 text-yellow-700'}`}
                  >
                    {Math.round(section.confidence * 100)}% confident
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSectionId(editingSectionId === section.sectionId ? null : section.sectionId)}
                    className="h-8 w-8 p-0"
                  >
                    ✏️
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSectionId === section.sectionId ? (
                <div className="space-y-3">
                  <Textarea
                    value={section.content}
                    onChange={(e) => onSectionEdit(section.sectionId, e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => setEditingSectionId(null)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main Content */}
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: section.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-blue-700">$1</em>')
                        .replace(/\n/g, '<br>')
                        .replace(/•/g, '<span class="text-blue-500">•</span>')
                    }}
                  />

                  {/* Enhanced Information */}
                  {((section.formatting?.icd10Codes?.length || 0) > 0 || 
                    (section.formatting?.medicalTerms?.length || 0) > 0 || 
                    (section.formatting?.vitals?.length || 0) > 0 ||
                    (section.formatting?.dosages?.length || 0) > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      
                      {/* ICD-10 Codes */}
                      {(section.formatting?.icd10Codes?.length || 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-600">📋 ICD-10 Codes:</span>
                          </div>
                          <div className="space-y-1">
                            {section.formatting?.icd10Codes?.map((code, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {code.code}: {code.description}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medical Terms */}
                      {(section.formatting?.medicalTerms?.length || 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-green-600">🏥 Medical Terms:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {section.formatting?.medicalTerms?.map((term, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vitals */}
                      {(section.formatting?.vitals?.length || 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-purple-600">📊 Vital Signs:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {section.formatting?.vitals?.map((vital, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {vital}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dosages */}
                      {(section.formatting?.dosages?.length || 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-orange-600">💊 Dosages:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {section.formatting?.dosages?.map((dosage, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {dosage}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Notes Section */}
      {onManualNotesChange && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-900">
              <FileText className="w-4 h-4 text-purple-600" />
              Manual Notes & Additional Observations
              <Badge variant="outline" className="text-xs bg-purple-100 border-purple-300 text-purple-800">
                manual
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any additional notes, observations, or free-form text that complements the AI analysis above..."
              value={manualNotes}
              onChange={(e) => onManualNotesChange(e.target.value)}
              className="min-h-[100px] border-purple-200 focus:border-purple-500 focus:ring-purple-500 font-medium leading-relaxed bg-white/70"
            />
            <div className="text-xs text-purple-600 mt-2 flex items-center gap-2">
              <span>💡 This section combines with the AI analysis for complete documentation</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onRegenerate}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Regenerate AI Analysis
        </Button>
      </div>
    </div>
  );
}