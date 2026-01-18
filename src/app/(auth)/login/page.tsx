'use client'

import { Github } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect, Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(`Login failed: ${errorParam}`)
    }
  }, [searchParams])

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Starting OAuth flow...')

      // Get the OAuth URL manually
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo read:user',
          skipBrowserRedirect: true, // We'll handle redirect manually
        },
      })

      console.log('OAuth response:', { data, error })

      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url)
        // Use window.location.assign for a clean redirect
        window.location.assign(data.url)
      } else {
        setError('No OAuth URL received from Supabase')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

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
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-3 py-3 text-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <Github size={24} />
                Sign in with GitHub
              </>
            )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
