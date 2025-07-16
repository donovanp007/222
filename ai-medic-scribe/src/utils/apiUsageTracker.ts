interface ApiUsage {
  transcriptionTokens: number;
  categorizationTokens: number;
  totalCost: number;
  requestCount: number;
  lastReset: Date;
}

interface ApiCall {
  type: 'transcription' | 'categorization';
  model: string;
  tokens: number;
  cost: number;
  timestamp: Date;
}

// Pricing per token (as of 2024) - costs in USD
const API_PRICING = {
  'whisper-1': 0.006 / 1000, // $0.006 per 1K tokens
  'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens (input + output averaged)
  'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens (much more expensive)
} as const;

const USAGE_STORAGE_KEY = 'ai-medic-scribe-api-usage';
const CALLS_STORAGE_KEY = 'ai-medic-scribe-api-calls';

export class ApiUsageTracker {
  private static instance: ApiUsageTracker;
  
  public static getInstance(): ApiUsageTracker {
    if (!ApiUsageTracker.instance) {
      ApiUsageTracker.instance = new ApiUsageTracker();
    }
    return ApiUsageTracker.instance;
  }

  private getStoredUsage(): ApiUsage {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastReset: new Date(parsed.lastReset)
      };
    }
    
    return {
      transcriptionTokens: 0,
      categorizationTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastReset: new Date()
    };
  }

  private saveUsage(usage: ApiUsage): void {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  }

  private getStoredCalls(): ApiCall[] {
    const stored = localStorage.getItem(CALLS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((call: ApiCall) => ({
        ...call,
        timestamp: new Date(call.timestamp)
      }));
    }
    return [];
  }

  private saveCalls(calls: ApiCall[]): void {
    // Keep only last 100 calls to prevent storage bloat
    const recentCalls = calls.slice(-100);
    localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(recentCalls));
  }

  public trackApiCall(
    type: 'transcription' | 'categorization',
    model: keyof typeof API_PRICING,
    estimatedTokens: number
  ): void {
    const cost = estimatedTokens * API_PRICING[model];
    const usage = this.getStoredUsage();
    const calls = this.getStoredCalls();

    // Update usage
    if (type === 'transcription') {
      usage.transcriptionTokens += estimatedTokens;
    } else {
      usage.categorizationTokens += estimatedTokens;
    }
    
    usage.totalCost += cost;
    usage.requestCount += 1;

    // Add new call record
    const newCall: ApiCall = {
      type,
      model,
      tokens: estimatedTokens,
      cost,
      timestamp: new Date()
    };

    calls.push(newCall);

    // Save updates
    this.saveUsage(usage);
    this.saveCalls(calls);
  }

  public getUsageStats(): {
    current: ApiUsage;
    todaysCost: number;
    thisWeeksCost: number;
    recentCalls: ApiCall[];
    costBreakdown: {
      transcription: number;
      categorization: number;
    };
  } {
    const usage = this.getStoredUsage();
    const calls = this.getStoredCalls();
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const todaysCalls = calls.filter(call => call.timestamp >= startOfDay);
    const thisWeeksCalls = calls.filter(call => call.timestamp >= startOfWeek);

    const todaysCost = todaysCalls.reduce((sum, call) => sum + call.cost, 0);
    const thisWeeksCost = thisWeeksCalls.reduce((sum, call) => sum + call.cost, 0);

    // Calculate cost breakdown
    const transcriptionCost = calls
      .filter(call => call.type === 'transcription')
      .reduce((sum, call) => sum + call.cost, 0);
    
    const categorizationCost = calls
      .filter(call => call.type === 'categorization')
      .reduce((sum, call) => sum + call.cost, 0);

    return {
      current: usage,
      todaysCost,
      thisWeeksCost,
      recentCalls: calls.slice(-10), // Last 10 calls
      costBreakdown: {
        transcription: transcriptionCost,
        categorization: categorizationCost
      }
    };
  }

  public resetUsage(): void {
    const resetUsage: ApiUsage = {
      transcriptionTokens: 0,
      categorizationTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastReset: new Date()
    };
    
    this.saveUsage(resetUsage);
    this.saveCalls([]); // Clear call history
  }

  public estimateTranscriptionCost(audioBlob: Blob): number {
    // Rough estimation: 1 minute of audio ≈ 150 tokens
    const estimatedMinutes = Math.ceil(audioBlob.size / (1024 * 100)); // Very rough estimate
    const estimatedTokens = estimatedMinutes * 150;
    return estimatedTokens * API_PRICING['whisper-1'];
  }

  public estimateCategorizationCost(textLength: number): number {
    // Rough estimation: 1 character ≈ 0.25 tokens for English text
    const estimatedTokens = Math.ceil(textLength * 0.25) + 500; // Add prompt overhead
    return estimatedTokens * API_PRICING['gpt-3.5-turbo'];
  }

  public checkDailyLimit(limitUSD: number): boolean {
    const stats = this.getUsageStats();
    return stats.todaysCost < limitUSD;
  }

  public checkWeeklyLimit(limitUSD: number): boolean {
    const stats = this.getUsageStats();
    return stats.thisWeeksCost < limitUSD;
  }
}

// Convenience functions
export const trackTranscription = (audioBlob: Blob) => {
  const tracker = ApiUsageTracker.getInstance();
  const estimatedMinutes = Math.ceil(audioBlob.size / (1024 * 100));
  const estimatedTokens = estimatedMinutes * 150;
  tracker.trackApiCall('transcription', 'whisper-1', estimatedTokens);
};

export const trackCategorization = (textLength: number) => {
  const tracker = ApiUsageTracker.getInstance();
  const estimatedTokens = Math.ceil(textLength * 0.25) + 500;
  tracker.trackApiCall('categorization', 'gpt-3.5-turbo', estimatedTokens);
};

export const getUsageStats = () => {
  return ApiUsageTracker.getInstance().getUsageStats();
};

export const resetUsage = () => {
  ApiUsageTracker.getInstance().resetUsage();
};