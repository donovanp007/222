'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface CompactProgressProps {
  label: string
  value: number
  max: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  showCount?: boolean
  className?: string
  icon?: React.ReactNode
  urgentCount?: number
}

export function CompactProgress({
  label,
  value,
  max,
  variant = 'default',
  size = 'sm',
  showPercentage = true,
  showCount = true,
  className,
  icon,
  urgentCount = 0
}: CompactProgressProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-green-200',
          fill: 'bg-gradient-to-r from-green-500 to-green-600',
          text: 'text-green-700',
          accent: 'text-green-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-200',
          fill: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          text: 'text-yellow-700',
          accent: 'text-yellow-600'
        }
      case 'danger':
        return {
          bg: 'bg-red-200',
          fill: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'text-red-700',
          accent: 'text-red-600'
        }
      default:
        return {
          bg: 'bg-gray-200',
          fill: 'bg-gradient-to-r from-blue-500 to-blue-600',
          text: 'text-gray-700',
          accent: 'text-blue-600'
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'lg':
        return {
          container: 'p-4',
          bar: 'h-3',
          text: 'text-sm',
          label: 'text-base font-medium',
          icon: 'w-5 h-5'
        }
      case 'md':
        return {
          container: 'p-3',
          bar: 'h-2',
          text: 'text-xs',
          label: 'text-sm font-medium',
          icon: 'w-4 h-4'
        }
      default: // sm
        return {
          container: 'p-2',
          bar: 'h-1.5',
          text: 'text-xs',
          label: 'text-xs font-medium',
          icon: 'w-3 h-3'
        }
    }
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()

  return (
    <div className={cn(
      'rounded-lg border bg-white transition-all duration-200 hover:shadow-sm',
      sizeStyles.container,
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className={cn(sizeStyles.icon, variantStyles.accent)}>
              {icon}
            </div>
          )}
          <span className={cn(sizeStyles.label, variantStyles.text)}>
            {label}
          </span>
          {urgentCount > 0 && (
            <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-orange-100 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">{urgentCount}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showCount && (
            <span className={cn(sizeStyles.text, 'text-gray-500')}>
              {value}/{max}
            </span>
          )}
          {showPercentage && (
            <span className={cn(sizeStyles.text, 'font-semibold', variantStyles.accent)}>
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={cn(
          'w-full rounded-full overflow-hidden shadow-inner',
          sizeStyles.bar,
          variantStyles.bg
        )}>
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out transform origin-left relative',
              variantStyles.fill
            )}
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress markers for visual reference */}
        {size !== 'sm' && (
          <div className="absolute inset-0 flex justify-between items-center px-1">
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="w-px h-full bg-white opacity-30"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized progress components for different use cases
export function TaskProgress({ 
  completed, 
  total, 
  urgent = 0,
  className 
}: { 
  completed: number
  total: number
  urgent?: number
  className?: string 
}) {
  const getVariant = () => {
    const percentage = total > 0 ? (completed / total) * 100 : 0
    if (percentage === 100) return 'success'
    if (percentage >= 75) return 'default'
    if (percentage >= 50) return 'warning'
    return 'danger'
  }

  return (
    <CompactProgress
      label="Task Completion"
      value={completed}
      max={total}
      variant={getVariant()}
      icon={<CheckCircle />}
      urgentCount={urgent}
      className={className}
    />
  )
}

export function HealthProgress({ 
  currentValue, 
  targetValue, 
  label,
  unit = '',
  className 
}: { 
  currentValue: number
  targetValue: number
  label: string
  unit?: string
  className?: string 
}) {
  const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0
  const isOnTrack = percentage >= 80

  return (
    <CompactProgress
      label={`${label} (${currentValue}${unit}/${targetValue}${unit})`}
      value={currentValue}
      max={targetValue}
      variant={isOnTrack ? 'success' : 'warning'}
      icon={<TrendingUp />}
      className={className}
    />
  )
}

export function TreatmentProgress({ 
  completedSessions, 
  totalSessions, 
  nextSessionDays,
  className 
}: { 
  completedSessions: number
  totalSessions: number
  nextSessionDays?: number
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <CompactProgress
        label="Treatment Progress"
        value={completedSessions}
        max={totalSessions}
        variant={completedSessions === totalSessions ? 'success' : 'default'}
        icon={<Clock />}
      />
      
      {nextSessionDays !== undefined && nextSessionDays <= 7 && (
        <div className="flex items-center space-x-2 px-2 py-1 bg-blue-50 rounded text-xs">
          <Clock className="w-3 h-3 text-blue-600" />
          <span className="text-blue-700">
            Next session in {nextSessionDays} day{nextSessionDays !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export default CompactProgress