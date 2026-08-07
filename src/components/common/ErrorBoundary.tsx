import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OPROX Platform Uncaught UI Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full p-8 rounded-3xl bg-slate-950 border border-rose-500/30 text-slate-100 flex flex-col items-center justify-center text-center space-y-6 my-8 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <h2 className="text-xl font-extrabold text-white">OPROX UI Execution Guard Caught Exception</h2>
            <p className="text-xs text-slate-400">
              An unexpected runtime error occurred in this workspace component. The platform isolation boundary prevented a crash.
            </p>
          </div>

          {this.state.error && (
            <div className="w-full max-w-lg p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-rose-300 text-left overflow-x-auto max-h-32">
              <span className="font-bold uppercase text-[9px] text-slate-500 block mb-1">Diagnostic Exception:</span>
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Workspace State</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
