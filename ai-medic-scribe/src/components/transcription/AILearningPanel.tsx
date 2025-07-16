"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Lightbulb, AlertTriangle, Stethoscope, BookOpen, 
  TrendingUp, Clock, Star, ExternalLink, ChevronDown, ChevronUp,
  Shield, DollarSign, MapPin, Pill, Activity
} from 'lucide-react';
import { 
  AILearningResponse
} from '@/utils/aiLearningAssistant';
import { Patient } from '@/types';

interface AILearningPanelProps {
  aiResponse: AILearningResponse | null;
  isLoading: boolean;
  patient: Patient;
}

export function AILearningPanel({ aiResponse, isLoading }: AILearningPanelProps) {
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState('recommendations');

  const toggleRecommendation = (id: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecommendations(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return 'bg-red-500';
      case 'major': return 'bg-red-400';
      case 'moderate': return 'bg-yellow-400';
      case 'minor': return 'bg-yellow-300';
      default: return 'bg-gray-400';
    }
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low-risk': return 'text-green-600 bg-green-50';
      case 'moderate-risk': return 'text-yellow-600 bg-yellow-50';
      case 'high-risk': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 animate-pulse" />
            AI Learning Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiResponse) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Learning Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Start transcribing to receive AI-powered recommendations and insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Learning Assistant
          </div>
          <Badge variant="outline" className="text-xs">
            {aiResponse.treatmentRecommendations.length + aiResponse.learningInsights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recommendations" className="text-xs">
              <Pill className="w-3 h-3 mr-1" />
              Treatment
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="interactions" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs">
              <Stethoscope className="w-3 h-3 mr-1" />
              Diagnostics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-3">
            {aiResponse.treatmentRecommendations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Pill className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No treatment recommendations available yet</p>
              </div>
            ) : (
              aiResponse.treatmentRecommendations.map((rec) => (
                <Card key={rec.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{rec.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRiskColor(rec.safetyProfile)}`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {rec.safetyProfile}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-xs text-white ${getEvidenceColor(rec.evidenceLevel)}`}
                          >
                            Evidence: {rec.evidenceLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(rec.confidenceScore * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecommendation(rec.id)}
                      >
                        {expandedRecommendations.has(rec.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    
                    {expandedRecommendations.has(rec.id) && (
                      <div className="space-y-3 border-t pt-3">
                        <div>
                          <h4 className="font-medium text-xs text-gray-700 mb-1">Rationale</h4>
                          <p className="text-xs text-gray-600">{rec.rationale}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <h4 className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              Cost Information
                            </h4>
                            <div className="text-xs space-y-1">
                              <p>Medical Aid: {rec.costConsideration.medicaidCovered ? 'Covered' : 'Not covered'}</p>
                              <p>Estimated: {rec.costConsideration.estimatedCost}</p>
                              <p>Cost-effectiveness: {rec.costConsideration.costEffectiveness}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              South African Context
                            </h4>
                            <div className="text-xs space-y-1">
                              <p>EDL Listed: {rec.southAfricanGuidelines.edlListed ? 'Yes' : 'No'}</p>
                              <p>Availability: {rec.southAfricanGuidelines.localAvailability}</p>
                              <p className="text-blue-600">{rec.southAfricanGuidelines.nhsGuideline}</p>
                            </div>
                          </div>
                        </div>

                        {rec.contraindications.length > 0 && (
                          <div>
                            <h4 className="font-medium text-xs text-red-700 mb-1">Contraindications</h4>
                            <ul className="text-xs text-red-600 space-y-1">
                              {rec.contraindications.map((contra, index) => (
                                <li key={index}>• {contra}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {rec.alternatives.length > 0 && (
                          <div>
                            <h4 className="font-medium text-xs text-gray-700 mb-1">Alternatives</h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.alternatives.map((alt, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            {aiResponse.learningInsights.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No learning insights available yet</p>
              </div>
            ) : (
              aiResponse.learningInsights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {insight.readingTime}min read
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.difficulty}
                          </Badge>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(insight.relevanceScore * 5)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-2">{insight.content}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Source: {insight.source}</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="interactions" className="space-y-3">
            {aiResponse.drugInteractions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No drug interactions detected</p>
              </div>
            ) : (
              aiResponse.drugInteractions.map((interaction, index) => (
                <Card key={index} className={`border-l-4 ${getSeverityColor(interaction.severity)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {interaction.drug1} + {interaction.drug2}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs text-white ${getSeverityColor(interaction.severity)}`}
                      >
                        {interaction.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div>
                      <h4 className="font-medium text-xs text-gray-700">Mechanism</h4>
                      <p className="text-xs text-gray-600">{interaction.mechanism}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-gray-700">Clinical Consequence</h4>
                      <p className="text-xs text-gray-600">{interaction.clinicalConsequence}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-gray-700">Management</h4>
                      <p className="text-xs text-gray-600">{interaction.management}</p>
                    </div>
                    {interaction.references.length > 0 && (
                      <div>
                        <h4 className="font-medium text-xs text-gray-700">References</h4>
                        <div className="flex flex-wrap gap-1">
                          {interaction.references.map((ref, refIndex) => (
                            <Badge key={refIndex} variant="outline" className="text-xs">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-3">
            {aiResponse.diagnosticSuggestions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No diagnostic suggestions available yet</p>
              </div>
            ) : (
              aiResponse.diagnosticSuggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">{suggestion.condition}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.probability * 100)}% probability
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <h4 className="font-medium text-xs text-gray-700 mb-1">Key Symptoms</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.keySymptoms.map((symptom, symIndex) => (
                          <Badge key={symIndex} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-xs text-gray-700 mb-1">Recommended Tests</h4>
                      <div className="space-y-2">
                        {suggestion.recommendedTests.map((test, testIndex) => (
                          <div key={testIndex} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{test.test}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  test.urgency === 'immediate' ? 'text-red-600 border-red-200' :
                                  test.urgency === 'within-24h' ? 'text-orange-600 border-orange-200' :
                                  test.urgency === 'within-week' ? 'text-yellow-600 border-yellow-200' :
                                  'text-gray-600 border-gray-200'
                                }`}
                              >
                                {test.urgency}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{test.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {suggestion.redFlags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-xs text-red-700 mb-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Red Flags
                        </h4>
                        <ul className="text-xs text-red-600 space-y-1">
                          {suggestion.redFlags.map((flag, flagIndex) => (
                            <li key={flagIndex}>• {flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-xs text-gray-700 mb-1">Differential Diagnoses</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.differentialDiagnoses.map((diff, diffIndex) => (
                          <Badge key={diffIndex} variant="outline" className="text-xs">
                            {diff}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Continuous Learning Section */}
        {aiResponse.continuousLearning && (
          <Card className="mt-4 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Continuous Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {aiResponse.continuousLearning.suggestedReading.length > 0 && (
                <div>
                  <h4 className="font-medium text-xs text-gray-700 mb-2 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Suggested Reading
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {aiResponse.continuousLearning.suggestedReading.map((reading, index) => (
                      <li key={index} className="flex items-center">
                        <ExternalLink className="w-3 h-3 mr-2 text-blue-500" />
                        {reading}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResponse.continuousLearning.improvementAreas.length > 0 && (
                <div>
                  <h4 className="font-medium text-xs text-gray-700 mb-2 flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    Areas for Improvement
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {aiResponse.continuousLearning.improvementAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-orange-600 border-orange-200">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}