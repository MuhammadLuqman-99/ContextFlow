'use client';

import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-blue/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <h1 className="text-[150px] md:text-[200px] font-bold leading-none bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
            404
          </h1>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Page not found</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Looks like this page got lost in the vibe. The page you're looking for doesn't exist or has been moved.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/">
              <button className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go to Dashboard
              </button>
            </Link>
          </motion.div>

          {/* Help Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-sm text-gray-500"
          >
            <p>Need help? Try these:</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link href="/demo" className="text-neon-purple hover:text-neon-blue transition-colors">
                View Demo
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/pricing" className="text-neon-purple hover:text-neon-blue transition-colors">
                Pricing
              </Link>
              <span className="text-gray-600">•</span>
              <a href="mailto:support@contextflow.dev" className="text-neon-purple hover:text-neon-blue transition-colors">
                Contact Support
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
