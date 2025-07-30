'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Heart, 
  AlertTriangle, 
  Pill, 
  Users, 
  Scissors, 
  Edit3, 
  Plus, 
  Trash2, 
  Calendar,
  Activity,
  Save,
  X
} from 'lucide-react'
import { Patient, Consultation } from '@/types'
import RichTextEditor, { RichTextEditorRef } from '@/components/ui/rich-text-editor'

interface MedicalHistoryItem {
  id: string
  category: 'chronic' | 'allergy' | 'medication' | 'family' | 'surgical' | 'consultation'
  title: string
  description?: string
  dateAdded: Date
  isActive: boolean
  severity?: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
}

interface InteractiveHistoryViewProps {
  patient: Patient
  consultations: Consultation[]
  onHistoryUpdate?: (history: MedicalHistoryItem[]) => void
}

export function InteractiveHistoryView({ 
  patient, 
  consultations, 
  onHistoryUpdate 
}: InteractiveHistoryViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards')
  const [editingItem, setEditingItem] = useState<MedicalHistoryItem | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newItemCategory, setNewItemCategory] = useState<MedicalHistoryItem['category']>('chronic')
  const [searchFilter, setSearchFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const editorRef = useRef<RichTextEditorRef>(null)

  // Mock history data - in real app, this would come from props or API
  const [historyItems, setHistoryItems] = useState<MedicalHistoryItem[]>([
    {
      id: '1',
      category: 'chronic',
      title: 'Type 2 Diabetes',
      description: 'Diagnosed 2020, well controlled with medication',
      dateAdded: new Date('2020-03-15'),
      isActive: true,
      severity: 'medium',
      notes: 'HbA1c: 6.8%. Regular monitoring required.'
    },
    {
      id: '2',
      category: 'chronic',
      title: 'Hypertension',
      description: 'Stage 1 hypertension, managed with ACE inhibitors',
      dateAdded: new Date('2019-11-22'),
      isActive: true,
      severity: 'medium',
      notes: 'Target BP: <140/90. Current: 135/85'
    },
    {
      id: '3',
      category: 'allergy',
      title: 'Penicillin',
      description: 'Severe allergic reaction - rash and swelling',
      dateAdded: new Date('2015-07-10'),
      isActive: true,
      severity: 'high',
      notes: 'Avoid all penicillin-based antibiotics'
    },
    {
      id: '4',
      category: 'medication',
      title: 'Metformin 850mg',
      description: 'Twice daily with meals for diabetes management',
      dateAdded: new Date('2020-03-20'),
      isActive: true,
      severity: 'low'
    },
    {
      id: '5',
      category: 'family',
      title: 'Diabetes - Mother',
      description: 'Type 2 diabetes diagnosed at age 55',
      dateAdded: new Date('2018-01-15'),
      isActive: true,
      severity: 'medium'
    },
    {
      id: '6',
      category: 'surgical',
      title: 'Appendectomy',
      description: 'Laparoscopic appendectomy, uncomplicated',
      dateAdded: new Date('2010-06-15'),
      isActive: true,
      severity: 'low'
    }
  ])

  const getCategoryIcon = (category: MedicalHistoryItem['category']) => {
    switch (category) {
      case 'chronic': return <Heart className="w-4 h-4" />
      case 'allergy': return <AlertTriangle className="w-4 h-4" />
      case 'medication': return <Pill className="w-4 h-4" />
      case 'family': return <Users className="w-4 h-4" />
      case 'surgical': return <Scissors className="w-4 h-4" />
      case 'consultation': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: MedicalHistoryItem['category']) => {
    switch (category) {
      case 'chronic': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'allergy': return 'bg-red-100 text-red-800 border-red-200'
      case 'medication': return 'bg-green-100 text-green-800 border-green-200'
      case 'family': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'surgical': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'consultation': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const filteredItems = historyItems
    .filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (searchFilter && !item.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchFilter.toLowerCase())) return false
      return true
    })
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())

  const handleEditItem = (item: MedicalHistoryItem) => {
    setEditingItem(item)
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    
    setHistoryItems(prev => 
      prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      )
    )
    setEditingItem(null)
    onHistoryUpdate?.(historyItems)
  }

  const handleDeleteItem = (itemId: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== itemId))
    onHistoryUpdate?.(historyItems)
  }

  const handleAddItem = (newItem: Omit<MedicalHistoryItem, 'id' | 'dateAdded'>) => {
    const item: MedicalHistoryItem = {
      ...newItem,
      id: `hist_${Date.now()}`,
      dateAdded: new Date()
    }
    setHistoryItems(prev => [item, ...prev])
    setShowAddDialog(false)
    onHistoryUpdate?.(historyItems)
  }

  // Convert consultations to history items for timeline view
  const consultationHistoryItems: MedicalHistoryItem[] = consultations.map(consultation => ({
    id: `consult_${consultation.id}`,
    category: 'consultation' as const,
    title: consultation.title,
    description: consultation.content.substring(0, 200) + '...',
    dateAdded: consultation.visitDate,
    isActive: true,
    notes: consultation.diagnosis?.join(', ')
  }))

  const allTimelineItems = [...filteredItems, ...consultationHistoryItems]
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
          
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add History
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Input
            placeholder="Search history..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-64"
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="chronic">Chronic Conditions</option>
            <option value="allergy">Allergies</option>
            <option value="medication">Medications</option>
            <option value="family">Family History</option>
            <option value="surgical">Surgical History</option>
            <option value="consultation">Consultations</option>
          </select>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getSeverityColor(item.severity)}`}
              onClick={() => handleEditItem(item)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                      <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                    </div>
                  </div>
                  {item.severity && (
                    <Badge 
                      variant={
                        item.severity === 'critical' || item.severity === 'high' 
                          ? 'destructive' 
                          : item.severity === 'medium' 
                            ? 'default' 
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-gray-500 mb-2">{item.notes}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {item.dateAdded.toLocaleDateString()}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditItem(item)
                      }}
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(item.id)
                      }}
                      className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-6">
            {allTimelineItems.map((item, index) => (
              <div key={item.id} className="relative flex items-start space-x-4">
                <div className={`absolute left-0 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center ${getCategoryColor(item.category)}`}>
                  {getCategoryIcon(item.category)}
                </div>
                
                <div className="flex-1 ml-12">
                  <Card 
                    className={`border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getSeverityColor(item.severity)}`}
                    onClick={() => item.category !== 'consultation' && handleEditItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </Badge>
                            {item.severity && (
                              <Badge 
                                variant={
                                  item.severity === 'critical' || item.severity === 'high' 
                                    ? 'destructive' 
                                    : item.severity === 'medium' 
                                      ? 'default' 
                                      : 'secondary'
                                }
                                className="text-xs"
                              >
                                {item.severity}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{item.dateAdded.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      
                      {item.notes && (
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Medical History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value as any})}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="chronic">Chronic Condition</option>
                    <option value="allergy">Allergy</option>
                    <option value="medication">Medication</option>
                    <option value="family">Family History</option>
                    <option value="surgical">Surgical History</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <RichTextEditor
                  content={editingItem.description || ''}
                  onChange={(content: string) => setEditingItem({...editingItem, description: content})}
                  minHeight="100px"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <select
                    value={editingItem.severity || 'low'}
                    onChange={(e) => setEditingItem({...editingItem, severity: e.target.value as any})}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={editingItem.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingItem({...editingItem, isActive: e.target.value === 'active'})}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <RichTextEditor
                  content={editingItem.notes || ''}
                  onChange={(content: string) => setEditingItem({...editingItem, notes: content})}
                  minHeight="100px"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Medical History</DialogTitle>
          </DialogHeader>
          <AddHistoryForm
            category={newItemCategory}
            onCategoryChange={setNewItemCategory}
            onSubmit={handleAddItem}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Form component for adding new history items
function AddHistoryForm({ 
  category, 
  onCategoryChange, 
  onSubmit, 
  onCancel 
}: {
  category: MedicalHistoryItem['category']
  onCategoryChange: (category: MedicalHistoryItem['category']) => void
  onSubmit: (item: Omit<MedicalHistoryItem, 'id' | 'dateAdded'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<MedicalHistoryItem['severity']>('low')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    
    onSubmit({
      category,
      title,
      description,
      severity,
      notes,
      isActive: true
    })
    
    // Reset form
    setTitle('')
    setDescription('')
    setSeverity('low')
    setNotes('')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as any)}
            className="w-full p-2 border border-gray-200 rounded-md"
          >
            <option value="chronic">Chronic Condition</option>
            <option value="allergy">Allergy</option>
            <option value="medication">Medication</option>
            <option value="family">Family History</option>
            <option value="surgical">Surgical History</option>
          </select>
        </div>
        <div>
          <Label>Severity</Label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full p-2 border border-gray-200 rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label>Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter condition, medication, or history item..."
        />
      </div>
      
      <div>
        <Label>Description</Label>
        <RichTextEditor
          content={description}
          onChange={(content: string) => setDescription(content)}
          minHeight="100px"
          placeholder="Provide detailed information..."
        />
      </div>
      
      <div>
        <Label>Notes</Label>
        <RichTextEditor
          content={notes}
          onChange={(content: string) => setNotes(content)}
          minHeight="80px"
          placeholder="Additional notes or instructions..."
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add History
        </Button>
      </div>
    </div>
  )
}

export default InteractiveHistoryView
