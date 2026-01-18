'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center px-4 max-w-lg">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
          <p className="text-gray-400 mb-6">
            A critical error occurred. Please try refreshing the page.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <button
            onClick={reset}
            className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
