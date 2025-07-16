// Core Patient Types
export interface Patient {
  id: string
  name: string
  surname: string
  age: number
  gender?: 'male' | 'female' | 'other'
  idNumber?: string
  contact?: string
  email?: string
  address?: string
  dateOfBirth?: Date
  medicalAid?: MedicalAid
  emergencyContact?: EmergencyContact
  allergies?: string[]
  chronicConditions?: string[]
  currentMedications?: Medication[]
  createdAt: Date
  updatedAt: Date
}

export interface MedicalAid {
  provider: string
  memberNumber: string
  dependentCode?: string
  planName?: string
  contactNumber?: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
  address?: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  prescribedBy: string
  notes?: string
}

// Consultation/Session Types
export interface Consultation {
  id: string
  patientId: string
  title: string
  content: string
  visitDate: Date
  diagnosis?: string[]
  summary?: string
  recommendations?: string[]
  followUpInstructions?: string
  prescriptions?: Prescription[]
  vitals?: VitalSigns
  assessments?: Assessment[]
  attachments?: Attachment[]
  suggestedTasks?: TaskSuggestion[]
  exportHistory?: ExportRecord[]
  challengeResults?: any // For diagnostic challenge results
  createdAt: Date
  updatedAt: Date
  isLocked: boolean
}

export interface VitalSigns {
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  temperature?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  bmi?: number
  recordedAt: Date
}

export interface Assessment {
  id: string
  category: string
  finding: string
  severity?: 'mild' | 'moderate' | 'severe'
  notes?: string
}

export interface Prescription {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  quantity?: number
  refills?: number
  prescribedAt: Date
}

export interface Attachment {
  id: string
  type: 'image' | 'document' | 'audio' | 'video'
  filename: string
  url: string
  description?: string
  uploadedAt: Date
}

// Task and Workflow Types
export interface TaskSuggestion {
  id: string
  title: string
  description: string
  category: 'follow-up' | 'test' | 'referral' | 'medication' | 'lifestyle'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  isCompleted: boolean
  createdAt: Date
  assignedTo?: string
}

export interface FollowUpReminder {
  id: string
  patientId: string
  consultationId?: string
  title: string
  description: string
  scheduledDate: Date
  reminderType: 'appointment' | 'medication' | 'test' | 'general'
  status: 'pending' | 'sent' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

// Export and Archive Types
export interface ExportRecord {
  id: string
  format: 'pdf' | 'docx' | 'txt' | 'json'
  filename: string
  fileSize: number
  includeAttachments: boolean
  exportedAt: Date
  exportedBy?: string
}

// UI and Interaction Types
export interface SearchFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  patientId?: string
  diagnosis?: string[]
  tags?: string[]
  contentSearch?: string
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Audio and Transcription Types
export interface AudioRecording {
  id: string
  blob: Blob
  duration: number
  format: string
  quality: 'low' | 'medium' | 'high'
  recordedAt: Date
}

export interface TranscriptionResult {
  id: string
  text: string
  confidence: number
  language: string
  processedAt: Date
  segments?: TranscriptionSegment[]
}

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
  confidence: number
}

// Template Types
export interface Template {
  id: string
  name: string
  category: 'consultation' | 'referral' | 'discharge' | 'prescription'
  content: string
  variables?: TemplateVariable[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  required: boolean
  defaultValue?: any
  options?: string[] // For select type
}

// Settings and Configuration Types
export interface UserSettings {
  id: string
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  autoSave: boolean
  autoLock: boolean
  lockTimeout: number // in minutes
  defaultTemplates: {
    consultation?: string
    prescription?: string
    referral?: string
  }
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  enableEmail: boolean
  enablePush: boolean
  reminderNotifications: boolean
  followUpNotifications: boolean
  appointmentNotifications: boolean
}

export interface PrivacySettings {
  shareAnalytics: boolean
  cloudSync: boolean
  dataRetention: number // in months
  exportOnDelete: boolean
}

// AI and Analysis Types
export interface AIAnalysis {
  id: string
  consultationId: string
  type: 'diagnosis' | 'summary' | 'recommendations' | 'risk-assessment'
  result: any
  confidence: number
  processedAt: Date
  modelVersion: string
}

export interface DiagnosticSuggestion {
  diagnosis: string
  confidence: number
  reasoning: string
  icdCode?: string
  supportingEvidence: string[]
}

// Error and Validation Types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: ValidationError[]
  }
  metadata?: {
    pagination?: PaginationOptions
    total?: number
    timestamp: Date
  }
}