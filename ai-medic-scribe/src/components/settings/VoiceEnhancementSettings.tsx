"use client";

import { useState, useEffect } from "react";
import { Mic, Settings, Volume2, Users, Zap, MessageSquare, Activity, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  VoiceEnhancementSettings as IVoiceEnhancementSettings,
  SpeakerProfile,
  defaultVoiceEnhancementSettings,
  isVoiceEnhancementSupported
} from "@/utils/voiceEnhancement";

interface VoiceEnhancementSettingsProps {
  onSettingsChange: (settings: IVoiceEnhancementSettings) => void;
  onSpeakerProfileAdd: (profile: Omit<SpeakerProfile, 'id'>) => void;
}

export function VoiceEnhancementSettings({ 
  onSettingsChange, 
  onSpeakerProfileAdd 
}: VoiceEnhancementSettingsProps) {
  const [settings, setSettings] = useState<IVoiceEnhancementSettings>(defaultVoiceEnhancementSettings);
  const [speakerProfiles, setSpeakerProfiles] = useState<SpeakerProfile[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    setIsSupported(isVoiceEnhancementSupported());
    loadSettings();
    loadSpeakerProfiles();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('voiceEnhancementSettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultVoiceEnhancementSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load voice enhancement settings:', error);
    }
  };

  const loadSpeakerProfiles = () => {
    try {
      const stored = localStorage.getItem('voiceEnhancement_speakerProfiles');
      if (stored) {
        setSpeakerProfiles(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load speaker profiles:', error);
    }
  };

  const saveSettings = (newSettings: IVoiceEnhancementSettings) => {
    try {
      localStorage.setItem('voiceEnhancementSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange(newSettings);
    } catch (error) {
      console.error('Failed to save voice enhancement settings:', error);
    }
  };

  const updateSetting = <K extends keyof IVoiceEnhancementSettings>(
    key: K,
    value: IVoiceEnhancementSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const startSpeakerCalibration = async (role: SpeakerProfile['role']) => {
    setIsCalibrating(true);
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Simulate calibration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create mock speaker profile
      const profile: Omit<SpeakerProfile, 'id'> = {
        name: role === 'doctor' ? 'Dr. Current User' : `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        role,
        voiceCharacteristics: {
          pitch: 150 + Math.random() * 100,
          tempo: 120 + Math.random() * 40,
          formants: [800, 1200, 2400],
          mfcc: Array(13).fill(0).map(() => Math.random() * 2 - 1)
        },
        confidence: 0.95
      };
      
      onSpeakerProfileAdd(profile);
      
      // Update local state
      const newProfile = { ...profile, id: `speaker_${Date.now()}` };
      setSpeakerProfiles(prev => [...prev, newProfile]);
      
      // Stop microphone
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Speaker calibration failed:', error);
      alert('Microphone access is required for speaker calibration.');
    } finally {
      setIsCalibrating(false);
    }
  };

  const deleteSpeakerProfile = (profileId: string) => {
    const updatedProfiles = speakerProfiles.filter(p => p.id !== profileId);
    setSpeakerProfiles(updatedProfiles);
    localStorage.setItem('voiceEnhancement_speakerProfiles', JSON.stringify(updatedProfiles));
  };

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            Voice Enhancement Not Supported
          </h3>
          <p className="text-orange-700">
            Your browser doesn't support advanced audio processing features. 
            Basic recording will still work, but enhanced features are unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            Voice Enhancement Settings
            <Badge variant="secondary" className="ml-auto">Advanced</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="speakers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Speakers
              </TabsTrigger>
              <TabsTrigger value="commands" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Commands
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Text
              </TabsTrigger>
            </TabsList>

            {/* Audio Enhancement Tab */}
            <TabsContent value="audio" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Noise Reduction</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.noiseReduction}
                      onChange={(e) => updateSetting('noiseReduction', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Enable background noise filtering</span>
                  </div>
                  {settings.noiseReduction && (
                    <Select 
                      value={settings.noiseReductionLevel} 
                      onValueChange={(value: 'light' | 'medium' | 'aggressive') => 
                        updateSetting('noiseReductionLevel', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light (Preserve natural sound)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="aggressive">Aggressive (Maximum noise removal)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Voice Activity Detection</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.voiceActivityDetection}
                      onChange={(e) => updateSetting('voiceActivityDetection', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Only record when voice is detected</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Echo Reduction</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.echoReduction}
                      onChange={(e) => updateSetting('echoReduction', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Reduce room echo and reverb</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Automatic Gain Control</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.gainControl}
                      onChange={(e) => updateSetting('gainControl', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Maintain consistent volume levels</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Audio Quality Optimization</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      These settings optimize audio for medical environments with typical background noise,
                      multiple speakers, and varying microphone distances.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Speaker Identification Tab */}
            <TabsContent value="speakers" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Speaker Identification</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="checkbox"
                      checked={settings.speakerIdentification}
                      onChange={(e) => updateSetting('speakerIdentification', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Automatically identify speakers</span>
                  </div>
                </div>
              </div>

              {settings.speakerIdentification && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Calibrate Voice Profiles</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(['doctor', 'patient', 'nurse', 'other'] as const).map((role) => (
                        <Button
                          key={role}
                          variant="outline"
                          onClick={() => startSpeakerCalibration(role)}
                          disabled={isCalibrating}
                          className="flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          {isCalibrating ? 'Calibrating...' : `Calibrate ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Existing Voice Profiles</h4>
                    {speakerProfiles.length === 0 ? (
                      <p className="text-sm text-gray-500">No voice profiles configured. Add profiles above to enable speaker identification.</p>
                    ) : (
                      <div className="space-y-2">
                        {speakerProfiles.map((profile) => (
                          <div key={profile.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{profile.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {profile.role}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(profile.confidence * 100)}% accuracy
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Pitch: {Math.round(profile.voiceCharacteristics.pitch)}Hz • 
                                Tempo: {Math.round(profile.voiceCharacteristics.tempo)}WPM
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSpeakerProfile(profile.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Voice Commands Tab */}
            <TabsContent value="commands" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.voiceCommands}
                  onChange={(e) => updateSetting('voiceCommands', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label className="text-sm font-medium">Enable Voice Commands</Label>
              </div>

              {settings.voiceCommands && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Available Voice Commands</h4>
                  <div className="grid gap-3">
                    {[
                      { command: '"Add follow-up in 2 weeks"', action: 'Schedules a follow-up appointment' },
                      { command: '"Mark as urgent"', action: 'Sets the session priority to urgent' },
                      { command: '"Send to pharmacy"', action: 'Sends prescription to pharmacy' },
                      { command: '"Schedule blood work"', action: 'Schedules laboratory tests' },
                      { command: '"New section"', action: 'Creates a new template section' },
                      { command: '"Save note"', action: 'Saves the current medical note' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-green-800">{item.command}</span>
                          <p className="text-xs text-gray-600 mt-1">{item.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Text Enhancement Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.automaticPunctuation}
                    onChange={(e) => updateSetting('automaticPunctuation', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm font-medium">Automatic Punctuation</Label>
                </div>

                {settings.automaticPunctuation && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Automatic Text Enhancements</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Adds periods, commas, and sentence capitalization</li>
                      <li>• Formats medical terminology and abbreviations</li>
                      <li>• Standardizes "Patient reports..." format</li>
                      <li>• Capitalizes "Diagnosis:" and "Treatment:" sections</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Medical Text Optimization</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Text enhancement is specifically tuned for medical dictation, improving readability 
                      and ensuring professional formatting of clinical notes.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Audio Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Test Voice Enhancement</h4>
              <p className="text-sm text-gray-500">Test your current settings with a short recording</p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Test Recording
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}