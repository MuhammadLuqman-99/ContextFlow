'use client';

import { useUsageLimits, UsageType } from '@/hooks/useUsageLimits';
import { FolderGit2, Boxes, Users, Infinity, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  isUnlimited: boolean;
  icon: React.ReactNode;
}

function UsageBar({ label, used, limit, isUnlimited, icon }: UsageBarProps) {
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && used >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          {icon}
          {label}
        </div>
        <div className="text-sm font-medium">
          {isUnlimited ? (
            <span className="flex items-center gap-1 text-neon-purple">
              <Infinity className="w-4 h-4" />
              Unlimited
            </span>
          ) : (
            <span className={isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'}>
              {used} / {limit}
            </span>
          )}
        </div>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-gradient-to-r from-neon-purple to-neon-blue'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function UsageDisplay() {
  const { usage, loading, error } = useUsageLimits();

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-4" />
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded" />
          <div className="h-6 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null;
  }

  const planColors = {
    free: 'text-gray-400',
    pro: 'text-neon-purple',
    team: 'text-neon-blue',
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Usage</span>
        </div>
        <span className={`text-xs font-semibold uppercase ${planColors[usage.plan]}`}>
          {usage.plan} Plan
        </span>
      </div>

      <div className="space-y-4">
        <UsageBar
          label="Repositories"
          used={usage.repositories.used}
          limit={usage.repositories.limit}
          isUnlimited={usage.repositories.isUnlimited}
          icon={<FolderGit2 className="w-4 h-4" />}
        />
        <UsageBar
          label="Microservices"
          used={usage.microservices.used}
          limit={usage.microservices.limit}
          isUnlimited={usage.microservices.isUnlimited}
          icon={<Boxes className="w-4 h-4" />}
        />
        {usage.plan === 'team' && (
          <UsageBar
            label="Team Members"
            used={usage.teamMembers.used}
            limit={usage.teamMembers.limit}
            isUnlimited={usage.teamMembers.isUnlimited}
            icon={<Users className="w-4 h-4" />}
          />
        )}
      </div>

      {usage.plan === 'free' && (
        <Link
          href="/pricing"
          className="mt-4 block w-full py-2 text-center text-sm text-neon-purple hover:text-neon-blue transition-colors"
        >
          Upgrade for more →
        </Link>
      )}
    </div>
  );
}
