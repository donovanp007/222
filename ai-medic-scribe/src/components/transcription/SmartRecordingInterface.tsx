"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Pause, Play, Users, Volume2, Zap, Brain, Waves, CheckCircle, AlertTriangle, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SmartRecordingInterfaceProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  isTranscribing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onResetRecording: () => void;
  formatDuration: (seconds: number) => string;
  voiceCommands?: string[];
  streamRef?: React.RefObject<MediaStream | null>;
  className?: string;
}

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

function WaveformVisualizer({ stream, isRecording }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    microphone.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !ctx || !canvas) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#007AFF');
        gradient.addColorStop(0.5, '#34C759');
        gradient.addColorStop(1, '#FF9500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [stream, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width="400"
      height="100"
      className="w-full h-20 rounded-lg border border-gray-200 bg-gray-50"
    />
  );
}

export function SmartRecordingInterface({
  recordingState,
  duration,
  isTranscribing,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onResetRecording,
  formatDuration,
  voiceCommands = [],
  streamRef,
  className
}: SmartRecordingInterfaceProps) {
  const [speakerActivity, setSpeakerActivity] = useState<'doctor' | 'patient' | 'none'>('none');
  const [transcriptionQuality, setTranscriptionQuality] = useState<number>(85);
  const [backgroundNoise, setBackgroundNoise] = useState<'low' | 'medium' | 'high'>('low');
  const [isListeningForCommands, setIsListeningForCommands] = useState(false);
  const [recentVoiceCommand, setRecentVoiceCommand] = useState<string>("");

  // Simulate speaker detection and quality metrics
  useEffect(() => {
    if (recordingState === 'recording') {
      const interval = setInterval(() => {
        // Simulate speaker activity detection
        const speakers = ['doctor', 'patient', 'none'] as const;
        setSpeakerActivity(speakers[Math.floor(Math.random() * speakers.length)]);
        
        // Simulate transcription quality based on background noise
        const baseQuality = backgroundNoise === 'low' ? 90 : backgroundNoise === 'medium' ? 75 : 60;
        setTranscriptionQuality(baseQuality + Math.random() * 10 - 5);
        
        // Simulate background noise detection
        const noiseLevel = Math.random();
        if (noiseLevel > 0.8) setBackgroundNoise('high');
        else if (noiseLevel > 0.5) setBackgroundNoise('medium');
        else setBackgroundNoise('low');
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [recordingState, backgroundNoise]);

  // Handle voice commands
  useEffect(() => {
    if (voiceCommands.length > 0) {
      const latestCommand = voiceCommands[voiceCommands.length - 1];
      setRecentVoiceCommand(latestCommand);
      setIsListeningForCommands(true);
      
      const timeout = setTimeout(() => {
        setIsListeningForCommands(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [voiceCommands]);

  const getRecordingButtonClass = () => {
    const baseClass = "w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg";
    
    switch (recordingState) {
      case 'recording':
        return `${baseClass} bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse`;
      case 'paused':
        return `${baseClass} bg-gradient-to-r from-orange-500 to-orange-600 text-white`;
      case 'stopped':
        return `${baseClass} bg-gradient-to-r from-blue-500 to-blue-600 text-white`;
      default:
        return `${baseClass} bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`;
    }
  };

  const getRecordingButtonIcon = () => {
    switch (recordingState) {
      case 'recording':
        return <Mic className="w-8 h-8" />;
      case 'paused':
        return <Play className="w-8 h-8" />;
      case 'stopped':
        return <Mic className="w-8 h-8" />;
      default:
        return <Mic className="w-8 h-8" />;
    }
  };

  const handleRecordingClick = () => {
    switch (recordingState) {
      case 'idle':
        onStartRecording();
        break;
      case 'recording':
        onStopRecording();
        break;
      case 'paused':
        onResumeRecording();
        break;
      case 'stopped':
        onResetRecording();
        break;
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600 bg-green-50';
    if (quality >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getNoiseColor = (noise: string) => {
    switch (noise) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Recording Control */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl backdrop-blur-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Recording Button */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-30"></div>
              <Button
                onClick={handleRecordingClick}
                className={getRecordingButtonClass()}
                disabled={isTranscribing}
              >
                {getRecordingButtonIcon()}
              </Button>
              
              {/* Recording State Indicator */}
              {recordingState === 'recording' && (
                <>
                  <div className="absolute -top-3 -right-3 animate-bounce">
                    <div className="w-7 h-7 bg-red-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 bg-red-300 rounded-full animate-ping opacity-10 animation-delay-100"></div>
                  </div>
                </>
              )}
            </div>

            {/* Timer and Status */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900 font-mono">
                {formatDuration(duration)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge className={`${
                  recordingState === 'recording' ? 'bg-red-100 text-red-700' :
                  recordingState === 'paused' ? 'bg-orange-100 text-orange-700' :
                  recordingState === 'stopped' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {recordingState === 'idle' && 'Ready to Record'}
                  {recordingState === 'recording' && 'Recording'}
                  {recordingState === 'paused' && 'Paused'}
                  {recordingState === 'stopped' && 'Stopped'}
                </Badge>
                {isTranscribing && (
                  <Badge className="bg-purple-100 text-purple-700 animate-pulse">
                    <Brain className="w-3 h-3 mr-1" />
                    Transcribing
                  </Badge>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            {recordingState !== 'idle' && (
              <div className="flex items-center gap-3">
                {recordingState === 'recording' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPauseRecording}
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStopRecording}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>

                {recordingState === 'stopped' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetRecording}
                    className="flex items-center gap-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Waveform Visualization */}
      {recordingState === 'recording' && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Waves className="w-5 h-5 text-blue-600" />
              Audio Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WaveformVisualizer 
              stream={streamRef?.current || null} 
              isRecording={recordingState === 'recording'} 
            />
          </CardContent>
        </Card>
      )}

      {/* Real-time Feedback */}
      {recordingState === 'recording' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Speaker Detection */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-purple-600" />
                Speaker Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    speakerActivity === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Doctor</span>
                    {speakerActivity === 'doctor' && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    speakerActivity === 'patient' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Patient</span>
                    {speakerActivity === 'patient' && <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Quality */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Volume2 className="w-4 h-4 text-green-600" />
                Audio Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transcription Quality</span>
                <Badge className={getQualityColor(transcriptionQuality)}>
                  {Math.round(transcriptionQuality)}%
                </Badge>
              </div>
              <Progress value={transcriptionQuality} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Background Noise</span>
                <Badge className={getNoiseColor(backgroundNoise)}>
                  {backgroundNoise}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Voice Commands */}
      {voiceCommands.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Voice Commands
              {isListeningForCommands && (
                <Badge className="bg-purple-100 text-purple-700 animate-pulse">
                  <Brain className="w-3 h-3 mr-1" />
                  Processing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentVoiceCommand && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Latest command:</span>
                  <span className="text-sm text-gray-700">"{recentVoiceCommand}"</span>
                </div>
              )}
              
              <div className="text-xs text-gray-600">
                Try saying: "Go to symptoms", "Add diagnosis", "Save notes", or "New section"
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {recordingState === 'recording' && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-orange-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors">
                Mark timestamp
              </Badge>
              <Badge className="bg-green-100 text-green-700 cursor-pointer hover:bg-green-200 transition-colors">
                Flag important
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200 transition-colors">
                Add note
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors">
                Change section
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}