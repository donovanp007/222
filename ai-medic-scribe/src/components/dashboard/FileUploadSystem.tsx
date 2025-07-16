"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Download, 
  Trash2,
  Calendar,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Patient } from "@/types";

interface FileRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'lab_results' | 'imaging' | 'referral_letter' | 'discharge_summary' | 'other';
  uploadDate: Date;
  uploadedBy: string;
  description?: string;
  fileUrl: string; // In production, this would be a secure URL
}

interface FileUploadSystemProps {
  patient: Patient;
  onFileUploaded?: (file: FileRecord) => void;
}

export function FileUploadSystem({ patient, onFileUploaded }: FileUploadSystemProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<FileRecord['category']>('lab_results');
  const [uploadDescription, setUploadDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await uploadFile(file);
      }
      setShowUploadDialog(false);
      setUploadDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    // In production, you would upload to a secure file storage service
    const fileUrl = URL.createObjectURL(file);
    
    const fileRecord: FileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: patient.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category: uploadCategory,
      uploadDate: new Date(),
      uploadedBy: 'Current User', // In production, get from auth
      description: uploadDescription,
      fileUrl
    };

    setFiles(prev => [fileRecord, ...prev]);
    
    if (onFileUploaded) {
      onFileUploaded(fileRecord);
    }
  };

  const deleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const downloadFile = (file: FileRecord) => {
    if (typeof window === 'undefined') return;
    
    const link = window.document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryBadgeColor = (category: FileRecord['category']) => {
    switch (category) {
      case 'lab_results':
        return 'bg-blue-100 text-blue-800';
      case 'imaging':
        return 'bg-green-100 text-green-800';
      case 'referral_letter':
        return 'bg-purple-100 text-purple-800';
      case 'discharge_summary':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const patientFiles = files.filter(f => f.patientId === patient.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Patient Documents</span>
            <Badge variant="secondary">{patientFiles.length}</Badge>
          </CardTitle>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Patient Documents</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <Label htmlFor="category">Document Category</Label>
                  <select
                    id="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as FileRecord['category'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  >
                    <option value="lab_results">Laboratory Results</option>
                    <option value="imaging">Medical Imaging</option>
                    <option value="referral_letter">Referral Letter</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief description of the document..."
                    className="mt-1"
                  />
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {dragActive 
                      ? 'Drop files here...' 
                      : 'Click to upload or drag and drop'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, images, Word documents up to 10MB
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    className="hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Select Files</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {patientFiles.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
            <p className="text-gray-500 mb-4">
              Upload lab results, imaging reports, and other medical documents
            </p>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload First Document</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {patientFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.fileType)}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{file.fileName}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{file.uploadedBy}</span>
                      </div>
                    </div>
                    
                    {file.description && (
                      <p className="text-xs text-gray-500 mt-1">{file.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getCategoryBadgeColor(file.category)}`}>
                    {file.category.replace('_', ' ')}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFile(file.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}