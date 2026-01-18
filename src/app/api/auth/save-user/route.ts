import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/client'
import { createOctokitClient, getAuthenticatedUser } from '@/lib/github/octokit'

export async function POST(request: NextRequest) {
  try {
    const { userId, providerToken } = await request.json()

    if (!userId || !providerToken) {
      return NextResponse.json(
        { error: 'Missing userId or providerToken' },
        { status: 400 }
      )
    }

    // Get GitHub user info
    const octokit = createOctokitClient(providerToken)
    const githubUser = await getAuthenticatedUser(octokit)

    // Use service role client to upsert user (bypasses RLS)
    const serviceClient = getServiceRoleClient()

    const userData = {
      id: userId,
      github_id: githubUser.id.toString(),
      github_username: githubUser.login,
      avatar_url: githubUser.avatar_url,
      access_token: providerToken,
    }

    const { error } = await serviceClient
      .from('users')
      .upsert(userData as any, {
        onConflict: 'github_id'
      })

    if (error) {
      console.error('Error saving user:', error)
      return NextResponse.json(
        { error: 'Failed to save user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
