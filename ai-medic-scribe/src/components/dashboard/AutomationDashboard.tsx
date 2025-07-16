"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Clock, 
  Mail, 
  MessageSquare, 
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { automationService, AutomationWorkflow, AutomationEvent, N8nConfig } from "@/utils/automationIntegration";
import { Patient } from "@/types";

interface AutomationDashboardProps {
  patients: Patient[];
}

export function AutomationDashboard({ patients }: AutomationDashboardProps) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [config, setConfig] = useState<N8nConfig>({ webhookUrl: '', enabled: false });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWorkflows(automationService.getWorkflows());
    setEvents(automationService.getEvents());
    setConfig(automationService.getConfig());
  };

  const handleConfigSave = () => {
    automationService.updateConfig(config);
    setShowConfig(false);
  };

  const toggleWorkflow = (id: string, enabled: boolean) => {
    automationService.updateWorkflow(id, { enabled });
    loadData();
  };

  const getEventStatusIcon = (status: AutomationEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'executing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getWorkflowIcon = (type: AutomationWorkflow['type']) => {
    switch (type) {
      case 'patient_reminder':
        return <Bell className="w-4 h-4 text-orange-500" />;
      case 'follow_up':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'document_due':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'appointment_confirmation':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Zap className="w-4 h-4 text-purple-500" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email':
        return <Mail className="w-3 h-3 text-blue-500" />;
      case 'send_sms':
        return <MessageSquare className="w-3 h-3 text-green-500" />;
      case 'notify_doctor':
        return <Bell className="w-3 h-3 text-orange-500" />;
      default:
        return <Zap className="w-3 h-3 text-gray-500" />;
    }
  };

  const recentEvents = events.slice(0, 10);
  const activeWorkflows = workflows.filter(w => w.enabled);
  const pendingEvents = events.filter(e => e.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Automation Dashboard</h1>
          <p className="text-gray-600">Manage patient reminders and workflow automation</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configure n8n</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>n8n Integration Settings</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">n8n Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your n8n webhook endpoint for automation triggers
                  </p>
                </div>

                <div>
                  <Label htmlFor="api-key">API Key (Optional)</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Bearer token for authentication"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="automation-enabled"
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="automation-enabled">Enable Automation</Label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setShowConfig(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfigSave}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-3xl font-semibold text-gray-900">{activeWorkflows.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Events</p>
                <p className="text-3xl font-semibold text-gray-900">{pendingEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-semibold text-gray-900">{patients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integration Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {config.enabled ? 'Connected' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Automation Workflows</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows configured</h3>
              <p className="text-gray-500 mb-4">Create your first automation workflow</p>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map(workflow => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getWorkflowIcon(workflow.type)}
                    <div>
                      <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600 capitalize">{workflow.type.replace('_', ' ')}</p>
                        <div className="flex items-center space-x-1">
                          {workflow.config.actions.map((action, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              {getActionIcon(action.type)}
                              <span className="text-xs text-gray-500">{action.type.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={workflow.enabled ? "default" : "secondary"}>
                      {workflow.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                      className="flex items-center space-x-1"
                    >
                      {workflow.enabled ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Automation Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent events</h3>
              <p className="text-gray-500">Automation events will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map(event => {
                const patient = patients.find(p => p.id === event.patientId);
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getEventStatusIcon(event.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {patient ? `${patient.name} ${patient.surname}` : 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {event.eventType.replace('_', ' ')} • {event.scheduledFor.toLocaleDateString()}
                        </p>
                        {event.lastError && (
                          <p className="text-xs text-red-600 mt-1">{event.lastError}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        event.status === 'completed' ? 'default' :
                        event.status === 'failed' ? 'destructive' :
                        event.status === 'executing' ? 'secondary' : 'outline'
                      }>
                        {event.status}
                      </Badge>
                      
                      {event.attempts > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Attempt {event.attempts}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}