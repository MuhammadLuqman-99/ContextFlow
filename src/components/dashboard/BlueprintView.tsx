'use client'

import { useState, useEffect } from 'react'
import { Microservice } from '@/types/database'
import { supabase } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText,
  GitBranch,
  Boxes,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'

interface BlueprintViewProps {
  microservices: Microservice[]
  repoFullName?: string
  repoId?: string
}

interface TreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

// Simple Mermaid-like diagram renderer
function ServiceDiagram({ microservices }: { microservices: Microservice[] }) {
  const statusColors: Record<string, string> = {
    Backlog: 'bg-slate-400',
    'In Progress': 'bg-primary-500',
    Testing: 'bg-yellow-500',
    Done: 'bg-green-500',
  }

  const groupedByStatus = microservices.reduce((acc, ms) => {
    if (!acc[ms.status]) acc[ms.status] = []
    acc[ms.status].push(ms)
    return acc
  }, {} as Record<string, Microservice[]>)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-primary-500" />
        Service Architecture
      </h3>

      <div className="relative">
        {/* Flow diagram */}
        <div className="flex items-start justify-between gap-4 overflow-x-auto pb-4">
          {['Backlog', 'In Progress', 'Testing', 'Done'].map((status, idx) => (
            <div key={status} className="flex-1 min-w-[180px]">
              {/* Status Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={clsx('w-3 h-3 rounded-full', statusColors[status])} />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{status}</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  {groupedByStatus[status]?.length || 0}
                </span>
              </div>

              {/* Services in this status */}
              <div className="space-y-2">
                {(groupedByStatus[status] || []).map((ms) => (
                  <div
                    key={ms.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                  >
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {ms.service_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {ms.current_task}
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full', statusColors[status])}
                        style={{ width: `${ms.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!groupedByStatus[status] || groupedByStatus[status].length === 0) && (
                  <div className="p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500">No services</span>
                  </div>
                )}
              </div>

              {/* Arrow to next */}
              {idx < 3 && (
                <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 items-center" style={{ left: `${(idx + 1) * 25 - 2}%` }}>
                  <ChevronRight className="text-slate-300 dark:text-slate-600" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Folder tree component - shows real GitHub tree structure
function FolderTree({
  treeData,
  isLoading,
  error,
  onRefresh,
  microservices
}: {
  treeData: TreeItem[] | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  microservices: Microservice[]
}) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))

  // Build nested tree structure from flat tree data
  const buildNestedTree = () => {
    if (!treeData) return {}

    const tree: Record<string, any> = {}

    // Create a map of manifest paths for quick lookup
    const manifestPaths = new Map<string, Microservice>()
    microservices.forEach(ms => {
      manifestPaths.set(ms.manifest_path, ms)
    })

    treeData.forEach(item => {
      const parts = item.path.split('/')
      let current = tree

      parts.forEach((part, idx) => {
        if (!current[part]) {
          const fullPath = parts.slice(0, idx + 1).join('/')
          const isFile = idx === parts.length - 1 && item.type === 'blob'
          current[part] = {
            _isFile: isFile,
            _path: fullPath,
            _service: manifestPaths.get(fullPath) || null,
            _size: item.size,
          }
        }
        current = current[part]
      })
    })

    return tree
  }

  const tree = buildNestedTree()

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  // Get file icon color based on extension
  const getFileIconColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const colors: Record<string, string> = {
      ts: 'text-blue-500',
      tsx: 'text-blue-500',
      js: 'text-yellow-500',
      jsx: 'text-yellow-500',
      json: 'text-green-500',
      md: 'text-slate-500',
      css: 'text-pink-500',
      html: 'text-orange-500',
      py: 'text-green-600',
      go: 'text-cyan-500',
    }
    return colors[ext || ''] || 'text-slate-400'
  }

  const renderTree = (node: Record<string, any>, path = '', depth = 0) => {
    const entries = Object.entries(node).filter(([key]) => !key.startsWith('_'))

    // Sort: folders first, then files
    entries.sort(([, a], [, b]) => {
      const aIsFile = a._isFile
      const bIsFile = b._isFile
      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
      return 0
    })

    return entries.map(([key, value]) => {
      const fullPath = path ? `${path}/${key}` : key
      const isFile = value._isFile
      const isExpanded = expandedFolders.has(fullPath) || (depth === 0 && expandedFolders.has(''))
      const service = value._service as Microservice | undefined

      return (
        <div key={fullPath}>
          <div
            className={clsx(
              'flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors',
              service && 'group'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => !isFile && toggleFolder(fullPath)}
          >
            {isFile ? (
              <>
                <File size={14} className={getFileIconColor(key)} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{key}</span>
                {service && (
                  <span className={clsx(
                    'ml-auto text-xs px-2 py-0.5 rounded-full',
                    service.status === 'Done' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                    service.status === 'In Progress' && 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
                    service.status === 'Testing' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
                    service.status === 'Backlog' && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
                  )}>
                    {service.status}
                  </span>
                )}
              </>
            ) : (
              <>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                )}
                <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{key}</span>
              </>
            )}
          </div>
          {!isFile && isExpanded && renderTree(value, fullPath, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Boxes size={20} className="text-primary-500" />
          Project Structure
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={clsx('text-slate-400', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="font-mono text-sm max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading repository structure...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle size={24} className="text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={onRefresh}
              className="text-xs text-primary-500 hover:text-primary-600"
            >
              Try again
            </button>
          </div>
        ) : !treeData || treeData.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            No files found in repository
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>
    </div>
  )
}

// Project overview component
function ProjectOverviewCard({ microservices, repoFullName }: { microservices: Microservice[], repoFullName?: string }) {
  const totalServices = microservices.length
  const completedServices = microservices.filter(ms => ms.status === 'Done').length
  const inProgressServices = microservices.filter(ms => ms.status === 'In Progress').length
  const overallProgress = totalServices > 0
    ? Math.round(microservices.reduce((sum, ms) => sum + ms.progress, 0) / totalServices)
    : 0

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{repoFullName || 'Project'}</h2>
          <p className="text-primary-200 mt-1">Project Blueprint & Architecture</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={24} className="text-primary-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-3xl font-bold">{totalServices}</div>
          <div className="text-sm text-primary-200">Total Services</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-3xl font-bold">{completedServices}</div>
          <div className="text-sm text-primary-200">Completed</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-3xl font-bold">{inProgressServices}</div>
          <div className="text-sm text-primary-200">In Progress</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-3xl font-bold">{overallProgress}%</div>
          <div className="text-sm text-primary-200">Overall Progress</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Mermaid diagram component
function MermaidDiagram({ microservices }: { microservices: Microservice[] }) {
  const [copied, setCopied] = useState(false)

  // Generate Mermaid code for service flow
  const generateMermaidCode = () => {
    const lines = ['flowchart LR']

    // Add nodes
    microservices.forEach((ms, idx) => {
      const nodeId = `S${idx}`
      const shape = ms.status === 'Done' ? `((${ms.service_name}))` : `[${ms.service_name}]`
      lines.push(`    ${nodeId}${shape}`)
    })

    // Add connections based on dependencies
    microservices.forEach((ms, idx) => {
      if (ms.dependencies && ms.dependencies.length > 0) {
        ms.dependencies.forEach((dep: string) => {
          const depIdx = microservices.findIndex(m => m.service_name === dep)
          if (depIdx !== -1) {
            lines.push(`    S${depIdx} --> S${idx}`)
          }
        })
      }
    })

    // Add styling
    lines.push('')
    lines.push('    %% Styling')
    microservices.forEach((ms, idx) => {
      if (ms.status === 'Done') {
        lines.push(`    style S${idx} fill:#22c55e,stroke:#16a34a,color:#fff`)
      } else if (ms.status === 'In Progress') {
        lines.push(`    style S${idx} fill:#0ea5e9,stroke:#0284c7,color:#fff`)
      } else if (ms.status === 'Testing') {
        lines.push(`    style S${idx} fill:#eab308,stroke:#ca8a04,color:#000`)
      }
    })

    return lines.join('\n')
  }

  const mermaidCode = generateMermaidCode()

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <GitBranch size={20} className="text-primary-500" />
          Mermaid Diagram Code
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a
            href="https://mermaid.live"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
          >
            <ExternalLink size={14} />
            Open Editor
          </a>
        </div>
      </div>

      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        {mermaidCode}
      </pre>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Copy this code and paste it into Mermaid Live Editor to visualize the diagram.
      </p>
    </div>
  )
}

// README preview component - shows actual README from GitHub with markdown rendering
function ReadmePreview({
  readmeContent,
  isLoading,
  error,
  onRefresh,
  repoFullName
}: {
  readmeContent: string | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  repoFullName?: string
}) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered')

  const handleCopy = () => {
    if (readmeContent) {
      navigator.clipboard.writeText(readmeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <FileText size={20} className="text-primary-500" />
          README.md
        </h3>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {readmeContent && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('rendered')}
                className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                  viewMode === 'rendered'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                Raw
              </button>
            </div>
          )}
          {readmeContent && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {repoFullName && (
            <a
              href={`https://github.com/${repoFullName}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              View on GitHub
            </a>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={clsx('text-slate-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg overflow-auto max-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading README...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle size={24} className="text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={onRefresh}
              className="text-xs text-primary-500 hover:text-primary-600"
            >
              Try again
            </button>
          </div>
        ) : !readmeContent ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No README.md found in repository</p>
            <p className="text-xs mt-1">Create a README.md file in your repository root</p>
          </div>
        ) : viewMode === 'raw' ? (
          <pre className="whitespace-pre-wrap break-words text-sm font-mono text-slate-700 dark:text-slate-300">
            {readmeContent}
          </pre>
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-slate-200
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-slate-200 dark:prose-h1:border-slate-700 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
            prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-slate-700 dark:prose-strong:text-slate-300
            prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-sm
            prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-600 dark:prose-ul:text-slate-400
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-600 dark:prose-ol:text-slate-400
            prose-li:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-500 dark:prose-blockquote:text-slate-400
            prose-hr:border-slate-200 dark:prose-hr:border-slate-700
            prose-table:border-collapse prose-table:w-full
            prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-600 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-slate-700 dark:prose-th:text-slate-300
            prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-600 prose-td:px-3 prose-td:py-2 prose-td:text-slate-600 dark:prose-td:text-slate-400
            prose-img:rounded-lg prose-img:shadow-md
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom code block rendering for ASCII diagrams
                pre: ({ children, ...props }) => (
                  <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre" {...props}>
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="text-primary-600 dark:text-primary-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                // Preserve ASCII art diagrams
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse" {...props}>
                      {children}
                    </table>
                  </div>
                ),
              }}
            >
              {readmeContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export function BlueprintView({ microservices, repoFullName, repoId }: BlueprintViewProps) {
  // State for GitHub data
  const [treeData, setTreeData] = useState<TreeItem[] | null>(null)
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError, setTreeError] = useState<string | null>(null)

  const [readmeContent, setReadmeContent] = useState<string | null>(null)
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [readmeError, setReadmeError] = useState<string | null>(null)

  // Helper for authenticated API calls
  const authFetch = async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
  }

  // Fetch tree data from GitHub
  const fetchTree = async () => {
    if (!repoId) return

    setTreeLoading(true)
    setTreeError(null)

    try {
      const response = await authFetch(`/api/repos/${repoId}/tree`)
      const data = await response.json()

      if (data.success) {
        setTreeData(data.data.tree)
      } else {
        setTreeError(data.error || 'Failed to fetch repository structure')
      }
    } catch (err) {
      setTreeError('Failed to connect to server')
    } finally {
      setTreeLoading(false)
    }
  }

  // Fetch README from GitHub
  const fetchReadme = async () => {
    if (!repoId) return

    setReadmeLoading(true)
    setReadmeError(null)

    try {
      const response = await authFetch(`/api/repos/${repoId}/readme`)
      const data = await response.json()

      if (data.success) {
        setReadmeContent(data.data.content)
      } else {
        setReadmeError(data.error || 'Failed to fetch README')
      }
    } catch (err) {
      setReadmeError('Failed to connect to server')
    } finally {
      setReadmeLoading(false)
    }
  }

  // Fetch data on mount and when repoId changes
  useEffect(() => {
    if (repoId) {
      fetchTree()
      fetchReadme()
    }
  }, [repoId])

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6">
      {/* Project Overview */}
      <ProjectOverviewCard microservices={microservices} repoFullName={repoFullName} />

      {/* Architecture Diagram */}
      <ServiceDiagram microservices={microservices} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folder Structure - from GitHub */}
        <FolderTree
          treeData={treeData}
          isLoading={treeLoading}
          error={treeError}
          onRefresh={fetchTree}
          microservices={microservices}
        />

        {/* Mermaid Code */}
        <MermaidDiagram microservices={microservices} />
      </div>

      {/* README - from GitHub */}
      <ReadmePreview
        readmeContent={readmeContent}
        isLoading={readmeLoading}
        error={readmeError}
        onRefresh={fetchReadme}
        repoFullName={repoFullName}
      />
    </div>
  )
}
