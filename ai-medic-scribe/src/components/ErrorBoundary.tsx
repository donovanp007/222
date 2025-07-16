"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, you would send this to a logging service like Sentry
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'anonymous', // Replace with actual user ID if available
      };

      // Example: Send to logging endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

      console.log('Error logged:', errorData);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private sendErrorReport = async () => {
    const subject = encodeURIComponent(`AI Medical Scribe Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message: ${this.state.error?.message || 'Unknown error'}

Stack Trace:
${this.state.error?.stack || 'No stack trace available'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack available'}

Please describe what you were doing when this error occurred:
[Describe your actions here]
    `);
    
    window.open(`mailto:support@mediscribe.com?subject=${subject}&body=${body}`);
  };

  private getErrorType = (error?: Error) => {
    if (!error) return 'Unknown Error';
    
    if (error.name === 'ChunkLoadError') return 'Loading Error';
    if (error.message.includes('Network')) return 'Network Error';
    if (error.message.includes('localStorage')) return 'Storage Error';
    if (error.message.includes('Permission')) return 'Permission Error';
    
    return error.name || 'Runtime Error';
  };

  private getErrorSeverity = (error?: Error) => {
    if (!error) return 'medium';
    
    if (error.name === 'ChunkLoadError') return 'low';
    if (error.message.includes('localStorage')) return 'medium';
    if (error.message.includes('Network')) return 'medium';
    
    return 'high';
  };

  private getRecoveryMessage = (error?: Error) => {
    if (!error) return 'Please try refreshing the page.';
    
    if (error.name === 'ChunkLoadError') {
      return 'This usually happens after an app update. Please refresh the page to load the latest version.';
    }
    
    if (error.message.includes('localStorage')) {
      return 'There was an issue with local storage. Your data might be temporarily unavailable.';
    }
    
    if (error.message.includes('Network')) {
      return 'Please check your internet connection and try again.';
    }
    
    return 'An unexpected error occurred. Our team has been notified.';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const severity = this.getErrorSeverity(this.state.error);
      const recoveryMessage = this.getRecoveryMessage(this.state.error);
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bug className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">{errorType}</h3>
                    <p className="text-red-700 text-sm mb-2">{recoveryMessage}</p>
                    <div className="flex items-center gap-4 text-xs text-red-600">
                      <span>Error ID: {this.state.errorId}</span>
                      <span className={`px-2 py-1 rounded ${
                        severity === 'high' ? 'bg-red-200' :
                        severity === 'medium' ? 'bg-yellow-200' :
                        'bg-blue-200'
                      }`}>
                        {severity.toUpperCase()} SEVERITY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Details (Collapsible) */}
              <details className="bg-gray-100 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-200 rounded-lg">
                  Technical Details (Click to expand)
                </summary>
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Error Message:</h4>
                    <code className="text-sm bg-white p-2 rounded border block overflow-x-auto">
                      {this.state.error?.message || 'No error message available'}
                    </code>
                  </div>
                  
                  {this.state.error?.stack && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Stack Trace:</h4>
                      <code className="text-xs bg-white p-2 rounded border block overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {this.state.error.stack}
                      </code>
                    </div>
                  )}
                </div>
              </details>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                
                <Button
                  onClick={this.sendErrorReport}
                  variant="outline"
                  className="flex items-center gap-2 text-gray-600"
                >
                  <Mail className="w-4 h-4" />
                  Report Issue
                </Button>
              </div>

              {/* Helpful Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What can you do?</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Try refreshing the page - this often resolves temporary issues</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache if the problem persists</li>
                  <li>• Contact support if you continue experiencing issues</li>
                </ul>
              </div>

              {/* Contact Information */}
              <div className="text-center text-sm text-gray-600">
                Need immediate help? Contact us at{' '}
                <a href="mailto:support@mediscribe.com" className="text-blue-600 hover:underline">
                  support@mediscribe.com
                </a>{' '}
                or call +27 (0) 21 XXX XXXX
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error);
    
    // Log to monitoring service
    if (typeof window !== 'undefined') {
      // Client-side error logging
      const errorData = {
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      console.log('Error logged by useErrorHandler:', errorData);
    }
  };

  return { handleError };
};

// High-order component for class components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return ComponentWithErrorBoundary;
};