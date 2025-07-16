"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Copy, Star, Clock, Users, Tag, Brain, Download, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template } from "@/types/template";
import { CustomTemplateBuilder } from "./CustomTemplateBuilder";
import { defaultTemplates } from "@/data/defaultTemplates";

interface TemplateManagerProps {
  onSelectTemplate?: (template: Template) => void;
  showSelection?: boolean;
}

export function TemplateManager({ onSelectTemplate, showSelection = false }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or filters change
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, specialtyFilter]);

  const loadTemplates = () => {
    // Get custom templates from localStorage
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    
    // Combine default templates with custom templates
    const allTemplates = [...defaultTemplates, ...customTemplates];
    setTemplates(allTemplates);
  };

  const filterTemplates = useCallback(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.sections.some(section => 
          section.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Specialty filter
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(template => template.specialty === specialtyFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, categoryFilter, specialtyFilter]);

  const saveTemplate = (template: Template) => {
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    
    if (editingTemplate) {
      // Update existing template
      const updatedCustomTemplates = customTemplates.map((t: Template) => 
        t.id === template.id ? template : t
      );
      localStorage.setItem('customTemplates', JSON.stringify(updatedCustomTemplates));
    } else {
      // Add new template
      customTemplates.push(template);
      localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    }

    loadTemplates();
    setShowBuilder(false);
    setEditingTemplate(null);
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      const updatedTemplates = customTemplates.filter((t: Template) => t.id !== templateId);
      localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));
      loadTemplates();
    }
  };

  const duplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      category: 'custom',
      usage: {
        totalUses: 0,
        lastUsed: null,
        averageCompletionTime: 0,
        userRating: 0
      }
    };

    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    customTemplates.push(newTemplate);
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    loadTemplates();
  };

  const exportTemplate = (template: Template) => {
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
        
        // Generate new ID to avoid conflicts
        const newTemplate: Template = {
          ...importedTemplate,
          id: `custom-${Date.now()}`,
          category: 'custom',
          usage: {
            totalUses: 0,
            lastUsed: null,
            averageCompletionTime: 0,
            userRating: 0
          }
        };

        const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
        customTemplates.push(newTemplate);
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
        loadTemplates();
      } catch (error) {
        console.error('Failed to import template:', error);
        alert('Failed to import template. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const categories = [...new Set(templates.map(t => t.category))];
  const specialties = [...new Set(templates.map(t => t.specialty).filter(Boolean))];

  const formatLastUsed = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (showBuilder) {
    return (
      <CustomTemplateBuilder
        existingTemplate={editingTemplate || undefined}
        onSave={saveTemplate}
        onCancel={() => {
          setShowBuilder(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
          <p className="text-gray-600">Create, manage, and organize your medical templates</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
            id="import-template"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-template')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowBuilder(true)} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
                className="flex-1"
              >
                Grid
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
                className="flex-1"
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => showSelection && onSelectTemplate?.(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{template.category}</Badge>
                      {template.specialty && (
                        <Badge variant="secondary">{template.specialty}</Badge>
                      )}
                    </div>
                  </div>
                  {!showSelection && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(template);
                          setShowBuilder(true);
                        }}
                        disabled={template.category !== 'custom'}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(template);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportTemplate(template);
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      {template.category === 'custom' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      {template.sections.length} sections
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {template.usage.totalUses} uses
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(template.usage.userRating)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatLastUsed(template.usage.lastUsed)}
                  </span>
                  {template.sections.some(s => s.keywords && s.keywords.length > 0) && (
                    <span className="flex items-center text-blue-600">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Enhanced
                    </span>
                  )}
                </div>

                {showSelection && (
                  <Button 
                    className="w-full" 
                    onClick={() => onSelectTemplate?.(template)}
                  >
                    Select Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => showSelection && onSelectTemplate?.(template)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {template.name}
                        </h3>
                        <Badge variant="outline">{template.category}</Badge>
                        {template.specialty && (
                          <Badge variant="secondary">{template.specialty}</Badge>
                        )}
                        {template.sections.some(s => s.keywords && s.keywords.length > 0) && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            <Brain className="w-3 h-3 mr-1" />
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{template.sections.length} sections</span>
                        <span>{template.usage.totalUses} uses</span>
                        <span>Last used: {formatLastUsed(template.usage.lastUsed)}</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(template.usage.userRating)}
                        </div>
                      </div>
                    </div>
                    
                    {!showSelection && (
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                            setShowBuilder(true);
                          }}
                          disabled={template.category !== 'custom'}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTemplate(template);
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTemplate(template);
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                        {template.category === 'custom' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id);
                            }}
                            className="text-red-600 hover:text-red-700 border-red-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    {showSelection && (
                      <Button onClick={() => onSelectTemplate?.(template)}>
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoryFilter !== 'all' || specialtyFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first custom template to get started'
              }
            </p>
            {!searchQuery && categoryFilter === 'all' && specialtyFilter === 'all' && (
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}