"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, Square, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiSettings, getStoredApiKey } from "../settings/ApiSettings";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { Patient } from "@/types";

interface TranscriptionScreenProps {
  patient: Patient;
  onBack: () => void;
  onSaveSession?: (content: string, audioBlob?: Blob) => void;
}

export function TranscriptionScreen({ patient, onBack, onSaveSession }: TranscriptionScreenProps) {
  const {
    recordingState,
    duration,
    audioBlob,
    isTranscribing,
    startRecording,
    stopRecording,
    resetRecording,
    transcribeAudio,
    formatDuration,
    streamRef,
  } = useAudioRecording();

  const [transcriptionText, setTranscriptionText] = useState("");
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Set up waveform visualization when recording starts
  useEffect(() => {
    if (recordingState === "recording" && streamRef.current) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();
    }
  }, [recordingState, streamRef]);

  const handleTranscription = async () => {
    if (!audioBlob) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setTranscriptionError("OpenAI API key not configured. Please set it up in settings.");
      return;
    }

    setTranscriptionError(null);
    
    try {
      const text = await transcribeAudio(audioBlob, apiKey);
      setTranscriptionText(text);
    } catch (error) {
      console.error("Transcription failed:", error);
      setTranscriptionError("Transcription failed. Please check your API key and try again.");
    }
  };

  // Handle automatic transcription when recording stops
  useEffect(() => {
    if (recordingState === "stopped" && audioBlob) {
      handleTranscription();
    }
  }, [recordingState, audioBlob, transcribeAudio]);

  // Waveform visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (recordingState !== "recording") return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const intensity = dataArray[i] / 255;
        const red = Math.floor(59 + intensity * (99 - 59)); // Blue range
        const green = Math.floor(130 + intensity * (179 - 130));
        const blue = Math.floor(246 + intensity * (255 - 246));
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleSave = () => {
    if (onSaveSession) {
      onSaveSession(transcriptionText, audioBlob || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mr-4 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              {/* Patient Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-500">Age {patient.age}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>API Configuration</DialogTitle>
                  </DialogHeader>
                  <ApiSettings />
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-xs">
                New Session
              </Badge>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Recording Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Recording Status */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {recordingState === "recording" && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="text-xl font-medium text-gray-900">
                {recordingState === "idle" && "Ready to Record"}
                {recordingState === "recording" && "Recording..."}
                {recordingState === "stopped" && "Recording Complete"}
                {isTranscribing && "Transcribing..."}
              </span>
            </div>
            
            {duration > 0 && (
              <div className="text-3xl font-mono text-blue-600">
                {formatDuration(duration)}
              </div>
            )}
          </div>

          {/* Waveform Visualization */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              className="border border-gray-200 rounded-lg bg-gray-50"
            />
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center space-x-6">
            {recordingState === "idle" && (
              <Button
                size="lg"
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "recording" && (
              <Button
                size="lg"
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "stopped" && (
              <div className="flex space-x-4">
                <Button
                  size="lg"
                  onClick={() => {
                    resetRecording();
                    setTranscriptionText("");
                    setTranscriptionError(null);
                  }}
                  variant="outline"
                  className="px-6 py-3"
                >
                  New Recording
                </Button>
                <Button
                  size="lg"
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600"
                  disabled={!transcriptionText.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Session
                </Button>
              </div>
            )}
          </div>

          {/* Transcription Loading */}
          {isTranscribing && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Processing audio with Whisper AI...</span>
              </div>
            </div>
          )}

          {/* Transcription Error */}
          {transcriptionError && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-red-700 text-sm">{transcriptionError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="text-red-600 border-red-300 hover:bg-red-100"
                  >
                    Configure API
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Text */}
          {transcriptionText && (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Transcription</h3>
                  <Badge variant="secondary">
                    {transcriptionText.split(' ').length} words
                  </Badge>
                </div>
                <Textarea
                  value={transcriptionText}
                  onChange={(e) => setTranscriptionText(e.target.value)}
                  className="min-h-[200px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Transcribed text will appear here..."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}