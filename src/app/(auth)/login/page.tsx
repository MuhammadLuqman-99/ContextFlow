'use client'

import { Github } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    // Use Supabase OAuth - this handles the redirect properly
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo read:user',
      },
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-2">
              ContextFlow
            </h1>
            <p className="text-slate-600">
              Vibe-to-Task Bridge
            </p>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-slate-700 text-center mb-4">
              Track your microservices development with manifest files and commit tags,
              visualized in a beautiful Kanban board.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                <span className="text-slate-600">Auto-documentation from commits</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                <span className="text-slate-600">Real-time Kanban board updates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                <span className="text-slate-600">Health monitoring & suggestions</span>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleGitHubLogin}
            className="w-full btn-primary flex items-center justify-center gap-3 py-3 text-lg"
          >
            <Github size={24} />
            Sign in with GitHub
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>
              By signing in, you agree to connect your GitHub repositories.
            </p>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="font-semibold text-slate-800">Secure</div>
            <div>OAuth 2.0</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="font-semibold text-slate-800">Free</div>
            <div>Open Source</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="font-semibold text-slate-800">Fast</div>
            <div>Real-time</div>
          </div>
        </div>
      </div>
    </div>
  )
}
