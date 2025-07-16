import { TaskSuggestion } from "@/types";

interface AnalysisResult {
  suggestedTasks: Omit<TaskSuggestion, 'id' | 'createdAt'>[];
  extractedDiagnoses: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

// Medical keywords and their associated tasks
const MEDICAL_KEYWORDS = {
  cardiology: {
    keywords: ['heart', 'cardiac', 'chest pain', 'palpitations', 'arrhythmia', 'hypertension', 'blood pressure'],
    tasks: [
      {
        type: 'imaging' as const,
        description: 'ECG (Electrocardiogram)',
        priority: 'medium' as const,
      },
      {
        type: 'lab-test' as const,
        description: 'Cardiac enzymes blood test',
        priority: 'medium' as const,
      }
    ]
  },
  diabetes: {
    keywords: ['diabetes', 'blood sugar', 'glucose', 'insulin', 'diabetic', 'hba1c'],
    tasks: [
      {
        type: 'lab-test' as const,
        description: 'HbA1c blood test',
        priority: 'medium' as const,
      },
      {
        type: 'lab-test' as const,
        description: 'Fasting glucose test',
        priority: 'medium' as const,
      },
      {
        type: 'follow-up' as const,
        description: '3-month diabetes follow-up',
        priority: 'medium' as const,
      }
    ]
  },
  respiratory: {
    keywords: ['cough', 'shortness of breath', 'asthma', 'pneumonia', 'bronchitis', 'chest infection'],
    tasks: [
      {
        type: 'imaging' as const,
        description: 'Chest X-ray',
        priority: 'medium' as const,
      },
      {
        type: 'lab-test' as const,
        description: 'Sputum culture',
        priority: 'low' as const,
      }
    ]
  },
  hypertension: {
    keywords: ['high blood pressure', 'hypertension', 'bp', 'systolic', 'diastolic'],
    tasks: [
      {
        type: 'follow-up' as const,
        description: 'Blood pressure monitoring follow-up in 2 weeks',
        priority: 'medium' as const,
      },
      {
        type: 'lab-test' as const,
        description: 'Kidney function tests',
        priority: 'low' as const,
      }
    ]
  },
  mental_health: {
    keywords: ['depression', 'anxiety', 'stress', 'mental health', 'mood', 'psychiatrist'],
    tasks: [
      {
        type: 'referral' as const,
        description: 'Psychiatrist referral',
        priority: 'medium' as const,
      },
      {
        type: 'follow-up' as const,
        description: 'Mental health follow-up in 2 weeks',
        priority: 'high' as const,
      }
    ]
  },
  pain: {
    keywords: ['pain', 'chronic pain', 'arthritis', 'joint pain', 'back pain', 'headache'],
    tasks: [
      {
        type: 'imaging' as const,
        description: 'MRI or X-ray for pain assessment',
        priority: 'low' as const,
      },
      {
        type: 'referral' as const,
        description: 'Physiotherapy referral',
        priority: 'low' as const,
      }
    ]
  }
};

// Urgent keywords that require immediate attention
const URGENT_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'seizure', 'unconscious', 'emergency',
  'severe pain', 'bleeding', 'difficulty breathing', 'allergic reaction'
];

// Follow-up indicators
const FOLLOW_UP_INDICATORS = [
  'follow up', 'follow-up', 'come back', 'return', 'see you', 'next visit',
  'weeks', 'months', 'monitor', 'check', 'review'
];

