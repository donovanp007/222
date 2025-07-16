"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Camera, Video, Square, Circle, FlashlightIcon as Flash, FlashlightOff,
  Settings, Grid3X3, RotateCw, Download, Trash2, 
  ZoomIn, ZoomOut, Focus, Timer, Image as ImageIcon,
  Play, Pause, StopCircle, CheckCircle, XCircle
} from 'lucide-react';
import { Patient } from '@/types';
import { fileManager, MedicalFile, CameraSettings, checkCameraPermissions } from '@/utils/fileManager';

interface CameraInterfaceProps {
  patient: Patient;
  sessionId?: string;
  onCapture?: (file: MedicalFile) => void;
  onClose?: () => void;
}

export function CameraInterface({ patient, sessionId, onCapture, onClose }: CameraInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [previewFiles, setPreviewFiles] = useState<MedicalFile[]>([]);
  const [settings, setSettings] = useState<CameraSettings>(fileManager.getCameraSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [timer, setTimer] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const initializeCamera = async () => {
    try {
      const hasAccess = await checkCameraPermissions();
      setHasPermission(hasAccess);

      if (!hasAccess) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        },
        audio: mode === 'video'
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setHasPermission(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      if (timer) {
        await countdown(timer);
      }

      const file = await fileManager.capturePhoto(patient.id, sessionId);
      setPreviewFiles(prev => [...prev, file]);
      onCapture?.(file);
      
      // Flash effect
      const flashOverlay = document.createElement('div');
      flashOverlay.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
      flashOverlay.style.animation = 'flash 0.2s ease-out';
      document.body.appendChild(flashOverlay);
      
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 200);
      
    } catch (error) {
      console.error('Photo capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const startVideoRecording = async () => {
    if (!streamRef.current || isRecording) return;

    try {
      setIsRecording(true);
    } catch (error) {
      console.error('Video recording failed:', error);
      setIsRecording(false);
    }
  };

  const stopVideoRecording = async () => {
    if (!isRecording) return;

    try {
      const file = await fileManager.recordVideo(patient.id, recordingDuration * 1000, sessionId);
      setPreviewFiles(prev => [...prev, file]);
      onCapture?.(file);
      setIsRecording(false);
    } catch (error) {
      console.error('Stop recording failed:', error);
      setIsRecording(false);
    }
  };

  const countdown = (seconds: number): Promise<void> => {
    return new Promise((resolve) => {
      let count = seconds;
      const countdownInterval = setInterval(() => {
        if (count <= 0) {
          clearInterval(countdownInterval);
          resolve();
        } else {
          // Show countdown overlay
          count--;
        }
      }, 1000);
    });
  };

  const switchCamera = async () => {
    if (!streamRef.current) return;

    try {
      const tracks = streamRef.current.getVideoTracks();
      const currentFacingMode = tracks[0]?.getSettings()?.facingMode;
      const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: newFacingMode
        },
        audio: mode === 'video'
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera switch failed:', error);
    }
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(5, zoom + delta));
    setZoom(newZoom);
    
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${newZoom})`;
    }
  };

  const updateSettings = (newSettings: Partial<CameraSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    fileManager.updateCameraSettings(updatedSettings);
  };

  const deletePreviewFile = (fileId: string) => {
    fileManager.deleteFile(fileId);
    setPreviewFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Camera
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Camera Permission Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Denied</h3>
            <p className="text-gray-500 mb-4">
              Please allow camera access to capture clinical photos and videos.
            </p>
            <Button onClick={initializeCamera}>
              Request Permission
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Camera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Clinical Camera
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {patient.name}
              </Badge>
              {sessionId && (
                <Badge variant="outline" className="text-xs">
                  Session {sessionId.slice(-6)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[70vh]">
          {/* Camera Preview */}
          <div className="lg:col-span-3 relative bg-black rounded-lg overflow-hidden">
            {hasPermission === null ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Initializing camera...</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Grid Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }, (_, i) => (
                        <div key={i} className="border border-white border-opacity-30" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <Circle className="w-3 h-3 fill-current animate-pulse" />
                    <span className="text-sm font-medium">REC {formatDuration(recordingDuration)}</span>
                  </div>
                )}

                {/* Zoom Level */}
                {zoom > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    <span className="text-sm">{zoom.toFixed(1)}x</span>
                  </div>
                )}

                {/* Timer Countdown */}
                {timer && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-black bg-opacity-70 text-white text-6xl font-bold px-6 py-4 rounded-full">
                      {timer}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Camera Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-4 bg-black bg-opacity-50 backdrop-blur-sm px-6 py-3 rounded-full">
                {/* Mode Toggle */}
                <div className="flex items-center bg-gray-800 rounded-full p-1">
                  <Button
                    size="sm"
                    variant={mode === 'photo' ? 'default' : 'ghost'}
                    onClick={() => setMode('photo')}
                    className="rounded-full px-3 py-1 text-xs"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Photo
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'video' ? 'default' : 'ghost'}
                    onClick={() => setMode('video')}
                    className="rounded-full px-3 py-1 text-xs"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Button>
                </div>

                {/* Main Capture Button */}
                {mode === 'photo' ? (
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black border-4 border-gray-300"
                  >
                    {isCapturing ? (
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Circle className="w-8 h-8" />
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={isRecording ? stopVideoRecording : startVideoRecording}
                    className={`w-16 h-16 rounded-full border-4 border-gray-300 ${
                      isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-white hover:bg-gray-100 text-black'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="w-6 h-6 fill-current" />
                    ) : (
                      <Circle className="w-8 h-8" />
                    )}
                  </Button>
                )}

                {/* Switch Camera */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={switchCamera}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Side Controls */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
              {/* Zoom Controls */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => adjustZoom(0.5)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => adjustZoom(-0.5)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              {/* Grid Toggle */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGrid(!showGrid)}
                className={`rounded-full w-10 h-10 ${
                  showGrid ? 'text-blue-400 bg-blue-400 bg-opacity-20' : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>

              {/* Flash Toggle (Photo Mode) */}
              {mode === 'photo' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateSettings({ flash: !settings.flash })}
                  className={`rounded-full w-10 h-10 ${
                    settings.flash ? 'text-yellow-400 bg-yellow-400 bg-opacity-20' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  {settings.flash ? <Flash className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                </Button>
              )}

              {/* Timer */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTimer(timer === 3 ? null : 3)}
                className={`rounded-full w-10 h-10 ${
                  timer ? 'text-green-400 bg-green-400 bg-opacity-20' : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Timer className="w-4 h-4" />
              </Button>

              {/* Settings */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* File Preview Panel */}
          <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Captured Files</h3>
              <Badge variant="outline" className="text-xs">
                {previewFiles.length} files
              </Badge>
            </div>

            <div className="space-y-3">
              {previewFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-start gap-3">
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                        {file.type === 'video' ? (
                          <Video className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.uploadDate.toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.name;
                          link.click();
                        }}
                        className="w-8 h-8 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePreviewFile(file.id)}
                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {previewFiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No files captured yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Camera Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Resolution</label>
                <select
                  value={settings.resolution}
                  onChange={(e) => updateSettings({ resolution: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="low">Low (640x480)</option>
                  <option value="medium">Medium (1280x720)</option>
                  <option value="high">High (1920x1080)</option>
                  <option value="ultra">Ultra (3840x2160)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Compression Quality</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.compressionQuality}
                  onChange={(e) => updateSettings({ compressionQuality: parseFloat(e.target.value) })}
                  className="w-full mt-1"
                />
                <span className="text-xs text-gray-500">{Math.round(settings.compressionQuality * 100)}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.imageStabilization}
                  onChange={(e) => updateSettings({ imageStabilization: e.target.checked })}
                />
                <label className="text-sm">Image Stabilization</label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}