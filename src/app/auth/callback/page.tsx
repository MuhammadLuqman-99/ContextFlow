'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing login...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL
        const hashParams = new URLSearchParams(window.location.hash.slice(1))
        const queryParams = new URLSearchParams(window.location.search)

        const error = hashParams.get('error') || queryParams.get('error')
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          router.push(`/login?error=${encodeURIComponent(error)}`)
          return
        }

        // Get the session - Supabase will automatically handle the code exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push(`/login?error=${encodeURIComponent(sessionError.message)}`)
          return
        }

        if (session) {
          setStatus('Login successful! Redirecting...')

          // Save user info to database
          try {
            const response = await fetch('/api/auth/save-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                providerToken: session.provider_token,
              }),
            })

            if (!response.ok) {
              console.warn('Failed to save user, but continuing...')
            }
          } catch (e) {
            console.warn('Error saving user:', e)
          }

          router.push('/dashboard')
        } else {
          // Try to exchange code for session if present in URL
          const code = queryParams.get('code')

          if (code) {
            setStatus('Exchanging code for session...')
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              console.error('Exchange error:', exchangeError)
              router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`)
              return
            }

            // Get session from exchange response or fetch it
            const newSession = exchangeData?.session

            if (newSession) {
              setStatus('Login successful! Saving user...')

              // Save user info to database
              if (newSession.provider_token) {
                try {
                  const response = await fetch('/api/auth/save-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: newSession.user.id,
                      providerToken: newSession.provider_token,
                    }),
                  })

                  if (!response.ok) {
                    console.warn('Failed to save user, but continuing...')
                  }
                } catch (e) {
                  console.warn('Error saving user:', e)
                }
              }

              router.push('/dashboard')
            } else {
              router.push('/login?error=no_session')
            }
          } else {
            // No code and no session - check URL hash for tokens (implicit flow)
            const accessToken = hashParams.get('access_token')

            if (accessToken) {
              setStatus('Processing token...')
              const { error: setError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || '',
              })

              if (setError) {
                console.error('Set session error:', setError)
                router.push(`/login?error=${encodeURIComponent(setError.message)}`)
                return
              }

              router.push('/dashboard')
            } else {
              console.log('No code, no session, no token found')
              router.push('/login?error=no_code')
            }
          }
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/login?error=unexpected')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-slate-600">{status}</p>
      </div>
    </div>
  )
}
