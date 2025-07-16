/**
 * File and Image Management System
 * Handles camera capture, file uploads, storage, and organization
 */

export interface MedicalFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video';
  category: 'clinical-photo' | 'lab-result' | 'prescription' | 'referral' | 'consent' | 'other';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadDate: Date;
  captureDate?: Date;
  patientId: string;
  sessionId?: string;
  metadata: FileMetadata;
  tags: string[];
  isEncrypted: boolean;
  accessLevel: 'public' | 'restricted' | 'confidential';
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  location?: GeolocationCoordinates;
  deviceInfo?: DeviceInfo;
  medicalContext?: MedicalContext;
  qualityScore?: number;
  aiAnalysis?: AIAnalysis;
}

export interface DeviceInfo {
  camera?: string;
  flash?: boolean;
  orientation: number;
  timestamp: Date;
}

export interface MedicalContext {
  bodyPart?: string;
  condition?: string;
  viewAngle?: 'anterior' | 'posterior' | 'lateral' | 'medial' | 'superior' | 'inferior';
  annotations?: Annotation[];
  measurements?: Measurement[];
}

export interface Annotation {
  id: string;
  type: 'point' | 'arrow' | 'circle' | 'rectangle' | 'freehand';
  coordinates: number[];
  text: string;
  color: string;
  createdBy: string;
  createdAt: Date;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area';
  points: number[];
  value: number;
  unit: string;
  reference?: string;
}

export interface AIAnalysis {
  confidence: number;
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  qualityMetrics: {
    sharpness: number;
    brightness: number;
    contrast: number;
    completeness: number;
  };
}

export interface CameraSettings {
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  flash: boolean;
  focusMode: 'auto' | 'macro' | 'infinity';
  whiteBalance: 'auto' | 'daylight' | 'fluorescent' | 'incandescent';
  imageStabilization: boolean;
  compressionQuality: number; // 0.1 to 1.0
}

export interface FileOrganization {
  folders: FileFolder[];
  recentFiles: MedicalFile[];
  favoriteFiles: MedicalFile[];
  sharedFiles: MedicalFile[];
}

