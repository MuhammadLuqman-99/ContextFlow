'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export type UsageType = 'repositories' | 'microservices' | 'teamMembers';

export interface UsageInfo {
  plan: 'free' | 'pro' | 'team';
  limit: number;
  used: number;
  remaining: number;
  canAdd: boolean;
  isUnlimited: boolean;
}

export interface AllUsageInfo {
  plan: 'free' | 'pro' | 'team';
  subscriptionStatus: string;
  repositories: UsageInfo;
  microservices: UsageInfo;
  teamMembers: UsageInfo;
}

// Plan limits (mirrored from server for client-side checks)
const PLAN_LIMITS = {
  free: {
    repositories: 1,
    microservices: 3,
    teamMembers: 1,
  },
  pro: {
    repositories: -1,
    microservices: -1,
    teamMembers: 5,
  },
  team: {
    repositories: -1,
    microservices: -1,
    teamMembers: -1,
  },
} as const;

export function useUsageLimits() {
  const [usage, setUsage] = useState<AllUsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUsage(null);
        return;
      }

      // Get user's plan info
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('id', session.user.id)
        .single();

      const activeStatuses = ['active', 'trialing'];
      const isActive = activeStatuses.includes(userData?.subscription_status || '');
      const plan = (isActive ? userData?.subscription_plan : 'free') as 'free' | 'pro' | 'team';

      // Count repositories
      const { count: repoCount } = await supabase
        .from('repositories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      // Count microservices (need to get repo IDs first)
      const { data: repos } = await supabase
        .from('repositories')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      let microserviceCount = 0;
      if (repos && repos.length > 0) {
        const repoIds = repos.map((r) => r.id);
        const { count } = await supabase
          .from('microservices')
          .select('*', { count: 'exact', head: true })
          .in('repository_id', repoIds);
        microserviceCount = count || 0;
      }

      // Build usage info
      const buildUsageInfo = (type: UsageType, currentUsage: number): UsageInfo => {
        const limit = PLAN_LIMITS[plan][type];
        const isUnlimited = limit === -1;
        return {
          plan,
          limit: isUnlimited ? -1 : limit,
          used: currentUsage,
          remaining: isUnlimited ? -1 : Math.max(0, limit - currentUsage),
          canAdd: isUnlimited || currentUsage < limit,
          isUnlimited,
        };
      };

      setUsage({
        plan,
        subscriptionStatus: userData?.subscription_status || 'inactive',
        repositories: buildUsageInfo('repositories', repoCount || 0),
        microservices: buildUsageInfo('microservices', microserviceCount),
        teamMembers: buildUsageInfo('teamMembers', 1), // TODO: count team members
      });
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Failed to load usage information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const canAdd = useCallback(
    (type: UsageType): boolean => {
      if (!usage) return false;
      return usage[type].canAdd;
    },
    [usage]
  );

  const getUpgradeMessage = useCallback(
    (type: UsageType): string => {
      if (!usage) return '';
      const info = usage[type];
      if (info.canAdd) return '';

      const messages: Record<UsageType, string> = {
        repositories: `You've reached your limit of ${info.limit} repository on the free plan. Upgrade to Pro for unlimited repositories.`,
        microservices: `You've reached your limit of ${info.limit} microservices on the free plan. Upgrade to Pro for unlimited microservices.`,
        teamMembers: `You've reached your limit of ${info.limit} team member on your current plan. Upgrade to Team for unlimited members.`,
      };

      return messages[type];
    },
    [usage]
  );

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    canAdd,
    getUpgradeMessage,
  };
}
