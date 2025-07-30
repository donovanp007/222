"use client";

import { AlertTriangle, CheckCircle, Clock, Calendar, TrendingUp, Activity, Bell, FileText, Target } from "lucide-react";
import { TaskProgress } from "@/components/ui/compact-progress";
import AIStatusMonitor from "../status/AIStatusMonitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Patient, Session, TaskSuggestion } from "@/types";

interface MiniDashboardProps {
  patient: Patient;
  sessions: Session[];
  tasks: TaskSuggestion[];
  onMarkTaskComplete: (taskId: string) => void;
  onViewAllTasks: () => void;
  nextAppointment?: Date;
  patientStatus: {
    status: 'stable' | 'monitoring' | 'critical' | 'discharged' | 'follow-up-needed';
    lastUpdate: string;
  };
}

export function MiniDashboard({ 
  patient, 
  sessions, 
  tasks, 
  onMarkTaskComplete, 
  onViewAllTasks,
  nextAppointment,
  patientStatus
}: MiniDashboardProps) {
  const outstandingTasks = tasks.filter(task => !task.isCompleted);
  const overdueTasks = outstandingTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date()
  );
  const completedTasks = tasks.filter(task => task.isCompleted);
  const taskCompletion = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'monitoring': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'follow-up-needed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgentTasks = () => {
    return outstandingTasks
      .filter(task => task.priority === 'urgent' || task.priority === 'high')
      .slice(0, 3);
  };

  const getDaysUntilAppointment = () => {
    if (!nextAppointment) return null;
    const today = new Date();
    const diffTime = new Date(nextAppointment).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const daysUntilAppointment = getDaysUntilAppointment();

  return (
    <div className="space-y-4">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Patient Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600">Status</p>
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(patientStatus.status)}`}>
                  {patientStatus.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Tasks */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-orange-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600">Tasks</p>
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-bold text-gray-900">{outstandingTasks.length}</span>
                  {overdueTasks.length > 0 && (
                    <Badge variant="destructive" className="text-xs px-1">
                      {overdueTasks.length} overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600">Sessions</p>
                <span className="text-lg font-bold text-gray-900">{sessions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600">Next Visit</p>
                {nextAppointment ? (
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      {daysUntilAppointment !== null && daysUntilAppointment >= 0 
                        ? `${daysUntilAppointment}d` 
                        : 'Overdue'}
                    </span>
                    <p className="text-xs text-gray-500">{formatDate(nextAppointment)}</p>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">None scheduled</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Progress - Compact Design */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <TaskProgress
            completed={completedTasks.length}
            total={tasks.length}
            urgent={getUrgentTasks().length}
            className="flex-1 mr-3"
          />
          <Button variant="ghost" size="sm" onClick={onViewAllTasks} className="text-xs h-8 px-3 shrink-0">
            View All
          </Button>
        </div>
        
        {/* Urgent Tasks Preview - Compact */}
        {getUrgentTasks().length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Urgent Tasks</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getUrgentTasks().length}
                </Badge>
              </div>
              <div className="space-y-1">
                {getUrgentTasks().slice(0, 2).map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-2 rounded border transition-all duration-200 ${
                      task.isCompleted 
                        ? 'bg-green-50 border-green-200 opacity-75' 
                        : 'bg-white border-orange-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        task.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                      }`}>
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={task.isCompleted ? 'default' : 'destructive'} 
                          className="text-xs px-1"
                        >
                          {task.isCompleted ? 'completed' : task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMarkTaskComplete(task.id)}
                      className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                      disabled={task.isCompleted}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {getUrgentTasks().length > 2 && (
                  <div className="text-xs text-orange-600 mt-2">
                    +{getUrgentTasks().length - 2} more urgent tasks
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.slice(0, 2).map((session, index) => (
              <div 
                key={session.id} 
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-sm group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate transition-colors duration-300 group-hover:text-blue-700">{session.title}</p>
                  <p className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-blue-600">{formatDate(session.visitDate)}</p>
                </div>
                <Badge variant="outline" className="text-xs transition-all duration-300 group-hover:border-blue-400 group-hover:text-blue-700">
                  {session.consultationType}
                </Badge>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-blue-400 hover:bg-blue-50">
              Schedule Follow-up
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-green-400 hover:bg-green-50">
              Add Note
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-orange-400 hover:bg-orange-50">
              Update Status
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-purple-400 hover:bg-purple-50" onClick={onViewAllTasks}>
              Manage Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Status Monitor */}
      <AIStatusMonitor
        patient={patient}
        consultations={sessions}
        onStatusUpdate={(assessment) => {
          console.log('Status assessment updated:', assessment);
        }}
      />
    </div>
  );
}