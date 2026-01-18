import { SupabaseClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, PlanType } from '@/lib/stripe/client';

export type UsageType = 'repositories' | 'microservices' | 'teamMembers';

export interface UsageInfo {
  plan: PlanType;
  limit: number;
  used: number;
  remaining: number;
  canAdd: boolean;
  isUnlimited: boolean;
}

export interface AllUsageInfo {
  plan: PlanType;
  subscriptionStatus: string;
  repositories: UsageInfo;
  microservices: UsageInfo;
  teamMembers: UsageInfo;
}

// Get user's current plan from database
export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan: PlanType; status: string }> {
  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { plan: 'free', status: 'inactive' };
  }

  // Only count as paid if subscription is active or trialing
  const activeStatuses = ['active', 'trialing'];
  const isActive = activeStatuses.includes(user.subscription_status || '');

  return {
    plan: isActive ? (user.subscription_plan as PlanType) || 'free' : 'free',
    status: user.subscription_status || 'inactive',
  };
}

// Count user's current repositories
export async function countUserRepositories(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('repositories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error counting repositories:', error);
    return 0;
  }

  return count || 0;
}

// Count user's microservices across all repos
export async function countUserMicroservices(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // First get all user's repository IDs
  const { data: repos, error: repoError } = await supabase
    .from('repositories')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (repoError || !repos || repos.length === 0) {
    return 0;
  }

  const repoIds = repos.map((r) => r.id);

  const { count, error } = await supabase
    .from('microservices')
    .select('*', { count: 'exact', head: true })
    .in('repository_id', repoIds);

  if (error) {
    console.error('Error counting microservices:', error);
    return 0;
  }

  return count || 0;
}

// Count team members (for team plan)
export async function countTeamMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // For now, return 1 (just the owner)
  // TODO: Implement team_members table and counting
  return 1;
}

// Check if user can add a resource
export function checkLimit(
  plan: PlanType,
  usageType: UsageType,
  currentUsage: number
): UsageInfo {
  const limit = PLAN_LIMITS[plan][usageType];
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - currentUsage);
  const canAdd = isUnlimited || currentUsage < limit;

  return {
    plan,
    limit: isUnlimited ? -1 : limit,
    used: currentUsage,
    remaining: isUnlimited ? -1 : remaining,
    canAdd,
    isUnlimited,
  };
}

// Get all usage info for a user
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<AllUsageInfo> {
  const { plan, status } = await getUserPlan(supabase, userId);

  const [repoCount, microserviceCount, teamCount] = await Promise.all([
    countUserRepositories(supabase, userId),
    countUserMicroservices(supabase, userId),
    countTeamMembers(supabase, userId),
  ]);

  return {
    plan,
    subscriptionStatus: status,
    repositories: checkLimit(plan, 'repositories', repoCount),
    microservices: checkLimit(plan, 'microservices', microserviceCount),
    teamMembers: checkLimit(plan, 'teamMembers', teamCount),
  };
}

// Quick check if user can add a specific resource
export async function canUserAdd(
  supabase: SupabaseClient,
  userId: string,
  usageType: UsageType
): Promise<{ allowed: boolean; usage: UsageInfo; upgradeRequired: boolean }> {
  const { plan } = await getUserPlan(supabase, userId);

  let currentUsage: number;
  switch (usageType) {
    case 'repositories':
      currentUsage = await countUserRepositories(supabase, userId);
      break;
    case 'microservices':
      currentUsage = await countUserMicroservices(supabase, userId);
      break;
    case 'teamMembers':
      currentUsage = await countTeamMembers(supabase, userId);
      break;
    default:
      currentUsage = 0;
  }

  const usage = checkLimit(plan, usageType, currentUsage);

  return {
    allowed: usage.canAdd,
    usage,
    upgradeRequired: !usage.canAdd && plan === 'free',
  };
}

// Error messages for limit exceeded
export function getLimitExceededMessage(usageType: UsageType, plan: PlanType): string {
  const limit = PLAN_LIMITS[plan][usageType];

  const messages: Record<UsageType, string> = {
    repositories: `You've reached your limit of ${limit} repository${limit === 1 ? '' : 'ies'} on the ${plan} plan. Upgrade to Pro for unlimited repositories.`,
    microservices: `You've reached your limit of ${limit} microservice${limit === 1 ? '' : 's'} on the ${plan} plan. Upgrade to Pro for unlimited microservices.`,
    teamMembers: `You've reached your limit of ${limit} team member${limit === 1 ? '' : 's'} on the ${plan} plan. Upgrade to Team for unlimited team members.`,
  };

  return messages[usageType];
}
