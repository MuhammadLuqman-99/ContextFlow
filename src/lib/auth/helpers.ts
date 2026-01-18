import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

interface AuthResult {
  user: User | null
  supabase: SupabaseClient
}

/**
 * Get user from request - supports both cookie auth and Authorization header
 * Use this in API routes to authenticate requests
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthResult> {
  // Try Authorization header first (for client-side fetch with Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    return { user, supabase: supabaseClient }
  }

  // Fallback to cookie auth (for server-side requests)
  const supabaseClient = createServerSupabaseClient()
  const { data: { user } } = await supabaseClient.auth.getUser()
  return { user, supabase: supabaseClient }
}

/**
 * Get the current authenticated user's session
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

/**
 * Get the current user's GitHub access token from database
 */
export async function getUserAccessToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('access_token')
    .eq('id', userId)
    .single()

  return data?.access_token || null
}

/**
 * Get user's GitHub access token using a specific Supabase client
 */
export async function getGitHubAccessToken(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: userData } = await supabaseClient
    .from('users')
    .select('access_token')
    .eq('id', userId)
    .single()

  return userData?.access_token || null
}

/**
 * Sign out the current user
 */
export async function signOut() {
  await supabase.auth.signOut()
}
