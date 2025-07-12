"use client";

import { useState, useEffect } from "react";
import { Doctor } from "@/types";

// Mock data for initial doctors
const initialDoctors: Doctor[] = [
  {
    id: "dr_001",
    name: "Dr. Sarah Naidoo",
    specialty: "General Practice",
    email: "sarah.naidoo@practice.co.za",
    role: "primary"
  },
  {
    id: "dr_002", 
    name: "Dr. Michael van der Merwe",
    specialty: "Cardiology",
    email: "michael.vdm@cardiocenter.co.za",
    role: "specialist"
  },
  {
    id: "dr_003",
    name: "Dr. Priya Patel",
    specialty: "Radiology", 
    email: "priya.patel@imaging.co.za",
    role: "specialist"
  },
  {
    id: "dr_004",
    name: "Dr. Johan Botha",
    specialty: "Ultrasound/Echocardiography",
    email: "johan.botha@echo.co.za", 
    role: "specialist"
  }
];

const DOCTORS_STORAGE_KEY = "ai-medic-scribe-doctors";

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load doctors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DOCTORS_STORAGE_KEY);
      if (stored) {
        const parsedDoctors = JSON.parse(stored);
        setDoctors(parsedDoctors);
      } else {
        // First time - use initial mock data
        setDoctors(initialDoctors);
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(initialDoctors));
      }

      // Set current doctor (in real app, this would come from auth)
      const currentDoctorId = localStorage.getItem("current-doctor-id") || "dr_001";
      const current = initialDoctors.find(d => d.id === currentDoctorId) || initialDoctors[0];
      setCurrentDoctor(current);
    } catch (error) {
      console.error("Error loading doctors from localStorage:", error);
      setDoctors(initialDoctors);
      setCurrentDoctor(initialDoctors[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save doctors to localStorage whenever doctors change
  useEffect(() => {
    if (!isLoading && doctors.length > 0) {
      try {
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(doctors));
      } catch (error) {
        console.error("Error saving doctors to localStorage:", error);
      }
    }
  }, [doctors, isLoading]);

  const addDoctor = (newDoctor: Doctor) => {
    setDoctors(prev => [newDoctor, ...prev]);
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setDoctors(prev =>
      prev.map(doctor =>
        doctor.id === id ? { ...doctor, ...updates } : doctor
      )
    );

    // Update current doctor if it's the one being updated
    if (currentDoctor?.id === id) {
      setCurrentDoctor(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(doctor => doctor.id !== id));
    
    // Clear current doctor if it's the one being deleted
    if (currentDoctor?.id === id) {
      setCurrentDoctor(doctors.find(d => d.id !== id) || null);
    }
  };

  const getDoctorById = (id: string) => {
    return doctors.find(doctor => doctor.id === id);
  };

  const getDoctorsBySpecialty = (specialty: string) => {
    return doctors.filter(doctor => 
      doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  };

  const switchCurrentDoctor = (doctorId: string) => {
    const doctor = getDoctorById(doctorId);
    if (doctor) {
      setCurrentDoctor(doctor);
      localStorage.setItem("current-doctor-id", doctorId);
    }
  };

  const getCollaboratingDoctors = (patientAssignedDoctors: string[]) => {
    return doctors.filter(doctor => 
      patientAssignedDoctors.includes(doctor.id)
    );
  };

  const searchDoctors = (query: string) => {
    if (!query.trim()) return doctors;
    
    const queryLower = query.toLowerCase();
    return doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(queryLower) ||
      doctor.specialty.toLowerCase().includes(queryLower) ||
      doctor.email.toLowerCase().includes(queryLower)
    );
  };

  return {
    doctors,
    currentDoctor,
    isLoading,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorById,
    getDoctorsBySpecialty,
    switchCurrentDoctor,
    getCollaboratingDoctors,
    searchDoctors,
  };
}