"use client";

import { useState, useEffect } from "react";
import { Patient } from "@/types";

// Mock data for initial patients
const initialPatients: Patient[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    age: 45,
    contact: "+27 82 123 4567",
    createdAt: new Date("2024-01-15"),
    lastVisit: new Date("2024-07-10"),
    sessionCount: 12,
  },
  {
    id: "2", 
    name: "Michael Thompson",
    age: 68,
    contact: "+27 83 987 6543",
    createdAt: new Date("2024-02-20"),
    lastVisit: new Date("2024-07-08"),
    sessionCount: 8,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    age: 32,
    contact: "+27 84 555 0123",
    createdAt: new Date("2024-03-10"),
    lastVisit: new Date("2024-07-05"),
    sessionCount: 15,
  },
  {
    id: "4",
    name: "David Chen",
    age: 55,
    contact: "+27 85 777 8888",
    createdAt: new Date("2024-01-08"),
    lastVisit: new Date("2024-06-30"),
    sessionCount: 6,
  },
];

const STORAGE_KEY = "ai-medic-scribe-patients";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load patients from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPatients = JSON.parse(stored);
        // Convert date strings back to Date objects
        const patientsWithDates = parsedPatients.map((patient: Patient & { createdAt: string; lastVisit?: string }) => ({
          ...patient,
          createdAt: new Date(patient.createdAt),
          lastVisit: patient.lastVisit ? new Date(patient.lastVisit) : undefined,
        }));
        setPatients(patientsWithDates);
      } else {
        // First time - use initial mock data
        setPatients(initialPatients);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPatients));
      }
    } catch (error) {
      console.error("Error loading patients from localStorage:", error);
      setPatients(initialPatients);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save patients to localStorage whenever patients change
  useEffect(() => {
    if (!isLoading && patients.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      } catch (error) {
        console.error("Error saving patients to localStorage:", error);
      }
    }
  }, [patients, isLoading]);

  const addPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev =>
      prev.map(patient =>
        patient.id === id ? { ...patient, ...updates } : patient
      )
    );
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  };

  const getPatientById = (id: string) => {
    return patients.find(patient => patient.id === id);
  };

  const searchPatients = (searchTerm: string) => {
    if (!searchTerm.trim()) return patients;
    
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.contact && patient.contact.includes(searchTerm))
    );
  };

  const getTotalSessions = () => {
    return patients.reduce((total, patient) => total + patient.sessionCount, 0);
  };

  const getTodaySessions = () => {
    // For now, return 0 since we don't have session data yet
    // This will be updated when we implement the transcription feature
    return 0;
  };

  return {
    patients,
    isLoading,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    searchPatients,
    getTotalSessions,
    getTodaySessions,
  };
}