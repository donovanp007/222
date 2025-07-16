"use client";

import { useState, useEffect } from "react";
import { Consultation, TaskSuggestion, ExportRecord } from "@/types";

const CONSULTATIONS_STORAGE_KEY = "ai-medic-scribe-consultations";

export function useConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load consultations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSULTATIONS_STORAGE_KEY);
      if (stored) {
        const parsedConsultations = JSON.parse(stored);
        // Convert date strings back to Date objects
        const consultationsWithDates = parsedConsultations.map((consultation: Consultation & { 
          visitDate: string; 
          createdAt: string; 
          updatedAt: string;
          suggestedTasks?: (TaskSuggestion & { createdAt: string; dueDate?: string })[];
          exportHistory?: (ExportRecord & { exportedAt: string })[];
        }) => ({
          ...consultation,
          visitDate: new Date(consultation.visitDate),
          createdAt: new Date(consultation.createdAt),
          updatedAt: new Date(consultation.updatedAt),
          suggestedTasks: consultation.suggestedTasks?.map(task => ({
            ...task,
            createdAt: new Date(task.createdAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          })),
          exportHistory: consultation.exportHistory?.map(record => ({
            ...record,
            exportedAt: new Date(record.exportedAt),
          })),
        }));
        setConsultations(consultationsWithDates);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error("Error loading consultations from localStorage:", error);
      setConsultations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save consultations to localStorage whenever consultations change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(consultations));
      } catch (error) {
        console.error("Error saving consultations to localStorage:", error);
      }
    }
  }, [consultations, isLoading]);

  const createConsultation = (consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'isLocked'>) => {
    const newConsultation: Consultation = {
      ...consultationData,
      id: `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false, // Initially unlocked for editing
      suggestedTasks: [],
      exportHistory: [],
    };

    setConsultations(prev => [newConsultation, ...prev]);
    return newConsultation.id;
  };

  const lockConsultation = (consultationId: string) => {
    setConsultations(prev =>
      prev.map(consultation =>
        consultation.id === consultationId 
          ? { ...consultation, isLocked: true, updatedAt: new Date() }
          : consultation
      )
    );
  };

  const updateConsultation = (consultationId: string, updates: Partial<Omit<Consultation, 'id' | 'createdAt' | 'isLocked'>>) => {
    setConsultations(prev =>
      prev.map(consultation => {
        if (consultation.id === consultationId && !consultation.isLocked) {
          return { 
            ...consultation, 
            ...updates, 
            updatedAt: new Date() 
          };
        }
        return consultation;
      })
    );
  };

  const addTaskSuggestion = (consultationId: string, task: Omit<TaskSuggestion, 'id' | 'createdAt'>) => {
    const newTask: TaskSuggestion = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setConsultations(prev =>
      prev.map(consultation =>
        consultation.id === consultationId
          ? { 
              ...consultation, 
              suggestedTasks: [...(consultation.suggestedTasks || []), newTask],
              updatedAt: new Date()
            }
          : consultation
      )
    );
  };

  const completeTask = (consultationId: string, taskId: string) => {
    setConsultations(prev =>
      prev.map(consultation =>
        consultation.id === consultationId
          ? {
              ...consultation,
              suggestedTasks: consultation.suggestedTasks?.map(task =>
                task.id === taskId ? { ...task, isCompleted: true } : task
              ),
              updatedAt: new Date()
            }
          : consultation
      )
    );
  };

  const addExportRecord = (consultationId: string, exportRecord: Omit<ExportRecord, 'id' | 'exportedAt'>) => {
    const newRecord: ExportRecord = {
      ...exportRecord,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exportedAt: new Date(),
    };

    setConsultations(prev =>
      prev.map(consultation =>
        consultation.id === consultationId
          ? {
              ...consultation,
              exportHistory: [...(consultation.exportHistory || []), newRecord],
              updatedAt: new Date()
            }
          : consultation
      )
    );
  };

  const getConsultationsByPatient = (patientId: string) => {
    return consultations
      .filter(consultation => consultation.patientId === patientId)
      .sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());
  };

  const getConsultationById = (consultationId: string) => {
    return consultations.find(consultation => consultation.id === consultationId);
  };

  const searchConsultations = (query: string, patientId?: string) => {
    let filteredConsultations = consultations;
    
    if (patientId) {
      filteredConsultations = filteredConsultations.filter(consultation => consultation.patientId === patientId);
    }

    if (!query.trim()) return filteredConsultations;

    return filteredConsultations.filter(consultation =>
      consultation.title.toLowerCase().includes(query.toLowerCase()) ||
      consultation.content.toLowerCase().includes(query.toLowerCase()) ||
      consultation.diagnosis?.some(d => d.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const deleteConsultation = (consultationId: string) => {
    setConsultations(prev => prev.filter(consultation => consultation.id !== consultationId));
  };

  // Legacy aliases for backward compatibility
  const sessions = consultations;
  const createSession = createConsultation;
  const lockSession = lockConsultation;
  const updateSession = updateConsultation;
  const getSessionsByPatient = getConsultationsByPatient;
  const getSessionById = getConsultationById;
  const searchSessions = searchConsultations;
  const deleteSession = deleteConsultation;

  return {
    // New consultation-based interface
    consultations,
    isLoading,
    createConsultation,
    lockConsultation,
    updateConsultation,
    addTaskSuggestion,
    completeTask,
    addExportRecord,
    getConsultationsByPatient,
    getConsultationById,
    searchConsultations,
    deleteConsultation,
    
    // Legacy session-based interface for backward compatibility
    sessions,
    createSession,
    lockSession,
    updateSession,
    getSessionsByPatient,
    getSessionById,
    searchSessions,
    deleteSession,
  };
}

// Legacy alias
export const useSessions = useConsultations;