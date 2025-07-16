"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, Send, Save, Calendar, Paperclip, Eye, 
  Settings, FileText as TemplateIcon, User, Clock,
  AlertTriangle, CheckCircle, Copy, Trash2,
  FileText, Image as ImageIcon, Video, Mic,
  Shield, Globe, Star, MoreVertical
} from 'lucide-react';
import { Patient } from '@/types';
import { MedicalFile } from '@/utils/fileManager';
import { 
  emailService, 
  EmailTemplate, 
  EmailMessage, 
  EmailVariable,
  validateEmailAddress,
  formatEmailPreview,
  calculateEmailPriority
} from '@/utils/emailService';

interface EmailComposerProps {
  patient?: Patient;
  initialTemplate?: string;
  attachedFiles?: MedicalFile[];
  onSend?: (message: EmailMessage) => void;
  onSave?: (message: EmailMessage) => void;
  onClose?: () => void;
}

export function EmailComposer({ 
  patient, 
  initialTemplate, 
  attachedFiles = [], 
  onSend, 
  onSave, 
  onClose 
}: EmailComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [message, setMessage] = useState<EmailMessage | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [customRecipients, setCustomRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTab, setSelectedTab] = useState('compose');
  const [emailError, setEmailError] = useState<string | null>(null);

  const templates = emailService.getTemplates();

  useEffect(() => {
    if (initialTemplate) {
      const template = emailService.getTemplate(initialTemplate);
      if (template) {
        setSelectedTemplate(template);
        initializeTemplateVariables(template);
      }
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (selectedTemplate && patient) {
      composeMessage();
    }
  }, [selectedTemplate, templateVariables]);

  const initializeTemplateVariables = (template: EmailTemplate) => {
    const variables: Record<string, string> = {};
    template.variables.forEach(variable => {
      variables[variable.key] = variable.defaultValue || '';
    });
    setTemplateVariables(variables);
  };

  const composeMessage = () => {
    if (!selectedTemplate || !patient) return;

    try {
      const newMessage = emailService.composeMessage(
        selectedTemplate.id,
        patient,
        templateVariables,
        {
          to: [...(patient.contact ? [patient.contact] : []), ...customRecipients],
          priority: calculateEmailPriority(selectedTemplate.category),
          securityLevel: selectedTemplate.category === 'results' ? 'encrypted' : 'standard'
        }
      );

      // Add file attachments
      attachedFiles.forEach(file => {
        emailService.addAttachment(newMessage.id, file);
      });

      setMessage(newMessage);
      setEmailError(null);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to compose message');
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    initializeTemplateVariables(template);
  };

  const updateVariable = (key: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addRecipient = () => {
    if (newRecipient && validateEmailAddress(newRecipient)) {
      setCustomRecipients(prev => [...prev, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setCustomRecipients(prev => prev.filter(r => r !== email));
  };

  const handleSend = async () => {
    if (!message) return;

    setIsSending(true);
    try {
      const success = await emailService.sendMessage(message.id);
      if (success) {
        onSend?.(message);
        onClose?.();
      } else {
        setEmailError('Failed to send email. Please try again.');
      }
    } catch (error) {
      setEmailError('Error sending email. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = () => {
    if (!message) return;
    
    emailService.saveMessage(message);
    onSave?.(message);
  };

  const handleSchedule = () => {
    if (!message || !scheduledDate || !scheduledTime) return;

    const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const success = emailService.scheduleMessage(message.id, scheduleDateTime);
    
    if (success) {
      setShowSchedule(false);
      onSave?.(message);
    }
  };

  const getAttachmentIcon = (file: MedicalFile) => {
    switch (file.type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'appointment': return '📅';
      case 'follow-up': return '🔄';
      case 'results': return '🧪';
      case 'referral': return '📄';
      case 'emergency': return '🚨';
      default: return '📧';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Composer
            {patient && (
              <Badge variant="outline" className="ml-2">
                {patient.name}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {message && (
              <Badge className={`text-xs ${
                message.securityLevel === 'encrypted' ? 'bg-green-600' : 
                message.securityLevel === 'confidential' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                <Shield className="w-3 h-3 mr-1" />
                {message.securityLevel}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-6">
            {/* Template Selection */}
            {!selectedTemplate && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <TemplateIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                  <p className="text-gray-500 mb-4">Choose an email template to get started</p>
                  <Button onClick={() => setSelectedTab('templates')}>
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedTemplate && (
              <div className="space-y-6">
                {/* Selected Template Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTemplateIcon(selectedTemplate.category)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{selectedTemplate.category}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Change Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipients */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recipients</h4>
                  <div className="space-y-2">
                    {patient?.contact && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{patient.name}</span>
                        <Badge variant="outline" className="text-xs">{patient.contact}</Badge>
                        <Badge className="text-xs bg-green-100 text-green-800">Primary</Badge>
                      </div>
                    )}
                    
                    {customRecipients.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeRecipient(email)}
                          className="w-6 h-6 p-0 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add recipient email..."
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                        className="flex-1"
                      />
                      <Button onClick={addRecipient} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Template Variables */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Template Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.key} className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          {variable.label}
                          {variable.required && <span className="text-red-500">*</span>}
                        </label>
                        {variable.type === 'select' ? (
                          <select
                            value={templateVariables[variable.key] || ''}
                            onChange={(e) => updateVariable(variable.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select {variable.label}</option>
                            {variable.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : variable.type === 'date' ? (
                          <Input
                            type="date"
                            value={templateVariables[variable.key] || ''}
                            onChange={(e) => updateVariable(variable.key, e.target.value)}
                          />
                        ) : (
                          <Textarea
                            placeholder={variable.description || `Enter ${variable.label}`}
                            value={templateVariables[variable.key] || ''}
                            onChange={(e) => updateVariable(variable.key, e.target.value)}
                            rows={variable.key.includes('Content') || variable.key.includes('Instructions') ? 4 : 2}
                          />
                        )}
                        {variable.description && (
                          <p className="text-xs text-gray-500">{variable.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {emailError && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{emailError}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowPreview(true)}
                      variant="outline"
                      disabled={!message}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="outline"
                      disabled={!message}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => setShowSchedule(true)}
                      variant="outline"
                      disabled={!message}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSend}
                    disabled={!message || isSending || !message.to.length}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isSending ? 'Sending...' : 'Send Email'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-blue-500 border-blue-200'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTemplateIcon(template.category)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-600 capitalize mb-2">{template.category}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {template.body.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                      {template.isDefault && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{template.variables.length} variables</span>
                        <span>{template.usage.totalSent} sent</span>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {message ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Email Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${
                        message.priority === 'urgent' ? 'bg-red-600' :
                        message.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'
                      }`}>
                        {message.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">To:</span>
                      <span className="text-sm text-gray-900">{message.to.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Subject:</span>
                      <span className="text-sm text-gray-900">{message.subject}</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                      {message.body}
                    </pre>
                  </div>
                  
                  {message.attachments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Attachments</h5>
                      <div className="space-y-1">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 text-sm">
                            <Paperclip className="w-3 h-3 text-gray-400" />
                            <span>{attachment.name}</span>
                            <span className="text-gray-500">
                              ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
                  <p className="text-gray-500">Compose an email to see the preview</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Email Attachments</h4>
              <Badge variant="outline" className="text-xs">
                {attachedFiles.length} files
              </Badge>
            </div>
            
            {attachedFiles.length > 0 ? (
              <div className="space-y-3">
                {attachedFiles.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getAttachmentIcon(file)}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{file.name}</h5>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <span className="capitalize">{file.type}</span>
                            <Badge className={`text-xs ${
                              file.category === 'clinical-photo' ? 'bg-blue-100 text-blue-800' :
                              file.category === 'lab-result' ? 'bg-green-100 text-green-800' :
                              file.category === 'prescription' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {file.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.isEncrypted && (
                            <Shield className="w-4 h-4 text-green-600" />
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Attachments</h3>
                  <p className="text-gray-500">Files will appear here when attached</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Schedule Dialog */}
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSchedule(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSchedule}>
                  Schedule Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}