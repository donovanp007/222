"use client";

import React, { useState } from "react";
import { User, Phone, Calendar, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Patient } from "@/types";

interface EditPatientModalProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated: (patient: Patient) => void;
}

export function EditPatientModal({ patient, open, onOpenChange, onPatientUpdated }: EditPatientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    age: "",
    contact: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when patient changes
  React.useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        surname: patient.surname || "",
        age: patient.age?.toString() || "",
        contact: patient.contact || "",
        notes: "", // Notes are not part of the Patient type currently
      });
    }
  }, [patient]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient || !formData.name.trim() || !formData.age.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedPatient: Patient = {
      ...patient,
      name: formData.name.trim(),
      surname: formData.surname.trim() || formData.name.trim(),
      age: parseInt(formData.age),
      contact: formData.contact.trim() || undefined,
    };

    onPatientUpdated(updatedPatient);
    
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const isFormValid = formData.name.trim() && formData.age.trim() && !isNaN(Number(formData.age));

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit className="w-4 h-4 text-blue-600" />
            </div>
            Edit Patient
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              First Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter patient's first name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Surname Field */}
          <div className="space-y-2">
            <Label htmlFor="surname" className="text-sm font-medium text-gray-700">
              Surname
            </Label>
            <Input
              id="surname"
              type="text"
              placeholder="Enter patient's surname"
              value={formData.surname}
              onChange={(e) => handleInputChange("surname", e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Age Field */}
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-gray-700">
              Age *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="age"
                type="number"
                placeholder="0"
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Contact Field */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm font-medium text-gray-700">
              Contact Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="contact"
                type="tel"
                placeholder="+27 82 123 4567"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Patient"
              )}
            </Button>
          </div>
        </form>

        {/* Required fields note */}
        <p className="text-xs text-gray-500 mt-4">
          * Required fields
        </p>
      </DialogContent>
    </Dialog>
  );
}