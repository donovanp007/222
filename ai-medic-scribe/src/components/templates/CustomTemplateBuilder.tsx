"use client";

import { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, GripVertical, X, Save, Eye, Upload, Download, Wand2, Tag, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateSection, SectionType, Template } from "@/types/template";

interface CustomTemplateBuilderProps {
  onSave?: (template: Template) => void;
  onCancel?: () => void;
  existingTemplate?: Template;
}

interface TemplateBuilderSection extends Omit<TemplateSection, 'id'> {
  id: string;
  autoTags: string[];
  aiEnabled: boolean;
  medicalSpecialty?: string;
}

const SECTION_TYPES: Array<{ value: SectionType; label: string; description: string }> = [
  { value: 'symptoms', label: 'Symptoms', description: 'Patient complaints and symptoms' },
  { value: 'vitals', label: 'Vital Signs', description: 'Blood pressure, heart rate, temperature' },
  { value: 'examination', label: 'Physical Examination', description: 'Clinical examination findings' },
  { value: 'diagnosis', label: 'Diagnosis', description: 'Clinical impressions and diagnoses' },
  { value: 'treatment', label: 'Treatment Plan', description: 'Medications and interventions' },
  { value: 'history', label: 'Medical History', description: 'Past medical and family history' },
  { value: 'plan', label: 'Management Plan', description: 'Follow-up and next steps' },
  { value: 'notes', label: 'General Notes', description: 'Additional clinical notes' }
];

const MEDICAL_SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology', 
  'Gastroenterology', 'Neurology', 'Orthopedics', 'Pediatrics', 
  'Psychiatry', 'Radiology', 'Emergency Medicine', 'Anesthesiology'
];

const SUGGESTED_AUTO_TAGS = {
  symptoms: ['pain', 'headache', 'nausea', 'fever', 'fatigue', 'cough', 'shortness of breath'],
  vitals: ['blood pressure', 'BP', 'heart rate', 'HR', 'temperature', 'weight', 'oxygen saturation'],
  examination: ['inspection', 'palpation', 'auscultation', 'normal', 'abnormal', 'tender'],
  diagnosis: ['diagnosis', 'impression', 'likely', 'possible', 'ruled out', 'differential'],
  treatment: ['prescribe', 'medication', 'mg', 'daily', 'surgery', 'therapy', 'treatment'],
  history: ['history', 'previous', 'family', 'allergies', 'medications', 'surgery'],
  plan: ['follow-up', 'return', 'monitor', 'continue', 'stop', 'adjust', 'referral'],
  notes: ['note', 'comment', 'observation', 'discussion', 'patient education']
};

