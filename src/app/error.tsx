'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 mb-6"
          >
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified and is working on it.
            </p>

            {/* Error Details (in dev mode) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link href="/">
              <button className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </Link>
          </motion.div>

          {/* Report Bug Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <a
              href="mailto:support@contextflow.dev?subject=Bug Report"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              <Bug className="w-4 h-4" />
              Report this issue
            </a>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
