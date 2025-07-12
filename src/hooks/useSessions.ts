"use client";

import { useState, useEffect } from "react";
import { Session, TaskSuggestion, ExportRecord } from "@/types";

const SESSIONS_STORAGE_KEY = "ai-medic-scribe-sessions";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsedSessions = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sessionsWithDates = parsedSessions.map((session: Session & { 
          visitDate: string; 
          createdAt: string; 
          updatedAt: string;
          suggestedTasks?: (TaskSuggestion & { createdAt: string; dueDate?: string })[];
          exportHistory?: (ExportRecord & { exportedAt: string })[];
        }) => ({
          ...session,
          visitDate: new Date(session.visitDate),
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          suggestedTasks: session.suggestedTasks?.map(task => ({
            ...task,
            createdAt: new Date(task.createdAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          })),
          exportHistory: session.exportHistory?.map(record => ({
            ...record,
            exportedAt: new Date(record.exportedAt),
          })),
        }));
        setSessions(sessionsWithDates);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions from localStorage:", error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error("Error saving sessions to localStorage:", error);
      }
    }
  }, [sessions, isLoading]);

  const createSession = (sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'isLocked'>) => {
    const newSession: Session = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false, // Initially unlocked for editing
      suggestedTasks: [],
      exportHistory: [],
    };

    setSessions(prev => [newSession, ...prev]);
    return newSession.id;
  };

  const lockSession = (sessionId: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId 
          ? { ...session, isLocked: true, updatedAt: new Date() }
          : session
      )
    );
  };

  const updateSession = (sessionId: string, updates: Partial<Omit<Session, 'id' | 'createdAt' | 'isLocked'>>) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId && !session.isLocked) {
          return { 
            ...session, 
            ...updates, 
            updatedAt: new Date() 
          };
        }
        return session;
      })
    );
  };

  const addTaskSuggestion = (sessionId: string, task: Omit<TaskSuggestion, 'id' | 'createdAt'>) => {
    const newTask: TaskSuggestion = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { 
              ...session, 
              suggestedTasks: [...(session.suggestedTasks || []), newTask],
              updatedAt: new Date()
            }
          : session
      )
    );
  };

  const completeTask = (sessionId: string, taskId: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              suggestedTasks: session.suggestedTasks?.map(task =>
                task.id === taskId ? { ...task, isCompleted: true } : task
              ),
              updatedAt: new Date()
            }
          : session
      )
    );
  };

  const addExportRecord = (sessionId: string, exportRecord: Omit<ExportRecord, 'id' | 'exportedAt'>) => {
    const newRecord: ExportRecord = {
      ...exportRecord,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exportedAt: new Date(),
    };

    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              exportHistory: [...(session.exportHistory || []), newRecord],
              updatedAt: new Date()
            }
          : session
      )
    );
  };

  const getSessionsByPatient = (patientId: string) => {
    return sessions
      .filter(session => session.patientId === patientId)
      .sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());
  };

  const getSessionById = (sessionId: string) => {
    return sessions.find(session => session.id === sessionId);
  };

  const searchSessions = (query: string, patientId?: string) => {
    let filteredSessions = sessions;
    
    if (patientId) {
      filteredSessions = filteredSessions.filter(session => session.patientId === patientId);
    }

    if (!query.trim()) return filteredSessions;

    return filteredSessions.filter(session =>
      session.title.toLowerCase().includes(query.toLowerCase()) ||
      session.content.toLowerCase().includes(query.toLowerCase()) ||
      session.diagnosis?.some(d => d.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  return {
    sessions,
    isLoading,
    createSession,
    lockSession,
    updateSession,
    addTaskSuggestion,
    completeTask,
    addExportRecord,
    getSessionsByPatient,
    getSessionById,
    searchSessions,
    deleteSession,
  };
}