"use client";

import { useState, useEffect } from "react";
import { Patient } from "@/types";

// Mock data for initial patients
const initialPatients: Patient[] = [
  {
    id: "1",
    name: "Sarah",
    surname: "Johnson",
    age: 45,
    dateOfBirth: new Date("1979-03-15"),
    contact: "+27 82 123 4567",
    medicalAid: {
      provider: "Discovery Health",
      memberNumber: "12345678901",
      dependentCode: "00"
    },
    idNumber: "7903155678901",
    createdAt: new Date("2024-01-15"),
    lastVisit: new Date("2024-07-10"),
    sessionCount: 12,
    isArchived: false,
    assignedDoctors: ["dr_001"]
  },
  {
    id: "2", 
    name: "Michael",
    surname: "Thompson",
    age: 68,
    dateOfBirth: new Date("1956-05-22"),
    contact: "+27 83 987 6543",
    medicalAid: {
      provider: "Bonitas",
      memberNumber: "98765432109",
      dependentCode: "00"
    },
    createdAt: new Date("2024-02-20"),
    lastVisit: new Date("2024-07-08"),
    sessionCount: 8,
    isArchived: false,
    assignedDoctors: ["dr_001"]
  },
  {
    id: "3",
    name: "Emily",
    surname: "Rodriguez",
    age: 32,
    dateOfBirth: new Date("1992-08-10"),
    contact: "+27 84 555 0123",
    medicalAid: {
      provider: "Momentum Health",
      memberNumber: "55511122233",
      dependentCode: "01"
    },
    createdAt: new Date("2024-03-10"),
    lastVisit: new Date("2024-07-05"),
    sessionCount: 15,
    isArchived: false,
    assignedDoctors: ["dr_001", "dr_002"]
  },
  {
    id: "4",
    name: "David",
    surname: "Chen",
    age: 55,
    dateOfBirth: new Date("1969-11-30"),
    contact: "+27 85 777 8888",
    createdAt: new Date("2024-01-08"),
    lastVisit: new Date("2024-06-30"),
    sessionCount: 6,
    isArchived: false,
    assignedDoctors: ["dr_001"]
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
        const patientsWithDates = parsedPatients.map((patient: Patient & { 
          createdAt: string; 
          lastVisit?: string;
          dateOfBirth?: string;
        }) => ({
          ...patient,
          createdAt: new Date(patient.createdAt),
          lastVisit: patient.lastVisit ? new Date(patient.lastVisit) : undefined,
          dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
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
    if (!searchTerm.trim()) return patients.filter(p => !p.isArchived);
    
    return patients.filter(patient => {
      if (patient.isArchived) return false;
      
      const fullName = `${patient.name} ${patient.surname}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return fullName.includes(searchLower) ||
        (patient.contact && patient.contact.includes(searchTerm)) ||
        (patient.medicalAid?.provider.toLowerCase().includes(searchLower)) ||
        (patient.medicalAid?.memberNumber.includes(searchTerm)) ||
        (patient.idNumber && patient.idNumber.includes(searchTerm));
    });
  };

  const archivePatient = (id: string) => {
    setPatients(prev =>
      prev.map(patient =>
        patient.id === id ? { ...patient, isArchived: true } : patient
      )
    );
  };

  const unarchivePatient = (id: string) => {
    setPatients(prev =>
      prev.map(patient =>
        patient.id === id ? { ...patient, isArchived: false } : patient
      )
    );
  };

  const getArchivedPatients = () => {
    return patients.filter(patient => patient.isArchived);
  };

  const addDoctorToPatient = (patientId: string, doctorId: string) => {
    setPatients(prev =>
      prev.map(patient => {
        if (patient.id === patientId) {
          const assignedDoctors = patient.assignedDoctors || [];
          if (!assignedDoctors.includes(doctorId)) {
            return {
              ...patient,
              assignedDoctors: [...assignedDoctors, doctorId]
            };
          }
        }
        return patient;
      })
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
    patients: patients.filter(p => !p.isArchived),
    allPatients: patients,
    isLoading,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    searchPatients,
    archivePatient,
    unarchivePatient,
    getArchivedPatients,
    addDoctorToPatient,
    getTotalSessions,
    getTodaySessions,
  };
}