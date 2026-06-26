import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ErrorBoundary extends (React.Component as any) {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SajiloBiz] Uncaught error:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-md w-full text-center space-y-5">
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="h-7 w-7 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-gray-900">Something went wrong</h2>
              <p className="text-sm text-gray-500">
                SajiloBiz encountered an unexpected error. Your locally saved data is safe.
              </p>
            </div>
            {this.state.errorMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left">
                <span className="text-[10px] font-mono text-gray-500 break-all">
                  {this.state.errorMessage}
                </span>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/15"
            >
              <RefreshCw className="h-4 w-4" />
              Reload SajiloBiz
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
