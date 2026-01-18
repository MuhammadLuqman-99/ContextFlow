import { HealthStatus } from '@/types/vibe-manifest'
import { clsx } from 'clsx'

interface StatusIndicatorProps {
  status: HealthStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusIndicator({ status, showLabel = true, size = 'md' }: StatusIndicatorProps) {
  const colors = {
    Healthy: 'bg-status-healthy text-white',
    Stale: 'bg-status-stale text-white',
    Inactive: 'bg-status-inactive text-white',
    Unknown: 'bg-slate-400 text-white',
  }

  const icons = {
    Healthy: '🟢',
    Stale: '🟡',
    Inactive: '🔴',
    Unknown: '⚪',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors[status],
        sizes[size]
      )}
    >
      <span className="text-xs">{icons[status]}</span>
      {showLabel && <span>{status}</span>}
    </div>
  )
}

interface HealthBadgeProps {
  status: HealthStatus
  lastCommitDate?: string | null
}

export function HealthBadge({ status, lastCommitDate }: HealthBadgeProps) {
  const getTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator status={status} showLabel={false} size="sm" />
      <div className="text-xs text-slate-600">
        {lastCommitDate ? (
          <>Last commit: {getTimeAgo(lastCommitDate)}</>
        ) : (
          <>No commits yet</>
        )}
      </div>
    </div>
  )
}
