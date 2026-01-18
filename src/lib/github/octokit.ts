import { Octokit } from 'octokit'

/**
 * Create an Octokit instance with user's GitHub access token
 */
export function createOctokitClient(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  })
}

/**
 * Get repository information
 */
export async function getRepository(octokit: Octokit, owner: string, repo: string) {
  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  })

  return data
}

/**
 * List user's repositories
 */
export async function listUserRepositories(octokit: Octokit) {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  })

  return data
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string
) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    // Check if data is a file (not a directory)
    if ('content' in data && !Array.isArray(data)) {
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return {
        content,
        sha: data.sha,
        path: data.path,
      }
    }

    return null
  } catch (error: any) {
    if (error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Search for files in repository
 */
export async function searchFilesInRepo(
  octokit: Octokit,
  owner: string,
  repo: string,
  filename: string
) {
  const query = `filename:${filename} repo:${owner}/${repo}`

  const { data } = await octokit.rest.search.code({
    q: query,
    per_page: 100,
  })

  return data.items
}

/**
 * Find all vibe.json files in a repository
 */
export async function findVibeManifests(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  return searchFilesInRepo(octokit, owner, repo, 'vibe.json')
}

/**
 * Get latest commits from repository
 */
export async function getLatestCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: string,
  perPage: number = 30
) {
  const params: any = {
    owner,
    repo,
    per_page: perPage,
  }

  if (since) {
    params.since = since
  }

  const { data } = await octokit.rest.repos.listCommits(params)

  return data
}

/**
 * Get latest commit for a specific file/path
 */
export async function getLatestCommitForPath(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
) {
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    path,
    per_page: 1,
  })

  return data[0] || null
}

/**
 * Create or update file in repository
 */
export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const contentBase64 = Buffer.from(content).toString('base64')

  const params: any = {
    owner,
    repo,
    path,
    message,
    content: contentBase64,
  }

  if (sha) {
    params.sha = sha
  }

  const { data } = await octokit.rest.repos.createOrUpdateFileContents(params)

  return data
}

/**
 * Create a webhook for the repository
 */
export async function createWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
) {
  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: 'json',
      secret,
      insecure_ssl: '0',
    },
    events: ['push'],
    active: true,
  })

  return data
}

/**
 * Delete a webhook from the repository
 */
export async function deleteWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  webhookId: number
) {
  await octokit.rest.repos.deleteWebhook({
    owner,
    repo,
    hook_id: webhookId,
  })
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser(octokit: Octokit) {
  const { data } = await octokit.rest.users.getAuthenticated()
  return data
}

/**
 * Get repository tree (file structure)
 */
export async function getRepositoryTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  treeSha: string = 'HEAD',
  recursive: boolean = true
) {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: recursive ? '1' : '0',
  })

  return data.tree
}
