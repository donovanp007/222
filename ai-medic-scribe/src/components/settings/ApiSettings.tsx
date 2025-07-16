"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Save, Eye, EyeOff, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UsageMonitor } from "./UsageMonitor";

const API_KEY_STORAGE_KEY = "ai-medic-scribe-openai-key";
const MODEL_STORAGE_KEY = "ai-medic-scribe-ai-model";

type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';

const MODEL_OPTIONS: { value: AIModel; label: string; cost: string; description: string }[] = [
  {
    value: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    cost: 'R0.037/1K tokens',
    description: 'Fast, cost-effective (Recommended for SA)'
  },
  {
    value: 'gpt-4',
    label: 'GPT-4',
    cost: 'R0.555/1K tokens',
    description: 'Most accurate but expensive'
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    cost: 'R0.185/1K tokens',
    description: 'Balanced accuracy and cost'
  }
];

export function ApiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-3.5-turbo');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load API key from localStorage on mount
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      setIsSaved(true);
    }
    
    // Load model preference
    const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) as AIModel;
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert("Please enter a valid API key");
      return;
    }

    setIsValidating(true);

    try {
      // Test the API key with a simple request
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      if (testResponse.ok) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
        localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
        setIsSaved(true);
        alert("API settings saved and validated successfully!");
      } else {
        throw new Error("Invalid API key");
      }
    } catch (error) {
      console.error("API key validation failed:", error);
      alert("Invalid API key. Please check and try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to remove the stored API settings?")) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(MODEL_STORAGE_KEY);
      setApiKey("");
      setSelectedModel('gpt-3.5-turbo');
      setIsSaved(false);
    }
  };


  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          OpenAI API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
            OpenAI API Key
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsSaved(false);
                }}
                className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
              >
                {showApiKey ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || isValidating}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validating...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {isSaved ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                API Key Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600">
                Not Configured
              </Badge>
            )}
          </div>
          {isSaved && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs mb-3"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>
          
          {showAdvanced && (
            <div className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Model Selection
                </Label>
                <div className="space-y-2">
                  {MODEL_OPTIONS.map((model) => (
                    <label key={model.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="aiModel"
                        value={model.value}
                        checked={selectedModel === model.value}
                        onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{model.label}</span>
                          <Badge variant="outline" className="text-xs">{model.cost}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  💡 <strong>For SA users:</strong> GPT-3.5 Turbo is recommended for cost-effectiveness
                </div>
              </div>
              
              {/* Usage Monitoring */}
              <UsageMonitor />
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your API key is stored locally in your browser and never sent to our servers</p>
          <p>• You can get your API key from the OpenAI platform dashboard</p>
          <p>• The key is required for transcription functionality</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to get the stored API key
export const getStoredApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

// Utility function to get the selected AI model
export const getSelectedAIModel = (): AIModel => {
  if (typeof window === 'undefined') return 'gpt-3.5-turbo';
  const stored = localStorage.getItem(MODEL_STORAGE_KEY) as AIModel;
  return stored || 'gpt-3.5-turbo';
};

// Export the model type for other components
export type { AIModel };