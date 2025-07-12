"use client";

import { useState, useEffect } from "react";
import { Globe, Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface SouthAfricanLanguage {
  code: string;
  name: string;
  englishName: string;
  speakers: string;
  medical: boolean;
}

export const SA_LANGUAGES: SouthAfricanLanguage[] = [
  {
    code: 'auto',
    name: 'Auto-Detect',
    englishName: 'Automatic Detection',
    speakers: 'All languages',
    medical: true
  },
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    speakers: '4.8 million',
    medical: true
  },
  {
    code: 'af',
    name: 'Afrikaans',
    englishName: 'Afrikaans',
    speakers: '7.2 million',
    medical: true
  },
  {
    code: 'zu',
    name: 'isiZulu',
    englishName: 'Zulu',
    speakers: '12.2 million',
    medical: false
  },
  {
    code: 'xh',
    name: 'isiXhosa',
    englishName: 'Xhosa',
    speakers: '8.2 million',
    medical: false
  },
  {
    code: 'st',
    name: 'Sesotho',
    englishName: 'Southern Sotho',
    speakers: '3.8 million',
    medical: false
  },
  {
    code: 'nso',
    name: 'Sepedi',
    englishName: 'Northern Sotho',
    speakers: '4.6 million',
    medical: false
  },
  {
    code: 'tn',
    name: 'Setswana',
    englishName: 'Tswana',
    speakers: '4.1 million',
    medical: false
  },
  {
    code: 'ss',
    name: 'siSwati',
    englishName: 'Swazi',
    speakers: '1.3 million',
    medical: false
  },
  {
    code: 've',
    name: 'Tshivenda',
    englishName: 'Venda',
    speakers: '1.2 million',
    medical: false
  },
  {
    code: 'ts',
    name: 'Xitsonga',
    englishName: 'Tsonga',
    speakers: '2.3 million',
    medical: false
  },
  {
    code: 'nr',
    name: 'isiNdebele',
    englishName: 'South Ndebele',
    speakers: '1.1 million',
    medical: false
  }
];

const LANGUAGE_STORAGE_KEY = 'ai-medic-scribe-language';
const TRANSLATE_STORAGE_KEY = 'ai-medic-scribe-auto-translate';

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  useEffect(() => {
    // Load language preference
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      setSelectedLanguage(storedLanguage);
    }
    
    // Load auto-translate preference
    const storedTranslate = localStorage.getItem(TRANSLATE_STORAGE_KEY);
    if (storedTranslate) {
      setAutoTranslate(JSON.parse(storedTranslate));
    }
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  };

  const handleTranslateChange = (enabled: boolean) => {
    setAutoTranslate(enabled);
    localStorage.setItem(TRANSLATE_STORAGE_KEY, JSON.stringify(enabled));
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-600" />
          South African Language Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Primary Transcription Language
          </Label>
          
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {SA_LANGUAGES.map((language) => (
              <label 
                key={language.code} 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedLanguage === language.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="language"
                    value={language.code}
                    checked={selectedLanguage === language.code}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{language.name}</span>
                      {language.medical && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Medical Ready
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {language.englishName} • {language.speakers} speakers
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-Translation */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Auto-translate to English
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically translate non-English transcriptions for medical documentation
              </p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => handleTranslateChange(e.target.checked)}
                className="text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Language Support Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-green-700 text-sm font-medium mb-2">
            🇿🇦 Built for South African Healthcare
          </div>
          <div className="text-xs text-green-600 space-y-1">
            <p>• Supports all 11 official SA languages</p>
            <p>• Medical terminology optimized for English/Afrikaans</p>
            <p>• Ubuntu-centered patient communication</p>
            <p>• Culturally aware medical documentation</p>
          </div>
        </div>

        {/* Limitations Notice */}
        {selectedLanguage !== 'auto' && selectedLanguage !== 'en' && selectedLanguage !== 'af' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-amber-700 text-sm font-medium mb-2">
              ⚠️ Limited Medical Support
            </div>
            <div className="text-xs text-amber-600">
              Medical transcription accuracy may be lower for {SA_LANGUAGES.find(l => l.code === selectedLanguage)?.name}. 
              Auto-translation to English is recommended for clinical documentation.
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// Utility functions for other components
export const getSelectedLanguage = (): string => {
  if (typeof window === 'undefined') return 'auto';
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'auto';
};

export const getAutoTranslateEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(TRANSLATE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : true;
};