export interface FileFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color: string;
  icon: string;
  fileCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class FileManager {
  private files: Map<string, MedicalFile> = new Map();
  private folders: Map<string, FileFolder> = new Map();
  private cameraSettings: CameraSettings = {
    resolution: 'high',
    flash: false,
    focusMode: 'auto',
    whiteBalance: 'auto',
    imageStabilization: true,
    compressionQuality: 0.8
  };

  constructor() {
    this.initializeDefaultFolders();
    this.loadFromStorage();
  }

  private initializeDefaultFolders() {
    const defaultFolders: FileFolder[] = [
      {
        id: 'clinical-photos',
        name: 'Clinical Photos',
        description: 'Patient examination photos and clinical images',
        color: '#3B82F6',
        icon: '📸',
        fileCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'lab-results',
        name: 'Laboratory Results',
        description: 'Lab reports, test results, and pathology findings',
        color: '#10B981',
        icon: '🧪',
        fileCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prescriptions',
        name: 'Prescriptions',
        description: 'Prescription documents and medication lists',
        color: '#F59E0B',
        icon: '💊',
        fileCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'referrals',
        name: 'Referrals',
        description: 'Specialist referral letters and reports',
        color: '#8B5CF6',
        icon: '📄',
        fileCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'consent-forms',
        name: 'Consent Forms',
        description: 'Patient consent documents and agreements',
        color: '#EF4444',
        icon: '📋',
        fileCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultFolders.forEach(folder => {
      this.folders.set(folder.id, folder);
    });
  }

  // Camera and Image Capture
  async capturePhoto(patientId: string, sessionId?: string): Promise<MedicalFile> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.getResolutionWidth() },
          height: { ideal: this.getResolutionHeight() },
          facingMode: 'environment' // Use back camera
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);

          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to capture image'));
              return;
            }

            const file = await this.processImageFile(blob, patientId, sessionId);
            stream.getTracks().forEach(track => track.stop());
            resolve(file);
          }, 'image/jpeg', this.cameraSettings.compressionQuality);
        };
      });
    } catch (error) {
      console.error('Camera capture failed:', error);
      throw new Error('Camera access denied or not available');
    }
  }

  async captureMultiplePhotos(
    patientId: string, 
    count: number, 
    sessionId?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<MedicalFile[]> {
    const files: MedicalFile[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const file = await this.capturePhoto(patientId, sessionId);
        files.push(file);
        onProgress?.(i + 1, count);
        
        // Small delay between captures
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to capture photo ${i + 1}:`, error);
      }
    }
    
    return files;
  }

  async recordVideo(
    patientId: string, 
    maxDuration: number = 60000, // 60 seconds default
    sessionId?: string
  ): Promise<MedicalFile> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.getResolutionWidth() },
          height: { ideal: this.getResolutionHeight() },
          facingMode: 'environment'
        },
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            const file = await this.processVideoFile(blob, patientId, sessionId);
            stream.getTracks().forEach(track => track.stop());
            resolve(file);
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.start();
        
        // Auto-stop after max duration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, maxDuration);
      });
    } catch (error) {
      console.error('Video recording failed:', error);
      throw new Error('Camera/microphone access denied or not available');
    }
  }

  // File Processing
  private async processImageFile(
    blob: Blob, 
    patientId: string, 
    sessionId?: string
  ): Promise<MedicalFile> {
    const fileId = this.generateFileId();
    const url = URL.createObjectURL(blob);
    const thumbnailUrl = await this.generateThumbnail(blob);
    
    const metadata = await this.extractImageMetadata(blob);
    const aiAnalysis = await this.performImageAnalysis(blob);
    
    const file: MedicalFile = {
      id: fileId,
      name: `Clinical_Photo_${new Date().toISOString().slice(0, 19)}.jpg`,
      type: 'image',
      category: 'clinical-photo',
      mimeType: 'image/jpeg',
      size: blob.size,
      url,
      thumbnailUrl,
      uploadDate: new Date(),
      captureDate: new Date(),
      patientId,
      sessionId,
      metadata: {
        ...metadata,
        aiAnalysis
      },
      tags: [],
      isEncrypted: true,
      accessLevel: 'confidential'
    };

    this.files.set(fileId, file);
    this.saveToStorage();
    
    return file;
  }

  private async processVideoFile(
    blob: Blob, 
    patientId: string, 
    sessionId?: string
  ): Promise<MedicalFile> {
    const fileId = this.generateFileId();
    const url = URL.createObjectURL(blob);
    const thumbnailUrl = await this.generateVideoThumbnail(blob);
    
    const file: MedicalFile = {
      id: fileId,
      name: `Clinical_Video_${new Date().toISOString().slice(0, 19)}.webm`,
      type: 'video',
      category: 'clinical-photo',
      mimeType: 'video/webm',
      size: blob.size,
      url,
      thumbnailUrl,
      uploadDate: new Date(),
      captureDate: new Date(),
      patientId,
      sessionId,
      metadata: {
        duration: 0 // Will be updated after video loads
      },
      tags: [],
      isEncrypted: true,
      accessLevel: 'confidential'
    };

    this.files.set(fileId, file);
    this.saveToStorage();
    
    return file;
  }

  // File Upload and Management
  async uploadFile(
    file: File, 
    patientId: string, 
    category: MedicalFile['category'],
    sessionId?: string
  ): Promise<MedicalFile> {
    const fileId = this.generateFileId();
    const url = URL.createObjectURL(file);
    
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = await this.generateThumbnail(file);
    }

    const medicalFile: MedicalFile = {
      id: fileId,
      name: file.name,
      type: this.getFileType(file.type),
      category,
      mimeType: file.type,
      size: file.size,
      url,
      thumbnailUrl,
      uploadDate: new Date(),
      patientId,
      sessionId,
      metadata: {},
      tags: [],
      isEncrypted: false,
      accessLevel: 'restricted'
    };

    this.files.set(fileId, medicalFile);
    this.updateFolderCount(category);
    this.saveToStorage();
    
    return medicalFile;
  }

  async uploadMultipleFiles(
    files: FileList, 
    patientId: string, 
    category: MedicalFile['category'],
    sessionId?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<MedicalFile[]> {
    const medicalFiles: MedicalFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = await this.uploadFile(files[i], patientId, category, sessionId);
        medicalFiles.push(file);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error);
      }
    }
    
    return medicalFiles;
  }

  // File Organization
  getFilesByPatient(patientId: string): MedicalFile[] {
    return Array.from(this.files.values()).filter(file => file.patientId === patientId);
  }

  getFilesBySession(sessionId: string): MedicalFile[] {
    return Array.from(this.files.values()).filter(file => file.sessionId === sessionId);
  }

  getFilesByCategory(category: MedicalFile['category']): MedicalFile[] {
    return Array.from(this.files.values()).filter(file => file.category === category);
  }

  getRecentFiles(limit: number = 10): MedicalFile[] {
    return Array.from(this.files.values())
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
      .slice(0, limit);
  }

  searchFiles(query: string): MedicalFile[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.files.values()).filter(file =>
      file.name.toLowerCase().includes(lowercaseQuery) ||
      file.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      file.metadata.medicalContext?.condition?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // File Operations
  deleteFile(fileId: string): boolean {
    const file = this.files.get(fileId);
    if (!file) return false;

    // Revoke object URL to free memory
    URL.revokeObjectURL(file.url);
    if (file.thumbnailUrl) {
      URL.revokeObjectURL(file.thumbnailUrl);
    }

    this.files.delete(fileId);
    this.updateFolderCount(file.category, -1);
    this.saveToStorage();
    
    return true;
  }

  updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): boolean {
    const file = this.files.get(fileId);
    if (!file) return false;

    file.metadata = { ...file.metadata, ...metadata };
    this.saveToStorage();
    
    return true;
  }

  addFileAnnotation(fileId: string, annotation: Omit<Annotation, 'id' | 'createdAt'>): boolean {
    const file = this.files.get(fileId);
    if (!file) return false;

    if (!file.metadata.medicalContext) {
      file.metadata.medicalContext = {};
    }
    if (!file.metadata.medicalContext.annotations) {
      file.metadata.medicalContext.annotations = [];
    }

    const newAnnotation: Annotation = {
      ...annotation,
      id: this.generateFileId(),
      createdAt: new Date()
    };

    file.metadata.medicalContext.annotations.push(newAnnotation);
    this.saveToStorage();
    
    return true;
  }

  // Image Analysis
  private async performImageAnalysis(blob: Blob): Promise<AIAnalysis> {
    // Simplified AI analysis - in production, this would use actual AI services
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      img.onload = () => {
        const analysis: AIAnalysis = {
          confidence: 0.85,
          findings: ['Image quality: Good', 'Adequate lighting', 'Clear focus'],
          recommendations: ['Consider multiple angles', 'Ensure proper patient positioning'],
          riskFactors: [],
          qualityMetrics: {
            sharpness: 0.8,
            brightness: 0.7,
            contrast: 0.75,
            completeness: 0.9
          }
        };
        
        URL.revokeObjectURL(url);
        resolve(analysis);
      };
      img.src = url;
    });
  }

  // Utility Methods
  private getResolutionWidth(): number {
    const resolutions = { low: 640, medium: 1280, high: 1920, ultra: 3840 };
    return resolutions[this.cameraSettings.resolution];
  }

  private getResolutionHeight(): number {
    const resolutions = { low: 480, medium: 720, high: 1080, ultra: 2160 };
    return resolutions[this.cameraSettings.resolution];
  }

  private async generateThumbnail(blob: Blob): Promise<string> {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = 150;
        canvas.height = 150;
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        canvas.toBlob((thumbnailBlob) => {
          if (thumbnailBlob) {
            resolve(URL.createObjectURL(thumbnailBlob));
          }
        }, 'image/jpeg', 0.7);
      };
      
      img.src = URL.createObjectURL(blob);
    });
  }

  private async generateVideoThumbnail(blob: Blob): Promise<string> {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    return new Promise((resolve) => {
      video.onloadeddata = () => {
        video.currentTime = 1; // Get frame at 1 second
      };
      
      video.onseeked = () => {
        canvas.width = 150;
        canvas.height = 150;
        
        const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
        const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
        
        ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
        
        canvas.toBlob((thumbnailBlob) => {
          if (thumbnailBlob) {
            resolve(URL.createObjectURL(thumbnailBlob));
          }
        }, 'image/jpeg', 0.7);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  }

  private async extractImageMetadata(blob: Blob): Promise<FileMetadata> {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      img.onload = () => {
        const metadata: FileMetadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          deviceInfo: {
            orientation: 0,
            timestamp: new Date()
          }
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      };
      img.src = url;
    });
  }

  private getFileType(mimeType: string): MedicalFile['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateFolderCount(category: string, delta: number = 1) {
    const folder = this.folders.get(category);
    if (folder) {
      folder.fileCount += delta;
      folder.updatedAt = new Date();
    }
  }

  private saveToStorage() {
    try {
      const data = {
        files: Array.from(this.files.entries()),
        folders: Array.from(this.folders.entries()),
        settings: this.cameraSettings
      };
      localStorage.setItem('medicalFileManager', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save file manager data:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('medicalFileManager');
      if (stored) {
        const data = JSON.parse(stored);
        this.files = new Map(data.files || []);
        this.folders = new Map(data.folders || []);
        this.cameraSettings = { ...this.cameraSettings, ...data.settings };
      }
    } catch (error) {
      console.error('Failed to load file manager data:', error);
    }
  }

  // Public getters
  getCameraSettings(): CameraSettings {
    return { ...this.cameraSettings };
  }

  updateCameraSettings(settings: Partial<CameraSettings>) {
    this.cameraSettings = { ...this.cameraSettings, ...settings };
    this.saveToStorage();
  }

  getFolders(): FileFolder[] {
    return Array.from(this.folders.values());
  }

  getFileOrganization(): FileOrganization {
    return {
      folders: this.getFolders(),
      recentFiles: this.getRecentFiles(10),
      favoriteFiles: [], // TODO: Implement favorites
      sharedFiles: [] // TODO: Implement sharing
    };
  }
}

export const fileManager = new FileManager();

export function checkCameraPermissions(): Promise<boolean> {
  return navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      stream.getTracks().forEach(track => track.stop());
      return true;
    })
    .catch(() => false);
}

export function checkMicrophonePermissions(): Promise<boolean> {
  return navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      stream.getTracks().forEach(track => track.stop());
      return true;
    })
    .catch(() => false);
}