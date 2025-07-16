'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Upload, 
  FileAudio, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  FileType,
  CheckCircle,
  AlertTriangle,
  Brain,
  Wifi,
  WifiOff,
  HardDrive,
  CloudUpload
} from 'lucide-react'
import { Patient } from '@/types'

interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  duration?: number
  format: string
  uploadedAt: Date
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  transcriptionText?: string
  isStoredLocally: boolean
  quality: 'poor' | 'fair' | 'good' | 'excellent'
}

interface AudioUploadProps {
  patient: Patient
  onTranscriptionComplete?: (audioFile: AudioFile, transcription: string) => void
  onAudioStored?: (audioFile: AudioFile) => void
  allowOfflineStorage?: boolean
}

export function EnhancedAudioUpload({ 
  patient, 
  onTranscriptionComplete, 
  onAudioStored,
  allowOfflineStorage = true 
}: AudioUploadProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [processingQueue, setProcessingQueue] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Monitor online status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Process offline queue when coming back online
  React.useEffect(() => {
    if (isOnline && processingQueue.length > 0) {
      processOfflineQueue()
    }
  }, [isOnline])

  const processOfflineQueue = async () => {
    for (const fileId of processingQueue) {
      const audioFile = audioFiles.find(f => f.id === fileId)
      if (audioFile) {
        await transcribeAudio(audioFile)
      }
    }
    setProcessingQueue([])
  }

  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    fileArray.forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const audioFile: AudioFile = {
          id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          format: file.type,
          uploadedAt: new Date(),
          transcriptionStatus: 'pending',
          isStoredLocally: allowOfflineStorage,
          quality: assessAudioQuality(file)
        }
        
        // Load audio metadata
        loadAudioMetadata(audioFile)
        
        setAudioFiles(prev => [...prev, audioFile])
        onAudioStored?.(audioFile)
        
        // Store locally if offline or if offline storage is enabled
        if (!isOnline || allowOfflineStorage) {
          storeAudioLocally(audioFile)
        }
        
        // Process immediately if online
        if (isOnline) {
          transcribeAudio(audioFile)
        } else {
          setProcessingQueue(prev => [...prev, audioFile.id])
        }
      }
    })
  }, [allowOfflineStorage, isOnline])

  const loadAudioMetadata = (audioFile: AudioFile) => {
    const audio = new Audio()
    const url = URL.createObjectURL(audioFile.file)
    
    audio.addEventListener('loadedmetadata', () => {
      setAudioFiles(prev => 
        prev.map(f => 
          f.id === audioFile.id 
            ? { ...f, duration: audio.duration }
            : f
        )
      )
      URL.revokeObjectURL(url)
    })
    
    audio.src = url
  }

  const assessAudioQuality = (file: File): AudioFile['quality'] => {
    // Simple quality assessment based on file size and format
    const sizePerMinute = file.size / (file.size / 1000000) // Rough estimate
    
    if (file.type.includes('wav') || file.type.includes('flac')) {
      return 'excellent'
    } else if (file.type.includes('mp3') && sizePerMinute > 1) {
      return 'good'
    } else if (file.type.includes('mp3')) {
      return 'fair'
    } else {
      return 'poor'
    }
  }

  const storeAudioLocally = (audioFile: AudioFile) => {
    try {
      // In a real app, you'd use IndexedDB or similar for larger files
      const reader = new FileReader()
      reader.onload = () => {
        localStorage.setItem(`audio_${audioFile.id}`, reader.result as string)
        console.log(`Audio file ${audioFile.name} stored locally`)
      }
      reader.readAsDataURL(audioFile.file)
    } catch (error) {
      console.error('Failed to store audio locally:', error)
    }
  }

  const transcribeAudio = async (audioFile: AudioFile) => {
    setAudioFiles(prev => 
      prev.map(f => 
        f.id === audioFile.id 
          ? { ...f, transcriptionStatus: 'processing' }
          : f
      )
    )

    try {
      // Simulate transcription process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock transcription result
      const mockTranscription = generateMockTranscription(audioFile.name)
      
      setAudioFiles(prev => 
        prev.map(f => 
          f.id === audioFile.id 
            ? { 
                ...f, 
                transcriptionStatus: 'completed',
                transcriptionText: mockTranscription
              }
            : f
        )
      )

      onTranscriptionComplete?.(audioFile, mockTranscription)
      
    } catch (error) {
      console.error('Transcription failed:', error)
      setAudioFiles(prev => 
        prev.map(f => 
          f.id === audioFile.id 
            ? { ...f, transcriptionStatus: 'failed' }
            : f
        )
      )
    }
  }

  const generateMockTranscription = (fileName: string): string => {
    const mockTexts = [
      "Patient reports feeling much better since last visit. Blood pressure has improved and is now within normal range. Continue current medication regimen. Follow up in 6 weeks.",
      "Consultation for routine check-up. Patient is compliant with medication. No significant changes since last visit. Vitals stable. Next appointment in 3 months.",
      "Patient presents with mild headache and fatigue. Symptoms started 2 days ago. No fever reported. Recommending rest and hydration. Return if symptoms worsen.",
      "Follow-up visit for diabetes management. HbA1c results show good control. Patient maintaining diet and exercise routine. Continue current treatment plan."
    ]
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }

  const playAudio = (audioFile: AudioFile) => {
    if (audioRef.current) {
      const url = URL.createObjectURL(audioFile.file)
      audioRef.current.src = url
      audioRef.current.play()
      setIsPlaying(true)
      setSelectedFile(audioFile)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: AudioFile['transcriptionStatus']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />
      case 'processing': return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: AudioFile['transcriptionStatus']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700'
      case 'processing': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
    }
  }

  const getQualityColor = (quality: AudioFile['quality']) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-700'
      case 'good': return 'bg-blue-100 text-blue-700'
      case 'fair': return 'bg-yellow-100 text-yellow-700'
      case 'poor': return 'bg-red-100 text-red-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">Audio Upload & Transcription</h2>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Badge className="bg-green-100 text-green-700">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {processingQueue.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700">
                {processingQueue.length} queued
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Audio
        </Button>
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {dragOver ? 'Drop audio files here' : 'Upload audio recordings'}
          </h3>
          <p className="text-gray-500 mb-4">
            Supports MP3, WAV, M4A, AAC, OGG formats
            {!isOnline && allowOfflineStorage && (
              <span className="block text-yellow-600 mt-1">
                <HardDrive className="w-4 h-4 inline mr-1" />
                Files will be stored offline for later processing
              </span>
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
        </CardContent>
      </Card>

      {/* Audio Files List */}
      {audioFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Uploaded Audio Files</h3>
          <div className="space-y-3">
            {audioFiles.map((audioFile) => (
              <Card key={audioFile.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileAudio className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{audioFile.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(audioFile.size)}</span>
                            {audioFile.duration && (
                              <span>{formatDuration(audioFile.duration)}</span>
                            )}
                            <Badge className={getQualityColor(audioFile.quality)}>
                              {audioFile.quality}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              {audioFile.isStoredLocally && (
                                <HardDrive className="w-3 h-3" />
                              )}
                              {isOnline && (
                                <CloudUpload className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playAudio(audioFile)}
                          disabled={isPlaying && selectedFile?.id === audioFile.id}
                        >
                          {isPlaying && selectedFile?.id === audioFile.id ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        
                        {isPlaying && selectedFile?.id === audioFile.id && (
                          <>
                            <Button size="sm" variant="outline" onClick={stopAudio}>
                              <Square className="w-3 h-3" />
                            </Button>
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={(e) => {
                                  if (audioRef.current) {
                                    audioRef.current.currentTime = Number(e.target.value)
                                  }
                                }}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500">
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Transcription Status */}
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(audioFile.transcriptionStatus)}
                        <Badge className={getStatusColor(audioFile.transcriptionStatus)}>
                          {audioFile.transcriptionStatus}
                        </Badge>
                        {audioFile.transcriptionStatus === 'processing' && (
                          <span className="text-sm text-gray-500">
                            Transcribing audio...
                          </span>
                        )}
                      </div>

                      {/* Transcription Text */}
                      {audioFile.transcriptionText && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-sm mb-2">Transcription:</h5>
                          <p className="text-sm text-gray-700">{audioFile.transcriptionText}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {audioFile.transcriptionStatus === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => transcribeAudio(audioFile)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = URL.createObjectURL(audioFile.file)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = audioFile.name
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAudioFiles(prev => prev.filter(f => f.id !== audioFile.id))
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Audio Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        volume={isMuted ? 0 : volume}
        style={{ display: 'none' }}
      />

      {/* Offline Status */}
      {!isOnline && audioFiles.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Offline Mode</h4>
                <p className="text-sm text-yellow-700">
                  Audio files are stored locally. Transcription will begin when connection is restored.
                  {processingQueue.length > 0 && (
                    <span className="block mt-1">
                      {processingQueue.length} file(s) queued for processing.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedAudioUpload