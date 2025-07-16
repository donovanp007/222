"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Activity, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUsageStats, resetUsage } from "@/utils/apiUsageTracker";

export function UsageMonitor() {
  const [stats, setStats] = useState(getUsageStats());
  const [showDetails, setShowDetails] = useState(false);

  const refreshStats = () => {
    setStats(getUsageStats());
  };

  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResetUsage = () => {
    if (confirm("Are you sure you want to reset usage statistics? This cannot be undone.")) {
      resetUsage();
      refreshStats();
    }
  };

  const formatCost = (cost: number) => {
    return `R${(cost * 18.5).toFixed(4)}`; // Convert USD to ZAR (approximate rate)
  };

  const formatUSDCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const getUsageColor = (cost: number, dailyLimit: number = 5) => {
    const percentage = (cost / dailyLimit) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            API Usage & Costs
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStats}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Usage Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Today&apos;s Cost</span>
            </div>
            <div className={`text-lg font-bold ${getUsageColor(stats.todaysCost)}`}>
              {formatCost(stats.todaysCost)}
              <div className="text-xs text-gray-500 font-normal">
                {formatUSDCost(stats.todaysCost)} USD
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Requests</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.current.requestCount}
              <div className="text-xs text-gray-500 font-normal">
                Total requests
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">This Week</span>
            <Badge variant="outline" className="text-xs">
              {formatCost(stats.thisWeeksCost)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transcription:</span>
              <span className="font-medium">{formatCost(stats.costBreakdown.transcription)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">AI Analysis:</span>
              <span className="font-medium">{formatCost(stats.costBreakdown.categorization)}</span>
            </div>
          </div>
        </div>

        {/* Usage Guidelines for SA Market */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            Cost-Effective Usage Tips
          </div>
          <div className="text-xs text-blue-600 space-y-1">
            <p>• Using GPT-3.5-turbo saves 90% vs GPT-4</p>
            <p>• Shorter recordings = lower transcription costs</p>
            <p>• Basic categorization available offline as fallback</p>
            <p>• Recommended daily limit: R90 (≈$5 USD)</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs mb-3"
          >
            {showDetails ? 'Hide' : 'Show'} Recent Activity
          </Button>
          
          {showDetails && stats.recentCalls.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stats.recentCalls.slice().reverse().map((call, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="capitalize">{call.type}</span>
                    <Badge variant="outline" className="text-xs">
                      {call.model}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div>{formatCost(call.cost)}</div>
                    <div className="text-gray-500">
                      {call.timestamp.toLocaleTimeString('en-ZA', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetUsage}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
          >
            Reset Usage Statistics
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}