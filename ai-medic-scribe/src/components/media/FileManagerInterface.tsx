"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Folder, Image as ImageIcon, Video, FileText, Mic,
  Search, Grid3X3, List, Upload, Download, Trash2,
  Eye, Edit, Share2, Star, Clock, Filter,
  Camera, FolderPlus, MoreVertical, Tag,
  Calendar, User, FileImage, Play, Volume2
} from 'lucide-react';
import { Patient } from '@/types';
import { 
  fileManager, 
  MedicalFile, 
  FileFolder, 
  FileOrganization 
} from '@/utils/fileManager';
import { CameraInterface } from './CameraInterface';

interface FileManagerInterfaceProps {
  patient?: Patient;
  sessionId?: string;
  compact?: boolean;
}

export function FileManagerInterface({ patient, sessionId, compact = false }: FileManagerInterfaceProps) {
  const [organization, setOrganization] = useState<FileOrganization | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<MedicalFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState('files');

  useEffect(() => {
    loadFileOrganization();
  }, []);

  const loadFileOrganization = () => {
    const org = fileManager.getFileOrganization();
    setOrganization(org);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !patient) return;

    setUploadProgress(0);
    
    try {
      const uploadedFiles = await fileManager.uploadMultipleFiles(
        files,
        patient.id,
        'other',
        sessionId,
        (current, total) => {
          setUploadProgress((current / total) * 100);
        }
      );
      
      loadFileOrganization();
      setUploadProgress(null);
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadProgress(null);
    }
  };

  const getFilteredFiles = (): MedicalFile[] => {
    if (!organization) return [];

    let files: MedicalFile[] = [];

    if (selectedFolder === 'all') {
      files = [
        ...organization.recentFiles,
        ...organization.favoriteFiles,
        ...organization.sharedFiles
      ];
    } else if (selectedFolder === 'recent') {
      files = organization.recentFiles;
    } else if (selectedFolder === 'favorites') {
      files = organization.favoriteFiles;
    } else if (selectedFolder === 'shared') {
      files = organization.sharedFiles;
    } else {
      files = fileManager.getFilesByCategory(selectedFolder as any);
    }

    // Apply patient filter
    if (patient) {
      files = files.filter(file => file.patientId === patient.id);
    }

    // Apply session filter
    if (sessionId) {
      files = files.filter(file => file.sessionId === sessionId);
    }

    // Apply search filter
    if (searchQuery) {
      files = fileManager.searchFiles(searchQuery).filter(file =>
        patient ? file.patientId === patient.id : true
      );
    }

    // Remove duplicates
    return Array.from(new Map(files.map(f => [f.id, f])).values());
  };

  const handleFileDelete = (fileId: string) => {
    fileManager.deleteFile(fileId);
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    loadFileOrganization();
  };

  const handleBulkDelete = () => {
    selectedFiles.forEach(fileId => {
      fileManager.deleteFile(fileId);
    });
    setSelectedFiles(new Set());
    loadFileOrganization();
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const getFileIcon = (file: MedicalFile) => {
    switch (file.type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'clinical-photo': 'bg-blue-100 text-blue-800',
      'lab-result': 'bg-green-100 text-green-800',
      'prescription': 'bg-orange-100 text-orange-800',
      'referral': 'bg-purple-100 text-purple-800',
      'consent': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Files</CardTitle>
            <CameraInterface 
              patient={patient!}
              sessionId={sessionId}
              onCapture={loadFileOrganization}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {getFilteredFiles().slice(0, 8).map((file) => (
              <div
                key={file.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => setPreviewFile(file)}
              >
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {getFilteredFiles().length > 8 && (
            <Button variant="outline" size="sm" className="w-full mt-3">
              View All {getFilteredFiles().length} Files
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            File Manager
            {patient && (
              <Badge variant="outline" className="ml-2">
                {patient.name}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {patient && (
              <CameraInterface 
                patient={patient}
                sessionId={sessionId}
                onCapture={loadFileOrganization}
              />
            )}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedFiles.size})
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Files Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getFilteredFiles().map((file) => (
                  <div
                    key={file.id}
                    className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="aspect-square">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          {getFileIcon(file)}
                        </div>
                      )}
                    </div>
                    
                    {/* File Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                          {file.category}
                        </Badge>
                        <span className="text-xs">{formatFileSize(file.size)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="w-6 h-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileDelete(file.id);
                          }}
                          className="w-6 h-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* File Type Indicator */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {file.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {getFilteredFiles().map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                          {file.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.uploadDate.toLocaleDateString()}</span>
                        {file.metadata.aiAnalysis && (
                          <Badge variant="outline" className="text-xs">
                            AI Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(file);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.name;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(file.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getFilteredFiles().length === 0 && (
              <div className="text-center py-12">
                <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload files or capture photos to get started'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="folders" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {organization?.folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setSelectedTab('files');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div 
                      className="w-16 h-16 rounded-lg mx-auto mb-3 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: folder.color + '20' }}
                    >
                      {folder.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{folder.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{folder.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {folder.fileCount} files
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-3">
              {organization?.recentFiles.slice(0, 10).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:border-gray-300 cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.uploadDate.toLocaleString()}
                    </p>
                  </div>
                  
                  <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                    {file.category}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* File Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            {previewFile && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getFileIcon(previewFile)}
                    {previewFile.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* File Preview */}
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    {previewFile.type === 'image' ? (
                      <img
                        src={previewFile.url}
                        alt={previewFile.name}
                        className="max-w-full max-h-96 mx-auto rounded"
                      />
                    ) : previewFile.type === 'video' ? (
                      <video
                        src={previewFile.url}
                        controls
                        className="max-w-full max-h-96 mx-auto rounded"
                      />
                    ) : previewFile.type === 'audio' ? (
                      <div className="py-8">
                        <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <audio src={previewFile.url} controls className="mx-auto" />
                      </div>
                    ) : (
                      <div className="py-8">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Preview not available for this file type</p>
                      </div>
                    )}
                  </div>
                  
                  {/* File Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Size:</span> {formatFileSize(previewFile.size)}</p>
                        <p><span className="text-gray-500">Type:</span> {previewFile.type}</p>
                        <p><span className="text-gray-500">Category:</span> {previewFile.category}</p>
                        <p><span className="text-gray-500">Upload Date:</span> {previewFile.uploadDate.toLocaleString()}</p>
                        {previewFile.captureDate && (
                          <p><span className="text-gray-500">Capture Date:</span> {previewFile.captureDate.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                      <div className="space-y-1">
                        {previewFile.metadata.width && previewFile.metadata.height && (
                          <p><span className="text-gray-500">Dimensions:</span> {previewFile.metadata.width} × {previewFile.metadata.height}</p>
                        )}
                        {previewFile.metadata.duration && (
                          <p><span className="text-gray-500">Duration:</span> {Math.round(previewFile.metadata.duration)}s</p>
                        )}
                        <p><span className="text-gray-500">Access Level:</span> {previewFile.accessLevel}</p>
                        <p><span className="text-gray-500">Encrypted:</span> {previewFile.isEncrypted ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Analysis */}
                  {previewFile.metadata.aiAnalysis && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          Confidence: {Math.round(previewFile.metadata.aiAnalysis.confidence * 100)}%
                        </p>
                        <div className="space-y-1">
                          {previewFile.metadata.aiAnalysis.findings.map((finding, index) => (
                            <p key={index} className="text-sm text-blue-700">• {finding}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewFile.url;
                        link.download = previewFile.name;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleFileDelete(previewFile.id);
                        setPreviewFile(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}