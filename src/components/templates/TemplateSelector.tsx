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
  emergency: 'bg-red-100 text-red-700'
};

const CATEGORY_LABELS = {
  general: 'General',
  consultation: 'Consultation',
  examination: 'Examination',
  procedure: 'Procedure',
  'follow-up': 'Follow-up',
  emergency: 'Emergency'
};

export function TemplateSelector({ onTemplateSelect, selectedTemplateId, className }: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTemplates = DEFAULT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(DEFAULT_TEMPLATES.map(t => t.category)));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a template to structure your medical notes</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTemplateId === template.id
                ? 'ring-2 ring-blue-500 border-blue-200'
                : 'border-gray-200 hover:border-blue-200'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {template.name}
                  </CardTitle>
                  {template.isDefault && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                </div>
                {selectedTemplateId === template.id && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-600 line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${CATEGORY_COLORS[template.category]}`}
                >
                  {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
                </Badge>
                <span className="text-xs text-gray-500">
                  {template.sections.length} sections
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {template.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{template.description}</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Template Sections:</h4>
                        <div className="space-y-2">
                          {template.sections.map((section, index) => (
                            <div key={section.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{section.title}</span>
                                  {section.required && (
                                    <Badge variant="outline" className="text-xs">Required</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{section.placeholder}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  className={`text-xs ${
                    selectedTemplateId === template.id
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateSelect(template);
                  }}
                >
                  {selectedTemplateId === template.id ? 'Selected' : 'Use Template'}
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
    </div>
  );
}