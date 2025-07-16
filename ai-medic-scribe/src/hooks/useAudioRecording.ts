"use client";

import { useState, useRef, useCallback } from "react";
import { trackTranscription } from "@/utils/apiUsageTracker";
import { 
  VoiceEnhancementProcessor, 
  VoiceEnhancementSettings,
  createVoiceEnhancementProcessor,
  defaultVoiceEnhancementSettings 
} from "@/utils/voiceEnhancement";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export interface RecordingSegment {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  content?: string; // Transcribed content for this segment
}

export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  segments: RecordingSegment[];
  fullTranscription: string;
}

export function useAudioRecording(voiceSettings?: Partial<VoiceEnhancementSettings>) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [currentSegment, setCurrentSegment] = useState<RecordingSegment | null>(null);
  const [voiceCommands, setVoiceCommands] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const segmentStartTimeRef = useRef<number>(0);
  const voiceProcessorRef = useRef<VoiceEnhancementProcessor | null>(null);

  const initializeRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      console.log('Microphone access granted, stream:', stream);

      // Skip voice enhancement for now to debug
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        audioChunksRef.current = [];
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      return true;
    } catch (error) {
      console.error("Error initializing recording:", error);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const initialized = await initializeRecording();
    if (!initialized || !mediaRecorderRef.current) return false;

    try {
      const now = Date.now();
      sessionStartTimeRef.current = now;
      segmentStartTimeRef.current = now;

      // Create new session
      const sessionId = `session_${now}`;
      const segmentId = `segment_${now}_1`;
      
      const newSegment: RecordingSegment = {
        id: segmentId,
        startTime: now,
        duration: 0
      };

      const newSession: RecordingSession = {
        id: sessionId,
        startTime: new Date(now),
        totalDuration: 0,
        segments: [newSegment],
        fullTranscription: ''
      };

      setCurrentSession(newSession);
      setCurrentSegment(newSegment);

      mediaRecorderRef.current.start(1000); // Collect data every second
      setRecordingState("recording");
      setDuration(0);
      setAudioBlob(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      return false;
    }
  }, [initializeRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === "recording" || recordingState === "paused") && currentSegment && currentSession) {
      const now = Date.now();
      
      // Update final segment
      const finalSegment: RecordingSegment = {
        ...currentSegment,
        endTime: now,
        duration: recordingState === "recording" 
          ? Math.floor((now - currentSegment.startTime) / 1000)
          : currentSegment.duration
      };

      // Update final session
      const finalSession: RecordingSession = {
        ...currentSession,
        endTime: new Date(now),
        totalDuration: Math.floor((now - sessionStartTimeRef.current) / 1000),
        segments: currentSession.segments.map(seg => 
          seg.id === currentSegment.id ? finalSegment : seg
        )
      };

      setCurrentSession(finalSession);
      setCurrentSegment(finalSegment);

      mediaRecorderRef.current.stop();
      setRecordingState("stopped");

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      return true;
    }
    return false;
  }, [recordingState, currentSegment, currentSession]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording" && currentSegment && currentSession) {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");

      // Update current segment end time
      const now = Date.now();
      const updatedSegment: RecordingSegment = {
        ...currentSegment,
        endTime: now,
        duration: Math.floor((now - currentSegment.startTime) / 1000)
      };

      const updatedSession: RecordingSession = {
        ...currentSession,
        segments: currentSession.segments.map(seg => 
          seg.id === currentSegment.id ? updatedSegment : seg
        )
      };

      setCurrentSegment(updatedSegment);
      setCurrentSession(updatedSession);

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      return true;
    }
    return false;
  }, [recordingState, currentSegment, currentSession]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "paused" && currentSession) {
      const now = Date.now();
      segmentStartTimeRef.current = now;

      // Create new segment for resumed recording
      const segmentId = `segment_${now}_${currentSession.segments.length + 1}`;
      const newSegment: RecordingSegment = {
        id: segmentId,
        startTime: now,
        duration: 0
      };

      const updatedSession: RecordingSession = {
        ...currentSession,
        segments: [...currentSession.segments, newSegment]
      };

      setCurrentSegment(newSegment);
      setCurrentSession(updatedSession);

      mediaRecorderRef.current.resume();
      setRecordingState("recording");

      // Resume timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return true;
    }
    return false;
  }, [recordingState, currentSession]);

  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && recordingState !== "idle") {
      mediaRecorderRef.current.stop();
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    setRecordingState("idle");
    setDuration(0);
    setAudioBlob(null);
    setIsTranscribing(false);
    setCurrentSession(null);
    setCurrentSegment(null);
    audioChunksRef.current = [];
    sessionStartTimeRef.current = 0;
    segmentStartTimeRef.current = 0;

    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [recordingState]);

  const transcribeAudio = useCallback(async (audioBlob: Blob, apiKey: string, language: string = 'auto') => {
    if (!audioBlob || !apiKey) {
      throw new Error("Audio blob and API key are required");
    }

    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      // Only add language parameter if not auto-detect
      if (language !== 'auto') {
        formData.append('language', language);
      }

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Track API usage
      trackTranscription(audioBlob);
      
      // Add language detection info to the result
      const detectedLanguage = result.language || 'unknown';
      
      return {
        text: result.text,
        detectedLanguage,
        duration: result.duration || 0
      };
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    resetRecording();
  }, [resetRecording]);

  // Helper function to format timestamps
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-ZA', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  // Get session summary with timestamps
  const getSessionSummary = useCallback(() => {
    if (!currentSession) return null;
    
    return {
      ...currentSession,
      formattedStartTime: formatTimestamp(currentSession.startTime.getTime()),
      formattedEndTime: currentSession.endTime ? formatTimestamp(currentSession.endTime.getTime()) : null,
      formattedDuration: formatDuration(currentSession.totalDuration),
      segmentSummaries: currentSession.segments.map(segment => ({
        ...segment,
        formattedStartTime: formatTimestamp(segment.startTime),
        formattedEndTime: segment.endTime ? formatTimestamp(segment.endTime) : null,
        formattedDuration: formatDuration(segment.duration)
      }))
    };
  }, [currentSession, formatTimestamp, formatDuration]);

  // Voice enhancement functions
  const enhanceTranscribedText = useCallback((text: string) => {
    if (!voiceProcessorRef.current) return text;
    
    // Enhance text with automatic punctuation
    const enhancedText = voiceProcessorRef.current.enhanceTextWithPunctuation(text);
    
    // Detect voice commands
    const detectedCommands = voiceProcessorRef.current.detectVoiceCommands(text);
    if (detectedCommands.length > 0) {
      setVoiceCommands(prev => [...prev, ...detectedCommands.map(cmd => cmd.command)]);
    }
    
    return enhancedText;
  }, []);

  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceEnhancementSettings>) => {
    if (voiceProcessorRef.current) {
      voiceProcessorRef.current.updateSettings(newSettings);
    }
  }, []);

  const detectVoiceActivity = useCallback(() => {
    if (!voiceProcessorRef.current) return true;
    return voiceProcessorRef.current.detectVoiceActivity();
  }, []);

  const clearVoiceCommands = useCallback(() => {
    setVoiceCommands([]);
  }, []);

  return {
    // State
    recordingState,
    duration,
    audioBlob,
    isTranscribing,
    currentSession,
    currentSegment,
    voiceCommands,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    transcribeAudio,

    // Voice enhancement
    enhanceTranscribedText,
    updateVoiceSettings,
    detectVoiceActivity,
    clearVoiceCommands,

    // Utilities
    formatDuration,
    formatTimestamp,
    getSessionSummary,
    cleanup,

    // Raw refs for advanced usage
    mediaRecorderRef,
    streamRef,
  };
}