export function analyzeTranscription(content: string): AnalysisResult {
  const contentLower = content.toLowerCase();
  const suggestedTasks: Omit<TaskSuggestion, 'id' | 'createdAt'>[] = [];
  const extractedDiagnoses: string[] = [];
  let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'low';

  // Check for urgent keywords
  const hasUrgentKeywords = URGENT_KEYWORDS.some(keyword => 
    contentLower.includes(keyword.toLowerCase())
  );
  
  if (hasUrgentKeywords) {
    urgencyLevel = 'urgent';
    suggestedTasks.push({
      type: 'follow-up',
      description: 'Urgent follow-up required within 24 hours',
      priority: 'urgent',
      isCompleted: false,
    });
  }

  // Analyze medical conditions and suggest tasks
  Object.entries(MEDICAL_KEYWORDS).forEach(([condition, data]) => {
    const matchedKeywords = data.keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      // Add condition to diagnoses
      extractedDiagnoses.push(condition.replace('_', ' '));
      
      // Add suggested tasks for this condition
      data.tasks.forEach(task => {
        // Check if similar task already exists
        const taskExists = suggestedTasks.some(existing => 
          existing.description.toLowerCase().includes(task.description.toLowerCase())
        );

        if (!taskExists) {
          suggestedTasks.push({
            ...task,
            isCompleted: false,
          });
        }
      });

      // Increase urgency if multiple conditions found
      if (matchedKeywords.length > 2 && urgencyLevel === 'low') {
        urgencyLevel = 'medium';
      }
    }
  });

  // Check for follow-up mentions and extract timeframes
  const followUpMatches = FOLLOW_UP_INDICATORS.filter(indicator => 
    contentLower.includes(indicator.toLowerCase())
  );

  if (followUpMatches.length > 0) {
    // Try to extract timeframe
    const timeframes = extractTimeframes(content);
    
    timeframes.forEach(timeframe => {
      const dueDate = calculateDueDate(timeframe);
      const priority = timeframe.includes('week') ? 'high' : 
                     timeframe.includes('month') ? 'medium' : 'low';

      suggestedTasks.push({
        type: 'follow-up',
        description: `Follow-up appointment ${timeframe}`,
        priority,
        dueDate,
        isCompleted: false,
      });
    });

    if (urgencyLevel === 'low') {
      urgencyLevel = 'medium';
    }
  }

  // Check for medication mentions
  if (contentLower.includes('medication') || contentLower.includes('prescription') || 
      contentLower.includes('pills') || contentLower.includes('tablets')) {
    suggestedTasks.push({
      type: 'medication',
      description: 'Medication review and prescription',
      priority: 'medium',
      isCompleted: false,
    });
  }

  // Check for referral mentions
  if (contentLower.includes('refer') || contentLower.includes('specialist') || 
      contentLower.includes('cardiologist') || contentLower.includes('neurologist')) {
    suggestedTasks.push({
      type: 'referral',
      description: 'Specialist referral',
      priority: 'medium',
      isCompleted: false,
    });
  }

  // If no specific urgency detected but multiple tasks suggested, set to medium
  if (urgencyLevel === 'low' && suggestedTasks.length > 2) {
    urgencyLevel = 'medium';
  }

  return {
    suggestedTasks,
    extractedDiagnoses,
    urgencyLevel
  };
}

function extractTimeframes(content: string): string[] {
  const timeframes: string[] = [];
  const timeRegex = /(?:in\s+)?(\d+)\s*(week|month|day)s?/gi;
  let match;

  while ((match = timeRegex.exec(content)) !== null) {
    timeframes.push(`in ${match[1]} ${match[2]}${match[1] !== '1' ? 's' : ''}`);
  }

  // Also check for common phrases
  if (content.toLowerCase().includes('next week')) {
    timeframes.push('in 1 week');
  }
  if (content.toLowerCase().includes('next month')) {
    timeframes.push('in 1 month');
  }
  if (content.toLowerCase().includes('six months')) {
    timeframes.push('in 6 months');
  }

  return timeframes;
}

function calculateDueDate(timeframe: string): Date {
  const now = new Date();
  const match = timeframe.match(/(\d+)\s*(week|month|day)/i);
  
  if (!match) return now;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
    case 'month':
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + amount);
      return futureDate;
    default:
      return now;
  }
}

// South African specific medical aid and healthcare suggestions
export function getSouthAfricanHealthcareSuggestions(content: string): Omit<TaskSuggestion, 'id' | 'createdAt'>[] {
  const suggestions: Omit<TaskSuggestion, 'id' | 'createdAt'>[] = [];
  const contentLower = content.toLowerCase();

  // Medical aid specific suggestions
  if (contentLower.includes('discovery') || contentLower.includes('vitality')) {
    suggestions.push({
      type: 'other',
      description: 'Check Discovery Vitality benefits and rewards',
      priority: 'low',
      isCompleted: false,
    });
  }

  // Public healthcare references
  if (contentLower.includes('state hospital') || contentLower.includes('clinic')) {
    suggestions.push({
      type: 'referral',
      description: 'Public healthcare referral letter needed',
      priority: 'medium',
      isCompleted: false,
    });
  }

  // Common SA conditions
  if (contentLower.includes('tb') || contentLower.includes('tuberculosis')) {
    suggestions.push({
      type: 'lab-test',
      description: 'TB screening and sputum test',
      priority: 'high',
      isCompleted: false,
    });
  }

  if (contentLower.includes('hiv') || contentLower.includes('aids')) {
    suggestions.push({
      type: 'lab-test',
      description: 'HIV/AIDS monitoring blood tests',
      priority: 'high',
      isCompleted: false,
    });
  }

  return suggestions;
}