import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { upsertUser } from '@/lib/supabase/queries'
import { createOctokitClient, getAuthenticatedUser } from '@/lib/github/octokit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      )
    }

    // Exchange code for session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !session) {
      console.error('Auth error:', authError)
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', request.url)
      )
    }

    // Get GitHub user info
    const providerToken = session.provider_token

    if (!providerToken) {
      console.error('No provider token')
      return NextResponse.redirect(
        new URL('/login?error=no_token', request.url)
      )
    }

    // Create Octokit client with the token
    const octokit = createOctokitClient(providerToken)
    const githubUser = await getAuthenticatedUser(octokit)

    // Upsert user in database
    await upsertUser(supabase, {
      github_id: githubUser.id.toString(),
      github_username: githubUser.login,
      avatar_url: githubUser.avatar_url,
      access_token: providerToken,
    })

    // Redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected', request.url)
    )
  }
}
