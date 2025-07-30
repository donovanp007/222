"use client";

import { useState } from "react";
import { Check, FileText, Eye, Search, Filter, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Template } from "@/types/template";
import { DEFAULT_TEMPLATES } from "@/data/defaultTemplates";
import { SA_TEMPLATES } from "@/data/saTemplates";
import { ALL_SPECIALTY_TEMPLATES, SPECIALTY_INFO, getTemplatesBySpecialty } from "@/data/specialtyTemplates";

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void;
  selectedTemplateId?: string;
  className?: string;
}

const CATEGORY_COLORS = {
  general: 'bg-gray-100 text-gray-700',
  consultation: 'bg-blue-100 text-blue-700',
  examination: 'bg-green-100 text-green-700',
  procedure: 'bg-purple-100 text-purple-700',
  'follow-up': 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
  specialist: 'bg-indigo-100 text-indigo-700',
  diagnostic: 'bg-cyan-100 text-cyan-700',
  screening: 'bg-teal-100 text-teal-700',
  preventive: 'bg-emerald-100 text-emerald-700',
  custom: 'bg-pink-100 text-pink-700'
};

const CATEGORY_LABELS = {
  general: 'General',
  consultation: 'Consultation',
  examination: 'Examination',
  procedure: 'Procedure',
  'follow-up': 'Follow-up',
  emergency: 'Emergency',
  specialist: 'Specialist',
  diagnostic: 'Diagnostic',
  screening: 'Screening',
  preventive: 'Preventive',
  custom: 'Custom'
};

export function TemplateSelector({ onTemplateSelect, selectedTemplateId, className }: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [templateSet, setTemplateSet] = useState<'international' | 'south-africa' | 'specialty'>('south-africa');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const currentTemplates = 
    templateSet === 'south-africa' ? SA_TEMPLATES : 
    templateSet === 'specialty' ? ALL_SPECIALTY_TEMPLATES : 
    DEFAULT_TEMPLATES;

  const filteredTemplates = currentTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSpecialty = selectedSpecialty === "all" || template.specialty?.toLowerCase() === selectedSpecialty.toLowerCase();
    return matchesSearch && matchesCategory && matchesSpecialty;
  });

  const categories = Array.from(new Set(currentTemplates.map(t => t.category)));

  return (
    <div className={`space-y-6 bg-white p-8 rounded-2xl shadow-xl border-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Template</h2>
          <p className="text-sm text-gray-600 font-medium">Choose a template to structure your medical notes with precision</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Template Set Toggle */}
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl p-1.5 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setTemplateSet('south-africa')}
              className={`px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                templateSet === 'south-africa'
                  ? 'bg-green-600 text-white shadow-lg scale-105 transform'
                  : 'text-gray-700 hover:text-green-700 hover:bg-green-100 backdrop-blur-sm'
              }`}
            >
              🇿🇦 SA Templates
            </button>
            <button
              onClick={() => setTemplateSet('specialty')}
              className={`px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                templateSet === 'specialty'
                  ? 'bg-purple-600 text-white shadow-lg scale-105 transform'
                  : 'text-gray-700 hover:text-purple-700 hover:bg-purple-100 backdrop-blur-sm'
              }`}
            >
              🩺 Specialty
            </button>
            <button
              onClick={() => setTemplateSet('international')}
              className={`px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                templateSet === 'international'
                  ? 'bg-blue-600 text-white shadow-lg scale-105 transform'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-blue-100 backdrop-blur-sm'
              }`}
            >
              🌍 International
            </button>
          </div>
          <Badge variant="outline" className="text-sm font-medium px-3 py-1 bg-white border-gray-300 text-gray-700">
            {filteredTemplates.length} templates
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input
            placeholder="Search templates by name, description, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          {templateSet === 'specialty' && (
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
            >
              <option value="all">All Specialties</option>
              {Object.entries(SPECIALTY_INFO).map(([key, info]) => (
                <option key={key} value={info.name}>
                  {info.icon} {info.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 transform bg-white backdrop-blur-lg border-2 ${
              selectedTemplateId === template.id
                ? 'ring-4 ring-blue-500/30 border-blue-400 shadow-2xl bg-gradient-to-br from-blue-50 to-white scale-105'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white shadow-lg'
            } rounded-2xl overflow-hidden`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900 leading-tight">
                      {template.name}
                    </CardTitle>
                    {template.isDefault && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium text-yellow-600">Recommended</span>
                      </div>
                    )}
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Check className="w-4 h-4 text-white font-bold" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white">
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed font-medium">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    className={`text-xs font-semibold px-3 py-1 ${CATEGORY_COLORS[template.category]} rounded-full border-0`}
                  >
                    {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
                  </Badge>
                  {template.specialty && (
                    <Badge className="text-xs font-medium px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full border-0">
                      {Object.entries(SPECIALTY_INFO).find(([_, info]) => info.name === template.specialty)?.[1]?.icon} {template.specialty}
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {template.sections.length} sections
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>

                <Button
                  size="sm"
                  className={`text-xs font-bold px-6 transition-all duration-300 ${
                    selectedTemplateId === template.id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  } rounded-lg`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateSelect(template);
                  }}
                >
                  {selectedTemplateId === template.id ? '✓ Selected' : 'Use Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] bg-white border-0 shadow-2xl backdrop-blur-lg rounded-2xl overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-8 -mx-6 -mt-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-700/90"></div>
            <DialogTitle className="relative flex items-center gap-4 text-2xl font-bold">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold leading-tight">{previewTemplate?.name}</div>
                <div className="text-blue-100 text-sm font-medium mt-2">Medical Template Preview</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-8 bg-white overflow-y-auto max-h-[70vh] px-2">
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-100 shadow-lg">
                <p className="text-gray-800 font-semibold text-lg leading-relaxed break-words">{previewTemplate.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <Badge className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-full">
                    {CATEGORY_LABELS[previewTemplate.category as keyof typeof CATEGORY_LABELS]}
                  </Badge>
                  {previewTemplate.specialty && (
                    <Badge className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-full">
                      {Object.entries(SPECIALTY_INFO).find(([_, info]) => info.name === previewTemplate.specialty)?.[1]?.icon} {previewTemplate.specialty}
                    </Badge>
                  )}
                  <div className="text-sm font-bold text-gray-600 bg-gray-200 px-4 py-2 rounded-full">
                    {previewTemplate.sections.length} sections
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-2xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                  Template Sections
                </h4>
                <div className="space-y-6">
                  {previewTemplate.sections.map((section, index) => (
                    <div key={section.id} className="flex items-start gap-6 p-8 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-4">
                          <span className="font-bold text-gray-900 text-lg leading-tight flex-1">{section.title}</span>
                          {section.required && (
                            <Badge className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-xl border border-gray-200">
                          <p className="text-sm text-gray-700 font-medium italic leading-relaxed break-words">
                            "{section.placeholder}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}