import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { upsertUser } from '@/lib/supabase/queries'
import { createOctokitClient, getAuthenticatedUser } from '@/lib/github/octokit'
import { sendWelcomeEmail } from '@/lib/email/send'

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, onboarding_completed')
      .eq('github_id', githubUser.id.toString())
      .single()

    const isNewUser = !existingUser

    // Upsert user in database
    await upsertUser(supabase, {
      github_id: githubUser.id.toString(),
      github_username: githubUser.login,
      avatar_url: githubUser.avatar_url,
      access_token: providerToken,
    })

    // Send welcome email for new users
    if (isNewUser && session.user.email) {
      try {
        await sendWelcomeEmail(session.user.email, githubUser.login)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't block the flow if email fails
      }

      // Update first login timestamp
      await supabase
        .from('users')
        .update({ first_login_at: new Date().toISOString() })
        .eq('github_id', githubUser.id.toString())
    }

    // Redirect new users to onboarding, existing users to dashboard
    if (isNewUser || !existingUser?.onboarding_completed) {
      return NextResponse.redirect(
        new URL('/onboarding', request.url)
      )
    }

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
