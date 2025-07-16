"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, Inbox, Send, Archive, Trash2, Search, 
  Filter, RotateCcw as Refresh, MoreVertical, Reply, Forward,
  Star, Clock, Calendar, Paperclip, Shield, 
  User, CheckCircle, AlertCircle, Eye, Edit
} from 'lucide-react';
import { Patient } from '@/types';
import { 
  emailService, 
  EmailMessage, 
  validateEmailAddress,
  formatEmailPreview
} from '@/utils/emailService';
import { EmailComposer } from './EmailComposer';

interface EmailInboxProps {
  patient?: Patient;
  onSelectMessage?: (message: EmailMessage) => void;
}

export function EmailInbox({ patient, onSelectMessage }: EmailInboxProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'draft' | 'scheduled' | 'failed'>('all');
  const [selectedTab, setSelectedTab] = useState('inbox');
  const [showComposer, setShowComposer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMessages();
  }, [patient]);

  const loadMessages = () => {
    let allMessages = emailService.getMessages();
    
    // Filter by patient if specified
    if (patient) {
      allMessages = emailService.getMessagesByPatient(patient.id);
    }
    
    setMessages(allMessages);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadMessages();
    setIsRefreshing(false);
  };

  const getFilteredMessages = (): EmailMessage[] => {
    let filtered = messages;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(query) ||
        msg.body.toLowerCase().includes(query) ||
        msg.to.some(email => email.toLowerCase().includes(query))
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const handleMessageSelect = (message: EmailMessage) => {
    setSelectedMessage(message);
    onSelectMessage?.(message);
  };

  const handleBulkAction = (action: 'delete' | 'archive') => {
    selectedMessages.forEach(messageId => {
      const message = emailService.getMessage(messageId);
      if (message) {
        if (action === 'delete') {
          // In a real implementation, this would delete the message
          console.log('Deleting message:', messageId);
        } else if (action === 'archive') {
          // In a real implementation, this would archive the message
          console.log('Archiving message:', messageId);
        }
      }
    });
    setSelectedMessages(new Set());
    loadMessages();
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (message: EmailMessage) => {
    switch (message.status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'sending': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <Edit className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'normal': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-ZA', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Message List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Email Inbox
                {patient && (
                  <Badge variant="outline" className="ml-2">
                    {patient.name}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Refresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowComposer(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Compose
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="draft">Drafts</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="failed">Failed</option>
                </select>
                
                {selectedMessages.size > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('archive')}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 pb-2 border-b">
              <span>{getFilteredMessages().length} messages</span>
              <span>{getFilteredMessages().filter(m => m.status === 'sent').length} sent</span>
              <span>{getFilteredMessages().filter(m => m.status === 'draft').length} drafts</span>
            </div>
            
            {/* Message List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredMessages().map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? 'border-blue-500 bg-blue-50'
                      : selectedMessages.has(message.id)
                      ? 'border-blue-300 bg-blue-25'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleMessageSelect(message)}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(message.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleMessageSelection(message.id);
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message)}
                          <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </Badge>
                          {message.requiresReadReceipt && (
                            <Badge variant="outline" className="text-xs">
                              Read Receipt
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      
                      {/* Recipients */}
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {message.to.slice(0, 2).join(', ')}
                          {message.to.length > 2 && ` +${message.to.length - 2} more`}
                        </span>
                      </div>
                      
                      {/* Subject */}
                      <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                        {message.subject}
                      </h4>
                      
                      {/* Preview */}
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {message.body.substring(0, 100)}...
                      </p>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${
                            message.category === 'appointment' ? 'bg-blue-100 text-blue-800' :
                            message.category === 'results' ? 'bg-green-100 text-green-800' :
                            message.category === 'referral' ? 'bg-purple-100 text-purple-800' :
                            message.category === 'emergency' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.category}
                          </Badge>
                          {message.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {message.attachments.length}
                              </span>
                            </div>
                          )}
                          {message.securityLevel !== 'standard' && (
                            <Shield className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more actions
                          }}
                          className="w-6 h-6 p-0"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredMessages().length === 0 && (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' ? 
                      'Try adjusting your search or filters' : 
                      'Start by composing your first email'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Message Detail */}
      <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedMessage)}
                  <div>
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      To: {selectedMessage.to.join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={`${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </Badge>
                  {selectedMessage.securityLevel !== 'standard' && (
                    <Badge className="bg-green-600">
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedMessage.securityLevel}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline">
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  <Button size="sm" variant="outline">
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Message Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">From:</span>
                  <span className="ml-2 font-medium">
                    {selectedMessage.metadata.practiceInfo.doctorName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{selectedMessage.createdAt.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <Badge className={`ml-2 text-xs ${
                    selectedMessage.category === 'appointment' ? 'bg-blue-100 text-blue-800' :
                    selectedMessage.category === 'results' ? 'bg-green-100 text-green-800' :
                    selectedMessage.category === 'referral' ? 'bg-purple-100 text-purple-800' :
                    selectedMessage.category === 'emergency' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMessage.category}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 capitalize">{selectedMessage.status}</span>
                </div>
              </div>
              
              {/* Message Body */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                  {selectedMessage.body}
                </pre>
              </div>
              
              {/* Attachments */}
              {selectedMessage.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Attachments ({selectedMessage.attachments.length})</h4>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Delivery Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-blue-700">Delivery Status:</span>
                      <span className="ml-2 font-medium capitalize">
                        {selectedMessage.metadata.deliveryTracking.deliveryStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Attempts:</span>
                      <span className="ml-2 font-medium">
                        {selectedMessage.metadata.deliveryTracking.attempts}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Read Status:</span>
                      <span className="ml-2 font-medium capitalize">
                        {selectedMessage.metadata.deliveryTracking.readStatus}
                      </span>
                    </div>
                    {selectedMessage.metadata.deliveryTracking.readDate && (
                      <div>
                        <span className="text-blue-700">Read Date:</span>
                        <span className="ml-2 font-medium">
                          {selectedMessage.metadata.deliveryTracking.readDate.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Compliance Information */}
              {selectedMessage.metadata.complianceFlags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Compliance & Security</h4>
                  <div className="space-y-2">
                    {selectedMessage.metadata.complianceFlags.map((flag, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        flag.status === 'compliant' ? 'bg-green-50 border border-green-200' :
                        flag.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={flag.status === 'compliant' ? 'default' : 'destructive'}>
                            {flag.type}
                          </Badge>
                          <span className={`text-sm font-medium ${
                            flag.status === 'compliant' ? 'text-green-800' :
                            flag.status === 'warning' ? 'text-yellow-800' :
                            'text-red-800'
                          }`}>
                            {flag.status.toUpperCase()}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          flag.status === 'compliant' ? 'text-green-700' :
                          flag.status === 'warning' ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {flag.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Email</h3>
                <p className="text-gray-500">Choose an email from the list to view its details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Email Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <EmailComposer
            patient={patient}
            onSend={(message) => {
              setShowComposer(false);
              loadMessages();
            }}
            onSave={(message) => {
              loadMessages();
            }}
            onClose={() => setShowComposer(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}