export function CustomTemplateBuilder({ onSave, onCancel, existingTemplate }: CustomTemplateBuilderProps) {
  const [template, setTemplate] = useState<{
    name: string;
    description: string;
    category: string;
    specialty: string;
    sections: TemplateBuilderSection[];
  }>({
    name: existingTemplate?.name || '',
    description: existingTemplate?.description || '',
    category: existingTemplate?.category || 'custom',
    specialty: existingTemplate?.specialty || '',
    sections: existingTemplate?.sections.map((section, index) => ({
      ...section,
      id: section.id || `section-${index}`,
      autoTags: section.keywords || [],
      aiEnabled: true,
      medicalSpecialty: existingTemplate?.specialty || ''
    })) || []
  });

  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sections = Array.from(template.sections);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    setTemplate(prev => ({ ...prev, sections }));
  };

  const addSection = () => {
    const newSection: TemplateBuilderSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: 'notes',
      placeholder: 'Enter information here...',
      required: false,
      keywords: [],
      autoTags: [],
      aiEnabled: true,
      order: template.sections.length
    };

    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateBuilderSection>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addAutoTag = (sectionId: string, tag: string) => {
    if (!tag.trim()) return;
    
    updateSection(sectionId, {
      autoTags: [...(template.sections.find(s => s.id === sectionId)?.autoTags || []), tag.trim()],
      keywords: [...(template.sections.find(s => s.id === sectionId)?.keywords || []), tag.trim()]
    });
  };

  const removeAutoTag = (sectionId: string, tagIndex: number) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newAutoTags = section.autoTags.filter((_, index) => index !== tagIndex);
    updateSection(sectionId, {
      autoTags: newAutoTags,
      keywords: newAutoTags
    });
  };

  const generateAITags = async (sectionId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    // Simulate AI tag generation based on section type and medical specialty
    const baseTags = SUGGESTED_AUTO_TAGS[section.type as keyof typeof SUGGESTED_AUTO_TAGS] || [];
    const specialtyTags = getSpecialtyTags(template.specialty, section.type);
    const suggestedTags = [...baseTags, ...specialtyTags].slice(0, 8);

    updateSection(sectionId, {
      autoTags: [...(section.autoTags || []), ...suggestedTags.filter(tag => !(section.autoTags || []).includes(tag))],
      keywords: [...(section.keywords || []), ...suggestedTags.filter(tag => !(section.keywords || []).includes(tag))]
    });
  };

  const getSpecialtyTags = (specialty: string, sectionType: SectionType): string[] => {
    const specialtyMap: Record<string, Record<SectionType, string[]>> = {
      'Cardiology': {
        text: ['cardiovascular', 'cardiac', 'heart'],
        symptoms: ['chest pain', 'palpitations', 'dyspnea', 'syncope'],
        examination: ['heart sounds', 'murmur', 'gallop', 'peripheral edema'],
        diagnosis: ['myocardial infarction', 'heart failure', 'arrhythmia'],
        treatment: ['beta blocker', 'ACE inhibitor', 'diuretic'],
        vitals: ['blood pressure', 'heart rate', 'rhythm'],
        history: ['cardiac history', 'family history', 'risk factors'],
        plan: ['cardiology referral', 'ECG', 'echocardiogram'],
        notes: ['cardiac risk', 'lifestyle modification']
      },
      'Emergency Medicine': {
        text: ['emergency', 'acute', 'urgent'],
        symptoms: ['acute pain', 'trauma', 'severe', 'sudden onset'],
        examination: ['ABCDE', 'primary survey', 'secondary survey'],
        diagnosis: ['acute', 'emergency', 'urgent', 'critical'],
        treatment: ['emergency treatment', 'stabilization', 'immediate'],
        vitals: ['triage vitals', 'blood pressure', 'oxygen saturation'],
        history: ['mechanism of injury', 'time of onset', 'allergies'],
        plan: ['discharge', 'admission', 'follow-up', 'referral'],
        notes: ['disposition', 'emergency contact', 'instructions']
      }
    };

    return specialtyMap[specialty]?.[sectionType] || [];
  };

  const saveTemplate = () => {
    const finalTemplate: Template = {
      id: existingTemplate?.id || `custom-${Date.now()}`,
      name: template.name,
      description: template.description,
      category: template.category as Template['category'],
      specialty: template.specialty,
      sections: template.sections.map(section => ({
        id: section.id,
        title: section.title,
        type: section.type,
        placeholder: section.placeholder,
        required: section.required,
        keywords: section.keywords
      })),
      usage: existingTemplate?.usage || {
        totalUses: 0,
        lastUsed: null,
        averageCompletionTime: 0,
        userRating: 0
      }
    };

    onSave?.(finalTemplate);
  };

  const exportTemplate = () => {
    const templateData = {
      ...template,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    if (typeof window === 'undefined') return;
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        setTemplate({
          name: importedTemplate.name || '',
          description: importedTemplate.description || '',
          category: importedTemplate.category || 'custom',
          specialty: importedTemplate.specialty || '',
          sections: importedTemplate.sections || []
        });
      } catch (error) {
        console.error('Failed to import template:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Template Builder</h1>
          <p className="text-gray-600">Create intelligent medical templates with auto-tagging</p>
        </div>
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="outline">{template.specialty}</Badge>
                  </div>
                </div>
                {template.sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={section.placeholder}
                        className="min-h-[80px]"
                        disabled
                      />
                      {section.autoTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {section.autoTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={saveTemplate} className="bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <Input
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Cardiology Consultation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Specialty</label>
            <Select
              value={template.specialty}
              onValueChange={(value) => setTemplate(prev => ({ ...prev, specialty: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={template.description}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and use case for this template"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Template Sections</span>
            <Button onClick={addSection} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {template.sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 border border-gray-200 rounded-lg bg-white ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section Title
                                  </label>
                                  <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                    placeholder="Section title"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section Type
                                  </label>
                                  <Select
                                    value={section.type}
                                    onValueChange={(value: SectionType) => updateSection(section.id, { type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SECTION_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div>
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-xs text-gray-500">{type.description}</div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateAITags(section.id)}
                                    className="w-full"
                                  >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Generate AI Tags
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Placeholder Text
                                </label>
                                <Input
                                  value={section.placeholder}
                                  onChange={(e) => updateSection(section.id, { placeholder: e.target.value })}
                                  placeholder="Placeholder text for this section"
                                />
                              </div>

                              {/* Auto Tags */}
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Tag className="w-4 h-4" />
                                  <label className="text-sm font-medium text-gray-700">
                                    Auto-Tags (AI will categorize content with these keywords)
                                  </label>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {section.autoTags.map((tag, tagIndex) => (
                                    <Badge
                                      key={tagIndex}
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-red-100"
                                      onClick={() => removeAutoTag(section.id, tagIndex)}
                                    >
                                      {tag}
                                      <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="Add auto-tag (e.g., 'blood pressure', 'chest pain')"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addAutoTag(section.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input = document.querySelector(`input[placeholder*="Add auto-tag"]`) as HTMLInputElement;
                                      if (input?.value) {
                                        addAutoTag(section.id, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {template.sections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
              <p className="mb-4">Add sections to start building your custom template</p>
              <Button onClick={addSection}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}