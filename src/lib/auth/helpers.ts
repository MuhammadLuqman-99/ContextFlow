import { supabase } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

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
 * Get the current user's GitHub access token
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
 * Sign out the current user
 */
export async function signOut() {
  await supabase.auth.signOut()
}
