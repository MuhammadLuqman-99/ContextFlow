import { Octokit } from 'octokit'
import { getFileContent, findVibeManifests } from './octokit'
import { VibeManifest, parseVibeManifest } from '@/types/vibe-manifest'

/**
 * Read and parse a vibe.json manifest from GitHub
 */
export async function readManifestFromGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<{ success: boolean; manifest?: VibeManifest; error?: string }> {
  try {
    const file = await getFileContent(octokit, owner, repo, path)

    if (!file) {
      return {
        success: false,
        error: `File not found: ${path}`,
      }
    }

    const parsed = parseVibeManifest(file.content)

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error,
      }
    }

    return {
      success: true,
      manifest: parsed.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading manifest',
    }
  }
}

/**
 * Scan repository for all vibe.json files and read their contents
 */
export async function scanRepositoryForManifests(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{
  success: boolean
  manifests?: Array<{ path: string; manifest: VibeManifest }>
  errors?: Array<{ path: string; error: string }>
}> {
  try {
    // Find all vibe.json files
    const files = await findVibeManifests(octokit, owner, repo)

    if (files.length === 0) {
      return {
        success: true,
        manifests: [],
        errors: [],
      }
    }

    const manifests: Array<{ path: string; manifest: VibeManifest }> = []
    const errors: Array<{ path: string; error: string }> = []

    // Read and parse each manifest
    for (const file of files) {
      const result = await readManifestFromGitHub(octokit, owner, repo, file.path)

      if (result.success && result.manifest) {
        manifests.push({
          path: file.path,
          manifest: result.manifest,
        })
      } else {
        errors.push({
          path: file.path,
          error: result.error || 'Unknown error',
        })
      }
    }

    return {
      success: true,
      manifests,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: '*',
        error: error instanceof Error ? error.message : 'Failed to scan repository',
      }],
    }
  }
}

/**
 * Update a manifest file on GitHub
 */
export async function updateManifestOnGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  manifest: VibeManifest,
  commitMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current file to get its SHA
    const currentFile = await getFileContent(octokit, owner, repo, path)

    const message = commitMessage || `Update ${manifest.serviceName} manifest [AUTO-UPDATE]`
    const content = JSON.stringify(manifest, null, 2)

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha: currentFile?.sha,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update manifest',
    }
  }
}

/**
 * Get service name from manifest path
 * Example: "services/payment/vibe.json" -> "payment"
 */
export function getServiceNameFromPath(path: string): string {
  const parts = path.split('/')
  const vibeIndex = parts.findIndex(p => p === 'vibe.json')

  if (vibeIndex > 0) {
    return parts[vibeIndex - 1]
  }

  return 'Unknown Service'
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!manifest.serviceName) {
    errors.push('Missing serviceName')
  }

  if (!manifest.status) {
    errors.push('Missing status')
  } else if (!['Backlog', 'In Progress', 'Testing', 'Done'].includes(manifest.status)) {
    errors.push(`Invalid status: ${manifest.status}`)
  }

  if (!manifest.currentTask) {
    errors.push('Missing currentTask')
  }

  if (manifest.progress === undefined || manifest.progress === null) {
    errors.push('Missing progress')
  } else if (typeof manifest.progress !== 'number' || manifest.progress < 0 || manifest.progress > 100) {
    errors.push('Progress must be a number between 0 and 100')
  }

  if (!manifest.lastUpdate) {
    errors.push('Missing lastUpdate')
  }

  if (!Array.isArray(manifest.nextSteps)) {
    errors.push('nextSteps must be an array')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
