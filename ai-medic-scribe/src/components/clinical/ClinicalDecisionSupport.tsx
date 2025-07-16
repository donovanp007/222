"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, AlertTriangle, Stethoscope, FlaskConical, 
  TrendingUp, Clock, Star, Shield, Target, 
  ChevronRight, Info, CheckCircle, XCircle,
  Activity, Zap, BookOpen, User
} from 'lucide-react';
import { Patient } from '@/types';
import { 
  ClinicalReasoningResult, 
  DifferentialDiagnosis, 
  TreatmentProtocol,
  performClinicalReasoning,
  generateTreatmentProtocol
} from '@/utils/differentialDiagnosis';

interface ClinicalDecisionSupportProps {
  patient: Patient;
  symptoms: string[];
  clinicalFindings: string[];
  presentingComplaint: string;
  onProtocolSelect?: (protocol: TreatmentProtocol) => void;
}

export function ClinicalDecisionSupport({ 
  patient, 
  symptoms, 
  clinicalFindings, 
  presentingComplaint,
  onProtocolSelect 
}: ClinicalDecisionSupportProps) {
  const [reasoningResult, setReasoningResult] = useState<ClinicalReasoningResult | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DifferentialDiagnosis | null>(null);
  const [treatmentProtocol, setTreatmentProtocol] = useState<TreatmentProtocol | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('differentials');

  useEffect(() => {
    if (symptoms.length > 0 || clinicalFindings.length > 0) {
      analyzeCase();
    }
  }, [symptoms, clinicalFindings, presentingComplaint]);

  const analyzeCase = async () => {
    setIsAnalyzing(true);
    try {
      const result = performClinicalReasoning(
        presentingComplaint,
        symptoms,
        patient,
        clinicalFindings,
        []
      );
      setReasoningResult(result);
      
      if (result.differentialDiagnoses.length > 0) {
        setSelectedDiagnosis(result.differentialDiagnoses[0]);
        const protocol = generateTreatmentProtocol(
          result.differentialDiagnoses[0].condition,
          'moderate'
        );
        setTreatmentProtocol(protocol);
      }
    } catch (error) {
      console.error('Clinical reasoning analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDiagnosisSelect = (diagnosis: DifferentialDiagnosis) => {
    setSelectedDiagnosis(diagnosis);
    const protocol = generateTreatmentProtocol(diagnosis.condition, 'moderate');
    setTreatmentProtocol(protocol);
    if (protocol && onProtocolSelect) {
      onProtocolSelect(protocol);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'very-high': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'very-low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'soon': return 'bg-yellow-500 text-black';
      case 'routine': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 animate-pulse text-purple-600" />
            Clinical Decision Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Clinical Data</h3>
                <p className="text-gray-500">Generating differential diagnoses and treatment recommendations...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reasoningResult || reasoningResult.differentialDiagnoses.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Clinical Decision Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Clinical Data</h3>
            <p className="text-gray-500">
              Add symptoms and clinical findings to generate differential diagnoses and treatment recommendations.
            </p>
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
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Clinical Decision Support
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getPriorityColor(reasoningResult.clinicalPriority)}`}>
              {reasoningResult.clinicalPriority.toUpperCase()} Priority
            </Badge>
            <Badge variant="outline" className="text-xs">
              {reasoningResult.differentialDiagnoses.length} diagnoses
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="differentials" className="text-xs">
              <Stethoscope className="w-3 h-3 mr-1" />
              Diagnoses
            </TabsTrigger>
            <TabsTrigger value="investigations" className="text-xs">
              <FlaskConical className="w-3 h-3 mr-1" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="treatment" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Treatment
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Reasoning
            </TabsTrigger>
          </TabsList>

          {/* Differential Diagnoses Tab */}
          <TabsContent value="differentials" className="space-y-4">
            <div className="space-y-3">
              {reasoningResult.differentialDiagnoses.map((diagnosis, index) => (
                <Card 
                  key={diagnosis.condition}
                  className={`cursor-pointer transition-all ${
                    selectedDiagnosis?.condition === diagnosis.condition
                      ? 'ring-2 ring-purple-500 border-purple-200'
                      : 'hover:border-purple-200'
                  }`}
                  onClick={() => handleDiagnosisSelect(diagnosis)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-gray-900">{diagnosis.condition}</h4>
                          <Badge variant="outline" className="text-xs">
                            {diagnosis.icd10Code}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`text-xs ${getLikelihoodColor(diagnosis.likelihood)}`}>
                            {Math.round(diagnosis.probability * 100)}% probability
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {diagnosis.likelihood} likelihood
                          </Badge>
                          {diagnosis.emergencyLevel !== 'routine' && (
                            <Badge className={`text-xs ${getUrgencyColor(diagnosis.emergencyLevel)}`}>
                              {diagnosis.emergencyLevel}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <h5 className="font-medium text-green-700 mb-1 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Supporting Features
                            </h5>
                            <ul className="text-gray-600 space-y-1">
                              {diagnosis.supportingFeatures.slice(0, 3).map((feature, idx) => (
                                <li key={idx}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-700 mb-1 flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              Opposing Features
                            </h5>
                            <ul className="text-gray-600 space-y-1">
                              {diagnosis.opposingFeatures.slice(0, 3).map((feature, idx) => (
                                <li key={idx}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {diagnosis.specialtyReferral && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-700 flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              Consider {diagnosis.specialtyReferral} referral
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Investigations Tab */}
          <TabsContent value="investigations" className="space-y-4">
            {selectedDiagnosis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Recommended Tests for {selectedDiagnosis.condition}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedDiagnosis.requiredInvestigations.length} tests
                  </Badge>
                </div>

                <div className="space-y-3">
                  {selectedDiagnosis.requiredInvestigations.map((test, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">{test.test}</h5>
                              <Badge className={`text-xs ${getUrgencyColor(test.urgency)}`}>
                                {test.urgency}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {test.type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{test.expectedResult}</p>
                            
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="font-medium text-gray-700">Cost: </span>
                                <span className="text-gray-600">{test.costCategory}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Available: </span>
                                <span className="text-gray-600">{test.availability}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">SA Access: </span>
                                <span className="text-gray-600">{test.saAvailability}</span>
                              </div>
                            </div>
                          </div>
                          <FlaskConical className="w-4 h-4 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedDiagnosis.keyQuestions.length > 0 && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Key Clinical Questions
                      </h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {selectedDiagnosis.keyQuestions.map((question, index) => (
                          <li key={index}>• {question}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment" className="space-y-4">
            {treatmentProtocol && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{treatmentProtocol.condition}</h4>
                    <p className="text-sm text-gray-500">
                      {treatmentProtocol.severity} severity • {treatmentProtocol.setting} setting
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onProtocolSelect?.(treatmentProtocol)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Apply Protocol
                  </Button>
                </div>

                <Tabs defaultValue="primary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="primary">Primary Treatment</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                    <TabsTrigger value="followup">Follow-up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="primary" className="space-y-3">
                    {treatmentProtocol.primaryTreatment.map((treatment, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">{treatment.intervention}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {treatment.type}
                                </Badge>
                                {treatment.edlListed && (
                                  <Badge className="text-xs bg-green-100 text-green-800">
                                    EDL Listed
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  Evidence {treatment.evidenceLevel}
                                </Badge>
                              </div>
                              
                              {treatment.dosage && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Dosage:</span> {treatment.dosage}
                                </p>
                              )}
                              
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">Duration:</span> {treatment.duration}
                              </p>
                              
                              <p className="text-sm text-gray-600 mb-2">{treatment.instructions}</p>
                              
                              {treatment.contraindications.length > 0 && (
                                <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs text-red-700 font-medium mb-1">Contraindications:</p>
                                  <p className="text-xs text-red-600">
                                    {treatment.contraindications.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Target className="w-4 h-4 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="monitoring" className="space-y-3">
                    {treatmentProtocol.monitoring.map((param, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{param.parameter}</h5>
                              <p className="text-sm text-gray-600">{param.method}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{param.frequency}</p>
                              <p className="text-xs text-gray-500">Target: {param.target}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="followup" className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Follow-up Schedule
                        </h5>
                        <p className="text-sm text-gray-600 mb-3">{treatmentProtocol.followUp.interval}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-1">Assessment Points</h6>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {treatmentProtocol.followUp.assessment.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h6 className="text-sm font-medium text-red-700 mb-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Red Flags
                            </h6>
                            <ul className="text-xs text-red-600 space-y-1">
                              {treatmentProtocol.followUp.redFlags.map((flag, idx) => (
                                <li key={idx}>• {flag}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {treatmentProtocol.patientEducation.length > 0 && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Patient Education
                          </h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {treatmentProtocol.patientEducation.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>

          {/* Clinical Reasoning Tab */}
          <TabsContent value="reasoning" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Reasoning Steps
                  </h5>
                  <ol className="text-sm text-gray-600 space-y-2">
                    {reasoningResult.reasoningSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {reasoningResult.uncertaintyFactors.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Uncertainty Factors
                    </h5>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {reasoningResult.uncertaintyFactors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Next Steps
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {reasoningResult.nextSteps.map((step, index) => (
                      <li key={index}>• {step}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}