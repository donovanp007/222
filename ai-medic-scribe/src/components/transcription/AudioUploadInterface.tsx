"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Play, Pause, Square, FileAudio, AlertCircle, CheckCircle, X, Clock, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AudioUploadInterfaceProps {
  onFileUpload: (file: File) => void;
  onTranscribeFile: (file: File) => Promise<string>;
  isTranscribing: boolean;
  transcriptionProgress?: number;
  className?: string;
}

interface AudioFileInfo {
  file: File;
  duration: number;
  size: string;
  format: string;
  url: string;
}

export function AudioUploadInterface({
  onFileUpload,
  onTranscribeFile,
  isTranscribing,
  transcriptionProgress = 0,
  className
}: AudioUploadInterfaceProps) {
  const [uploadedFile, setUploadedFile] = useState<AudioFileInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragCounterRef = useRef(0);

  const supportedFormats = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0); // If we can't get duration, return 0
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return `Unsupported format. Please upload: ${supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size is ${formatFileSize(maxFileSize)}`;
    }
    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    
    try {
      const duration = await getAudioDuration(file);
      const url = URL.createObjectURL(file);
      
      const fileInfo: AudioFileInfo = {
        file,
        duration,
        size: formatFileSize(file.size),
        format: file.type.split('/')[1].toUpperCase(),
        url
      };

      setUploadedFile(fileInfo);
      onFileUpload(file);
    } catch (error) {
      setUploadError('Failed to process audio file');
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !uploadedFile) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current || !uploadedFile) return;
    
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    
    setCurrentTime(current);
    setPlaybackProgress((current / duration) * 100);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackProgress(0);
  };

  const removeFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
    }
    setUploadedFile(null);
    setUploadError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranscribe = async () => {
    if (!uploadedFile) return;
    
    try {
      await onTranscribeFile(uploadedFile.file);
    } catch (error) {
      setUploadError('Transcription failed. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : uploadedFile 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          {!uploadedFile ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDragOver ? 'bg-blue-500 scale-110' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-white' : 'text-gray-500'}`} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragOver ? 'Drop your audio file here' : 'Upload Audio Recording'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop an audio file or click to browse
                </p>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 border-t pt-4">
                <div>
                  <strong>Supported formats:</strong>
                  <br />MP3, WAV, M4A, AAC, OGG
                </div>
                <div>
                  <strong>Maximum size:</strong>
                  <br />{formatFileSize(maxFileSize)}
                </div>
              </div>
            </div>
          ) : (
            /* File Uploaded View */
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <FileAudio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{uploadedFile.file.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{uploadedFile.size}</span>
                      <span>{uploadedFile.format}</span>
                      <span>{formatDuration(uploadedFile.duration)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Audio Player */}
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      className="w-10 h-10 rounded-full p-0"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <Progress value={playbackProgress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(uploadedFile.duration)}</span>
                      </div>
                    </div>
                    
                    <Volume2 className="w-4 h-4 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:scale-105 transition-transform"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <FileAudio className="w-4 h-4 mr-2" />
                      Transcribe Audio
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Different File
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription Progress */}
      {isTranscribing && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse flex items-center justify-center">
                <FileAudio className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Transcribing Audio File</h3>
                <Progress value={transcriptionProgress} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Processing audio content...</span>
                  <span>{Math.round(transcriptionProgress)}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
              💡 <strong>Tip:</strong> Large files may take a few minutes to process. You can continue working while transcription runs in the background.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {uploadError && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">Upload Error</h4>
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden audio element for playback */}
      {uploadedFile && (
        <audio
          ref={audioRef}
          src={uploadedFile.url}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}