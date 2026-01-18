import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getRepositoriesByUserId, createRepository } from '@/lib/supabase/queries'
import { createOctokitClient, getRepository, createWebhook, listUserRepositories } from '@/lib/github/octokit'
import { generateWebhookSecret } from '@/lib/github/webhook'
import { scanRepositoryForManifests } from '@/lib/github/manifest-reader'

// Helper to get user from request (supports both cookie auth and Authorization header)
async function getUserFromRequest(request: NextRequest) {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return { user, supabase }
  }

  // Fallback to cookie auth
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

/**
 * GET /api/repos
 * List all repositories for the authenticated user
 * Add ?available=true to list GitHub repos available to connect
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if requesting available GitHub repos
    const { searchParams } = new URL(request.url)
    const available = searchParams.get('available')

    if (available === 'true') {
      // Get user's GitHub access token
      const { data: userData } = await supabase
        .from('users')
        .select('access_token')
        .eq('id', user.id)
        .single()

      if (!userData?.access_token) {
        return NextResponse.json(
          { error: 'GitHub access token not found' },
          { status: 400 }
        )
      }

      // List repos from GitHub
      const octokit = createOctokitClient(userData.access_token)
      const githubRepos = await listUserRepositories(octokit)

      // Get already connected repos
      const { data: connectedRepos } = await supabase
        .from('repositories')
        .select('github_repo_id')
        .eq('user_id', user.id)

      const connectedIds = new Set((connectedRepos || []).map(r => r.github_repo_id))

      // Filter out already connected repos
      const availableRepos = githubRepos
        .filter(repo => !connectedIds.has(repo.id))
        .map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          owner: repo.owner.login,
          private: repo.private,
          description: repo.description,
          updated_at: repo.updated_at,
        }))

      return NextResponse.json({
        success: true,
        data: availableRepos,
      })
    }

    // Get user's connected repositories
    const repositories = await getRepositoriesByUserId(supabase, user.id)

    return NextResponse.json({
      success: true,
      data: repositories,
    })
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch repositories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repos
 * Connect a new repository and set up webhook
 *
 * Body: {
 *   owner: string,
 *   repo: string,
 *   setupWebhook?: boolean (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { owner, repo, setupWebhook = true } = body

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repo are required' },
        { status: 400 }
      )
    }

    // Get user's GitHub access token
    const { data: userData } = await supabase
      .from('users')
      .select('access_token')
      .eq('id', user.id)
      .single()

    if (!userData || !userData.access_token) {
      return NextResponse.json(
        { error: 'GitHub access token not found' },
        { status: 400 }
      )
    }

    // Create Octokit client
    const octokit = createOctokitClient(userData.access_token)

    // Fetch repository info from GitHub
    const githubRepo = await getRepository(octokit, owner, repo)

    // Check if repository already exists
    const { data: existingRepo } = await supabase
      .from('repositories')
      .select('*')
      .eq('github_repo_id', githubRepo.id)
      .single()

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already connected' },
        { status: 409 }
      )
    }

    // Generate webhook secret
    const webhookSecret = generateWebhookSecret()
    let webhookId: number | null = null

    // Set up webhook if requested
    if (setupWebhook) {
      try {
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
        const webhook = await createWebhook(octokit, owner, repo, webhookUrl, webhookSecret)
        webhookId = webhook.id
      } catch (error) {
        console.error('Failed to create webhook:', error)
        // Continue even if webhook creation fails - user can set it up manually
      }
    }

    // Create repository in database
    const repository = await createRepository(supabase, {
      user_id: user.id,
      github_repo_id: githubRepo.id,
      owner: githubRepo.owner.login,
      repo_name: githubRepo.name,
      full_name: githubRepo.full_name,
      webhook_id: webhookId,
      webhook_secret: webhookId ? webhookSecret : null,
      is_active: true,
    })

    // Scan for vibe.json manifests
    const scanResult = await scanRepositoryForManifests(octokit, owner, repo)

    // Create microservice entries for each manifest found
    if (scanResult.success && scanResult.manifests) {
      for (const { path, manifest } of scanResult.manifests) {
        try {
          await supabase.from('microservices').insert({
            repository_id: repository.id,
            service_name: manifest.serviceName,
            manifest_path: path,
            status: manifest.status,
            current_task: manifest.currentTask,
            progress: manifest.progress,
            last_update: manifest.lastUpdate,
            next_steps: manifest.nextSteps,
            health_status: 'Unknown',
            last_commit_date: null,
          })
        } catch (error) {
          console.error(`Failed to create microservice for ${path}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        repository,
        webhook_created: !!webhookId,
        manifests_found: scanResult.manifests?.length || 0,
        errors: scanResult.errors,
      },
    })
  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json(
      {
        error: 'Failed to connect repository',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
