'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Languages, ArrowRightLeft, Volume2, CheckCircle, AlertTriangle } from 'lucide-react'
import { 
  translateText, 
  detectLanguage, 
  SOUTH_AFRICAN_LANGUAGES, 
  TranslationResult,
  createRealTimeTranslator
} from '@/utils/multiLanguageTranslation'

interface TranslationPanelProps {
  originalText: string
  onTranslationUpdate?: (translatedText: string) => void
  autoTranslate?: boolean
  showConfidence?: boolean
}

export function TranslationPanel({ 
  originalText, 
  onTranslationUpdate, 
  autoTranslate = true,
  showConfidence = true 
}: TranslationPanelProps) {
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showOriginal, setShowOriginal] = useState(true)
  const [realTimeTranslator, setRealTimeTranslator] = useState<ReturnType<typeof createRealTimeTranslator> | null>(null)

  // Initialize real-time translator
  useEffect(() => {
    const translator = createRealTimeTranslator(targetLanguage, {
      preserveMedicalTerms: true,
      includeConfidence: true,
      contextualTranslation: true,
      culturalAdaptation: true
    }, 1000)
    
    setRealTimeTranslator(translator)
    
    return () => {
      translator.cleanup()
    }
  }, [targetLanguage])

  // Auto-translate when text changes
  useEffect(() => {
    if (autoTranslate && originalText.trim() && realTimeTranslator) {
      realTimeTranslator.translate(originalText, (result) => {
        setTranslationResult(result)
        if (onTranslationUpdate && result.detectedLanguage !== targetLanguage) {
          onTranslationUpdate(result.translatedText)
        }
      })
    }
  }, [originalText, autoTranslate, realTimeTranslator, targetLanguage, onTranslationUpdate])

  const handleManualTranslation = async () => {
    if (!originalText.trim()) return
    
    setIsTranslating(true)
    try {
      const result = await translateText(originalText, targetLanguage, {
        preserveMedicalTerms: true,
        includeConfidence: true,
        contextualTranslation: true,
        culturalAdaptation: true
      })
      
      setTranslationResult(result)
      onTranslationUpdate?.(result.translatedText)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const getLanguageName = (code: string) => {
    const language = SOUTH_AFRICAN_LANGUAGES.find(lang => lang.code === code)
    return language?.name || code.toUpperCase()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200'
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="w-3 h-3" />
    if (confidence >= 0.7) return <AlertTriangle className="w-3 h-3" />
    return <AlertTriangle className="w-3 h-3" />
  }

  // Don't show panel if no text or if detected language is same as target
  if (!originalText.trim() || (translationResult && translationResult.detectedLanguage === targetLanguage)) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-blue-600" />
            <span>Translation Assistant</span>
            {translationResult && (
              <Badge variant="outline" className="text-xs">
                {getLanguageName(translationResult.detectedLanguage)} → {getLanguageName(targetLanguage)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            >
              {SOUTH_AFRICAN_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            
            {!autoTranslate && (
              <Button
                size="sm"
                onClick={handleManualTranslation}
                disabled={isTranslating || !originalText.trim()}
              >
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Translating...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Translate
                  </>
                )}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {translationResult && (
          <>
            {/* Translation Confidence and Stats */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">Detected:</span> {getLanguageName(translationResult.detectedLanguage)}
                </div>
                
                {showConfidence && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(translationResult.confidence)}`}>
                    {getConfidenceIcon(translationResult.confidence)}
                    <span>
                      {Math.round(translationResult.confidence * 100)}% confidence
                    </span>
                  </div>
                )}
                
                {translationResult.medicalTermsFound.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {translationResult.medicalTermsFound.length} medical terms
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                {showOriginal ? 'Show Translation' : 'Show Original'}
              </Button>
            </div>

            {/* Translation Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Text */}
              <div className={`space-y-2 ${!showOriginal ? 'hidden lg:block' : ''}`}>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm text-gray-700">
                    Original ({getLanguageName(translationResult.detectedLanguage)})
                  </h4>
                  <Button variant="ghost" size="sm" title="Listen to original">
                    <Volume2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm border">
                  {translationResult.originalText}
                </div>
              </div>

              {/* Translated Text */}
              <div className={`space-y-2 ${showOriginal ? 'hidden lg:block' : ''}`}>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm text-gray-700">
                    Translation ({getLanguageName(targetLanguage)})
                  </h4>
                  <Button variant="ghost" size="sm" title="Listen to translation">
                    <Volume2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                  {translationResult.translatedText}
                </div>
              </div>
            </div>

            {/* Medical Terms Found */}
            {translationResult.medicalTermsFound.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-sm text-green-800 mb-2">
                  Medical Terms Identified
                </h4>
                <div className="flex flex-wrap gap-2">
                  {translationResult.medicalTermsFound.map((term, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Translation Notes */}
            {translationResult.translationNotes && translationResult.translationNotes.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2">
                  Translation Notes
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  {translationResult.translationNotes.map((note, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(translationResult.translatedText)
                  }}
                >
                  Copy Translation
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onTranslationUpdate?.(translationResult.translatedText)
                  }}
                >
                  Use Translation
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Help Text */}
        {!translationResult && originalText.trim() && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-2">
              Start typing in Xhosa, Afrikaans, or any South African language
            </div>
            <div className="text-xs text-gray-400">
              Medical terms will be automatically identified and translated with high accuracy
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TranslationPanel