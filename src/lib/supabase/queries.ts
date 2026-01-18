import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Repository, Microservice, CommitSuggestion } from '@/types/database'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * User queries
 */
export async function getUserByGithubId(
  client: TypedSupabaseClient,
  githubId: string
) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('github_id', githubId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error
  }

  return data
}

export async function upsertUser(
  client: TypedSupabaseClient,
  user: {
    github_id: string
    github_username: string
    avatar_url: string | null
    access_token: string
  }
) {
  const { data, error } = await client
    .from('users')
    .upsert({
      ...user,
    }, {
      onConflict: 'github_id',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Repository queries
 */
export async function getRepositoriesByUserId(
  client: TypedSupabaseClient,
  userId: string
) {
  const { data, error} = await client
    .from('repositories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getRepositoryById(
  client: TypedSupabaseClient,
  repositoryId: string
) {
  const { data, error } = await client
    .from('repositories')
    .select('*')
    .eq('id', repositoryId)
    .single()

  if (error) throw error
  return data
}

export async function getRepositoryByGithubId(
  client: TypedSupabaseClient,
  githubRepoId: number
) {
  const { data, error } = await client
    .from('repositories')
    .select('*')
    .eq('github_repo_id', githubRepoId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function createRepository(
  client: TypedSupabaseClient,
  repository: Omit<Repository, 'id' | 'created_at'>
) {
  const { data, error } = await client
    .from('repositories')
    .insert(repository)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRepository(
  client: TypedSupabaseClient,
  repositoryId: string,
  updates: Partial<Omit<Repository, 'id' | 'created_at'>>
) {
  const { data, error } = await client
    .from('repositories')
    .update(updates)
    .eq('id', repositoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRepository(
  client: TypedSupabaseClient,
  repositoryId: string
) {
  const { error } = await client
    .from('repositories')
    .delete()
    .eq('id', repositoryId)

  if (error) throw error
}

/**
 * Microservice queries
 */
export async function getMicroservicesByRepositoryId(
  client: TypedSupabaseClient,
  repositoryId: string
) {
  const { data, error } = await client
    .from('microservices')
    .select('*')
    .eq('repository_id', repositoryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getMicroserviceById(
  client: TypedSupabaseClient,
  microserviceId: string
) {
  const { data, error } = await client
    .from('microservices')
    .select('*')
    .eq('id', microserviceId)
    .single()

  if (error) throw error
  return data
}

export async function getMicroserviceByManifestPath(
  client: TypedSupabaseClient,
  repositoryId: string,
  manifestPath: string
) {
  const { data, error } = await client
    .from('microservices')
    .select('*')
    .eq('repository_id', repositoryId)
    .eq('manifest_path', manifestPath)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function createMicroservice(
  client: TypedSupabaseClient,
  microservice: Omit<Microservice, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await client
    .from('microservices')
    .insert(microservice)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMicroservice(
  client: TypedSupabaseClient,
  microserviceId: string,
  updates: Partial<Omit<Microservice, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await client
    .from('microservices')
    .update(updates)
    .eq('id', microserviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMicroservice(
  client: TypedSupabaseClient,
  microserviceId: string
) {
  const { error } = await client
    .from('microservices')
    .delete()
    .eq('id', microserviceId)

  if (error) throw error
}

/**
 * Commit suggestion queries
 */
export async function getPendingSuggestionsByMicroserviceId(
  client: TypedSupabaseClient,
  microserviceId: string
) {
  const { data, error } = await client
    .from('commit_suggestions')
    .select('*')
    .eq('microservice_id', microserviceId)
    .eq('is_applied', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPendingSuggestionsByRepositoryId(
  client: TypedSupabaseClient,
  repositoryId: string
) {
  const { data, error } = await client
    .from('commit_suggestions')
    .select(`
      *,
      microservices (
        id,
        service_name,
        manifest_path,
        status
      )
    `)
    .eq('is_applied', false)
    .eq('microservices.repository_id', repositoryId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCommitSuggestion(
  client: TypedSupabaseClient,
  suggestion: Omit<CommitSuggestion, 'id' | 'created_at'>
) {
  const { data, error } = await client
    .from('commit_suggestions')
    .insert(suggestion)
    .select()
    .single()

  if (error) {
    // If it's a duplicate, ignore
    if (error.code === '23505') {
      return null
    }
    throw error
  }

  return data
}

export async function applySuggestion(
  client: TypedSupabaseClient,
  suggestionId: string
) {
  const { data, error } = await client
    .from('commit_suggestions')
    .update({ is_applied: true })
    .eq('id', suggestionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function dismissSuggestion(
  client: TypedSupabaseClient,
  suggestionId: string
) {
  const { error } = await client
    .from('commit_suggestions')
    .delete()
    .eq('id', suggestionId)

  if (error) throw error
}

/**
 * Health check queries
 */
export async function updateMicroserviceHealthStatus(
  client: TypedSupabaseClient,
  microserviceId: string,
  healthStatus: 'Healthy' | 'Stale' | 'Inactive' | 'Unknown',
  lastCommitDate?: string
) {
  const updates: any = { health_status: healthStatus }
  if (lastCommitDate) {
    updates.last_commit_date = lastCommitDate
  }

  const { data, error } = await client
    .from('microservices')
    .update(updates)
    .eq('id', microserviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAllMicroservicesForHealthCheck(
  client: TypedSupabaseClient
): Promise<Array<Microservice & { repositories: { id: string; full_name: string; owner: string; repo_name: string; user_id: string } }>> {
  const { data, error } = await client
    .from('microservices')
    .select(`
      *,
      repositories (
        id,
        full_name,
        owner,
        repo_name,
        user_id
      )
    `)

  if (error) throw error
  return (data as any) || []
}
