"use client";

import { useState, useEffect } from "react";
import { Brain, Sliders, AlertTriangle, CheckCircle, Target, Zap, Shield, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface AIBehaviorConfig {
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  autoTaggingIntensity: 'low' | 'medium' | 'high';
  blankFieldHandling: 'leave_blank' | 'mark_not_discussed' | 'auto_na';
  confidenceThreshold: number; // 0-1
  sectionSpecificSettings: {
    [sectionType: string]: {
      fillBehavior: 'explicit_only' | 'reasonable_inference' | 'medical_knowledge';
      confidenceRequired: number;
    };
  };
  medicalTermExpansion: boolean;
  icd10AutoSuggestion: boolean;
  dosageValidation: boolean;
  criticalFlagging: boolean;
}

const DEFAULT_AI_CONFIG: AIBehaviorConfig = {
  aggressiveness: 'balanced',
  autoTaggingIntensity: 'medium',
  blankFieldHandling: 'mark_not_discussed',
  confidenceThreshold: 0.7,
  sectionSpecificSettings: {
    symptoms: { fillBehavior: 'reasonable_inference', confidenceRequired: 0.6 },
    diagnosis: { fillBehavior: 'explicit_only', confidenceRequired: 0.8 },
    treatment: { fillBehavior: 'explicit_only', confidenceRequired: 0.8 },
    vitals: { fillBehavior: 'explicit_only', confidenceRequired: 0.9 },
    history: { fillBehavior: 'reasonable_inference', confidenceRequired: 0.7 },
    examination: { fillBehavior: 'reasonable_inference', confidenceRequired: 0.7 },
    plan: { fillBehavior: 'explicit_only', confidenceRequired: 0.8 },
    notes: { fillBehavior: 'medical_knowledge', confidenceRequired: 0.5 }
  },
  medicalTermExpansion: true,
  icd10AutoSuggestion: true,
  dosageValidation: true,
  criticalFlagging: true
};

interface AIBehaviorSettingsProps {
  currentConfig?: AIBehaviorConfig;
  onConfigChange?: (config: AIBehaviorConfig) => void;
  className?: string;
}

export function AIBehaviorSettings({ currentConfig, onConfigChange, className }: AIBehaviorSettingsProps) {
  const [config, setConfig] = useState<AIBehaviorConfig>(currentConfig || DEFAULT_AI_CONFIG);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-behavior-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
      }
    }
  }, []);

  const saveConfig = (newConfig: AIBehaviorConfig) => {
    setConfig(newConfig);
    localStorage.setItem('ai-behavior-config', JSON.stringify(newConfig));
    onConfigChange?.(newConfig);
  };

  const updateAggressiveness = (level: AIBehaviorConfig['aggressiveness']) => {
    const newConfig = { ...config, aggressiveness: level };
    
    // Auto-adjust other settings based on aggressiveness level
    if (level === 'conservative') {
      newConfig.autoTaggingIntensity = 'low';
      newConfig.blankFieldHandling = 'leave_blank';
      newConfig.confidenceThreshold = 0.8;
      Object.keys(newConfig.sectionSpecificSettings).forEach(section => {
        newConfig.sectionSpecificSettings[section].fillBehavior = 'explicit_only';
        newConfig.sectionSpecificSettings[section].confidenceRequired = 0.8;
      });
    } else if (level === 'aggressive') {
      newConfig.autoTaggingIntensity = 'high';
      newConfig.blankFieldHandling = 'auto_na';
      newConfig.confidenceThreshold = 0.5;
      Object.keys(newConfig.sectionSpecificSettings).forEach(section => {
        if (section !== 'diagnosis' && section !== 'treatment') {
          newConfig.sectionSpecificSettings[section].fillBehavior = 'medical_knowledge';
          newConfig.sectionSpecificSettings[section].confidenceRequired = 0.5;
        }
      });
    } else {
      // Balanced - keep default settings
      newConfig.autoTaggingIntensity = 'medium';
      newConfig.blankFieldHandling = 'mark_not_discussed';
      newConfig.confidenceThreshold = 0.7;
    }
    
    saveConfig(newConfig);
  };

  const getAggressivenessColor = (level: string) => {
    switch (level) {
      case 'conservative': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'balanced': return 'bg-green-100 text-green-700 border-green-300';
      case 'aggressive': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getAggressivenessIcon = (level: string) => {
    switch (level) {
      case 'conservative': return <Shield className="w-5 h-5" />;
      case 'balanced': return <Target className="w-5 h-5" />;
      case 'aggressive': return <Zap className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 ${className}`}
        >
          <Brain className="w-4 h-4" />
          AI Behavior
          <Badge className={`ml-2 ${getAggressivenessColor(config.aggressiveness)}`}>
            {config.aggressiveness}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -mx-6 -mt-6 mb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            AI Behavior Settings
            <Badge className="bg-white/20 text-white">Goldilocks Mode</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2">
          {/* Main Aggressiveness Control */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Sliders className="w-5 h-5 text-blue-600" />
                AI Aggressiveness Level
              </CardTitle>
              <p className="text-sm text-gray-600">
                Control how aggressive the AI is in filling template sections and making inferences
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    level: 'conservative' as const,
                    title: '🛡️ Conservative',
                    description: 'Only include explicitly mentioned information',
                    details: 'Perfect for legal documentation where accuracy is paramount'
                  },
                  {
                    level: 'balanced' as const,
                    title: '🎯 Balanced',
                    description: 'Reasonable medical inference with high confidence',
                    details: 'Ideal for most clinical documentation scenarios'
                  },
                  {
                    level: 'aggressive' as const,
                    title: '⚡ Aggressive',
                    description: 'Fill gaps with medical knowledge and context',
                    details: 'Best for experienced practitioners who want comprehensive notes'
                  }
                ].map((option) => (
                  <Card
                    key={option.level}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      config.aggressiveness === option.level
                        ? 'ring-2 ring-blue-500 bg-blue-50 scale-105'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => updateAggressiveness(option.level)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAggressivenessColor(option.level)}`}>
                          {getAggressivenessIcon(option.level)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{option.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{option.details}</p>
                        </div>
                        {config.aggressiveness === option.level && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auto-Tagging Control */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="w-5 h-5 text-green-600" />
                Auto-Tagging Intensity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {['low', 'medium', 'high'].map((intensity) => (
                  <Button
                    key={intensity}
                    variant={config.autoTaggingIntensity === intensity ? "default" : "outline"}
                    size="sm"
                    onClick={() => saveConfig({ ...config, autoTaggingIntensity: intensity as any })}
                    className="capitalize"
                  >
                    {intensity}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Controls how aggressively the AI tags medical terms, medications, and conditions
              </p>
            </CardContent>
          </Card>

          {/* Blank Field Handling */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Blank Field Handling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'leave_blank', label: 'Leave Blank', description: 'Keep fields empty if not mentioned' },
                  { value: 'mark_not_discussed', label: 'Mark "Not Discussed"', description: 'Add placeholder text for empty fields' },
                  { value: 'auto_na', label: 'Auto N/A', description: 'Automatically fill with "N/A"' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={config.blankFieldHandling === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => saveConfig({ ...config, blankFieldHandling: option.value as any })}
                    className="h-auto p-3 text-left flex flex-col items-start"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-600 mt-1">{option.description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Features */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-600" />
                Advanced AI Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'medicalTermExpansion', label: 'Medical Term Expansion', description: 'Expand abbreviations and medical terms' },
                  { key: 'icd10AutoSuggestion', label: 'ICD-10 Auto-Suggestion', description: 'Automatically suggest relevant diagnostic codes' },
                  { key: 'dosageValidation', label: 'Dosage Validation', description: 'Validate medication dosages and flag concerns' },
                  { key: 'criticalFlagging', label: 'Critical Information Flagging', description: 'Highlight urgent or critical findings' }
                ].map((feature) => (
                  <div key={feature.key} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <input
                      type="checkbox"
                      checked={config[feature.key as keyof AIBehaviorConfig] as boolean}
                      onChange={(e) => saveConfig({ ...config, [feature.key]: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <label className="font-medium text-sm">{feature.label}</label>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Confidence Threshold */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Confidence Threshold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Minimum Confidence:</span>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.1"
                    value={config.confidenceThreshold}
                    onChange={(e) => saveConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <Badge className="bg-blue-100 text-blue-700">
                    {Math.round(config.confidenceThreshold * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  AI will only auto-fill content when confidence exceeds this threshold
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => saveConfig(DEFAULT_AI_CONFIG)}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export functions for other components to use
export function getStoredAIConfig(): AIBehaviorConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  
  try {
    const saved = localStorage.getItem('ai-behavior-config');
    return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAIConfig(config: AIBehaviorConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ai-behavior-config', JSON.stringify(config));
}

export { DEFAULT_AI_CONFIG };