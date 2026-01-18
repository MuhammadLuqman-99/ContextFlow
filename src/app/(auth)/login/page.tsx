'use client'

import { Github, Sparkles, GitBranch, BarChart3, Zap, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: GitBranch,
    title: 'Auto-sync from Git',
    description: 'Commits automatically update your Kanban board via vibe.json manifests',
  },
  {
    icon: BarChart3,
    title: 'Real-time Dashboard',
    description: 'Watch your project progress update live as your team pushes code',
  },
  {
    icon: Zap,
    title: 'Health Monitoring',
    description: 'Get alerts when services go stale and suggested next steps',
  },
]

const plans = [
  { name: 'Free', description: '1 repo, 3 services' },
  { name: 'Pro', description: 'Unlimited repos' },
  { name: 'Team', description: 'Collaboration features' },
]

function LoginContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const plan = searchParams.get('plan')

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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo read:user',
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data?.url) {
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-blue/20 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                <div className="w-5 h-5 bg-slate-950 rounded" />
              </div>
              <span className="text-2xl font-bold text-white">ContextFlow</span>
            </Link>

            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              The Kanban Board that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">
                writes itself.
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Connect your GitHub and watch your project management update automatically.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <feature.icon className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonial or Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue border-2 border-slate-950"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">Join 500+ developers</span>
            </div>
            <p className="text-gray-300 italic">
              "Finally, a tool that understands how vibe-coders work. My PM actually knows what's happening now!"
            </p>
            <p className="text-sm text-gray-500 mt-2">— Developer at a startup</p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                <div className="w-4 h-4 bg-slate-950 rounded" />
              </div>
              <span className="text-xl font-bold text-white">ContextFlow</span>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-4"
              >
                <Sparkles className="w-4 h-4 text-neon-purple" />
                <span className="text-sm text-neon-purple">
                  {plan === 'pro' ? 'Start Pro Trial' : 'Free to start'}
                </span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-400">Sign in to access your dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* GitHub Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full py-4 px-6 bg-white text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-950 text-gray-500">What you'll get</span>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-3 mb-8">
              {(plan === 'pro' ? [
                'Unlimited repositories',
                'Unlimited microservices',
                'Real-time updates',
                'PDF export & sharing',
                '14-day free trial',
              ] : [
                '1 repository included',
                'Up to 3 microservices',
                'Basic Kanban board',
                'GitHub OAuth login',
                'Community support',
              ]).map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="p-1 rounded-full bg-neon-purple/20">
                    <Check className="w-3 h-3 text-neon-purple" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-neon-purple hover:text-neon-blue transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-neon-purple hover:text-neon-blue transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Plan Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex justify-center gap-4"
          >
            {plans.map((p) => (
              <Link
                key={p.name}
                href={p.name.toLowerCase() === 'free' ? '/login' : `/login?plan=${p.name.toLowerCase()}`}
                className={`text-center px-4 py-2 rounded-lg transition-colors ${
                  (plan === p.name.toLowerCase() || (!plan && p.name === 'Free'))
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs opacity-60">{p.description}</div>
              </Link>
            ))}
          </motion.div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
