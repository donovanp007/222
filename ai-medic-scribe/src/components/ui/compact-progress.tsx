'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TaskProgressProps {
  completed: number
  total: number
  urgent?: number
  className?: string
  showLabels?: boolean
  variant?: 'default' | 'compact' | 'minimal'
}

export function TaskProgress({ 
  completed, 
  total, 
  urgent = 0, 
  className,
  showLabels = true,
  variant = 'default'
}: TaskProgressProps) {
  const completionPercentage = total > 0 ? (completed / total) * 100 : 0
  const hasUrgent = urgent > 0

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Progress value={completionPercentage} className="h-2 flex-1" />
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {completed}/{total}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Tasks</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">{completed}/{total}</span>
            {hasUrgent && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                {urgent} urgent
              </Badge>
            )}
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-gray-900">Task Progress</h4>
          {hasUrgent && (
            <Badge variant="destructive" className="text-xs">
              {urgent} urgent
            </Badge>
          )}
        </div>
        {showLabels && (
          <span className="text-sm text-gray-600">
            {completed} of {total} completed
          </span>
        )}
      </div>
      
      <Progress value={completionPercentage} className="h-3" />
      
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(completionPercentage)}% complete</span>
          <span>{total - completed} remaining</span>
        </div>
      )}
    </div>
  )
}

interface HealthMetricProgressProps {
  label: string
  value: number
  target: number
  unit?: string
  status?: 'good' | 'warning' | 'danger'
  className?: string
}

export function HealthMetricProgress({
  label,
  value,
  target,
  unit = '',
  status = 'good',
  className
}: HealthMetricProgressProps) {
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0
  
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'danger': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'danger': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Badge className={`text-xs ${getStatusBadgeColor()}`}>
          {value}{unit} / {target}{unit}
        </Badge>
      </div>
      
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Math.round(percentage)}% of target</span>
        <span className={status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}>
          {status === 'good' ? 'On track' : status === 'warning' ? 'Monitor' : 'Attention needed'}
        </span>
      </div>
    </div>
  )
}