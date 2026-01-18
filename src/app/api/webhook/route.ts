import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/client'
import { getRepositoryByGithubId, getMicroserviceByManifestPath, createCommitSuggestion } from '@/lib/supabase/queries'
import { verifyWebhookSignature, parsePushEvent, getWebhookEventType, createPingResponse, extractManifestPaths } from '@/lib/github/webhook'
import { parseGitHubCommit, createManifestSuggestion, getAffectedManifests } from '@/lib/github/commit-parser'
import { createOctokitClient } from '@/lib/github/octokit'
import { readManifestFromGitHub } from '@/lib/github/manifest-reader'
import { rateLimit, getClientIdentifier, rateLimitConfigs, createRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for webhooks
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, rateLimitConfigs.webhook)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many webhook requests' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Get webhook event type
    const eventType = getWebhookEventType(request.headers.get('x-github-event'))

    // Handle ping event
    if (eventType === 'ping') {
      return NextResponse.json(createPingResponse())
    }

    // Only process push events
    if (eventType !== 'push') {
      return NextResponse.json(
        { error: 'Only push events are supported' },
        { status: 400 }
      )
    }

    // Read and parse payload
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody)

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256')
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse push event
    const pushEvent = parsePushEvent(payload)

    if (!pushEvent) {
      return NextResponse.json(
        { error: 'Invalid push event payload' },
        { status: 400 }
      )
    }

    // Get Supabase service role client
    const supabase = getServiceRoleClient()

    // Find repository in database
    const repository = await getRepositoryByGithubId(supabase, pushEvent.repository.id)

    if (!repository) {
      console.log(`Repository not found: ${pushEvent.repository.full_name}`)
      return NextResponse.json(
        { message: 'Repository not tracked' },
        { status: 200 }
      )
    }

    // Create Octokit client with user's access token
    const { data: userData } = await supabase
      .from('users')
      .select('access_token')
      .eq('id', repository.user_id)
      .single()

    if (!userData) {
      console.error('User not found for repository')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const octokit = createOctokitClient(userData.access_token)

    // Get all microservices for this repository
    const { data: microservices } = await supabase
      .from('microservices')
      .select('*')
      .eq('repository_id', repository.id)

    const knownManifests = (microservices || []).map(m => ({
      path: m.manifest_path,
      serviceName: m.service_name,
    }))

    let suggestionsCreated = 0
    const errors: string[] = []

    // Process each commit
    for (const commit of pushEvent.commits) {
      try {
        // Parse commit for tags
        const parsedCommit = parseGitHubCommit({
          sha: commit.id,
          commit: {
            message: commit.message,
            author: {
              name: commit.author.name,
              email: commit.author.email,
              date: commit.timestamp,
            },
          },
        })

        // Skip if no tags found
        if (parsedCommit.tags.length === 0) {
          continue
        }

        // Determine affected manifests
        const affectedManifests = getAffectedManifests(commit, knownManifests)

        // If no manifests directly affected, try to infer from commit message
        if (affectedManifests.length === 0) {
          console.log(`No manifests affected by commit ${commit.id.slice(0, 7)}`)
          continue
        }

        // Create suggestions for each affected manifest
        for (const manifest of affectedManifests) {
          try {
            // Get current manifest content from GitHub
            const manifestResult = await readManifestFromGitHub(
              octokit,
              repository.owner,
              repository.repo_name,
              manifest.path
            )

            if (!manifestResult.success || !manifestResult.manifest) {
              errors.push(`Failed to read ${manifest.path}: ${manifestResult.error}`)
              continue
            }

            // Generate suggested update
            const suggestedManifest = createManifestSuggestion(
              manifestResult.manifest,
              parsedCommit
            )

            // Get microservice from database
            const microservice = await getMicroserviceByManifestPath(
              supabase,
              repository.id,
              manifest.path
            )

            if (!microservice) {
              console.log(`Microservice not found for ${manifest.path}`)
              continue
            }

            // Create suggestion
            const suggestion = await createCommitSuggestion(supabase, {
              microservice_id: microservice.id,
              commit_sha: commit.id,
              commit_message: commit.message,
              parsed_status: parsedCommit.status || null,
              parsed_next_steps: parsedCommit.nextSteps || null,
              suggested_manifest: suggestedManifest as any,
              is_applied: false,
            })

            if (suggestion) {
              suggestionsCreated++
            }
          } catch (error) {
            console.error(`Error processing manifest ${manifest.path}:`, error)
            errors.push(`Error processing ${manifest.path}: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
        }
      } catch (error) {
        console.error(`Error processing commit ${commit.id}:`, error)
        errors.push(`Error processing commit: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pushEvent.commits.length} commit(s)`,
      suggestions_created: suggestionsCreated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
