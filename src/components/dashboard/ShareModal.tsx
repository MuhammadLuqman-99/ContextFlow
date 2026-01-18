'use client'

import { useState } from 'react'
import { X, Copy, Check, Link, Users, Globe } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  repoName: string
  shareUrl?: string
  onGenerateLink?: () => Promise<string>
  onRevokeLink?: () => Promise<void>
}

export function ShareModal({
  isOpen,
  onClose,
  repoName,
  shareUrl,
  onGenerateLink,
  onRevokeLink,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [localShareUrl, setLocalShareUrl] = useState(shareUrl)

  if (!isOpen) return null

  const handleCopy = async () => {
    if (!localShareUrl) return

    try {
      await navigator.clipboard.writeText(localShareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleGenerateLink = async () => {
    if (!onGenerateLink) return

    setGenerating(true)
    try {
      const url = await onGenerateLink()
      setLocalShareUrl(url)
      toast.success('Share link generated')
    } catch (error) {
      toast.error('Failed to generate link')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevokeLink = async () => {
    if (!onRevokeLink) return

    setRevoking(true)
    try {
      await onRevokeLink()
      setLocalShareUrl(undefined)
      toast.success('Share link revoked')
    } catch (error) {
      toast.error('Failed to revoke link')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Users size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Share Dashboard
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {repoName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <Globe size={20} className="text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Public Share Link
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Anyone with this link can view your dashboard in read-only mode. They won't be able to make any changes.
              </p>
            </div>
          </div>

          {/* Share Link */}
          {localShareUrl ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={localShareUrl}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300"
                />
                <button
                  onClick={handleCopy}
                  className={clsx(
                    'px-3 py-2 rounded-lg font-medium text-sm transition-all',
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  )}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <button
                onClick={handleRevokeLink}
                disabled={revoking}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Revoke Link'}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Link size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                No share link generated yet
              </p>
              <button
                onClick={handleGenerateLink}
                disabled={generating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          )}

          {/* Team Members Section (placeholder for future) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Team Members
              </h3>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Invite team members with specific roles and permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
