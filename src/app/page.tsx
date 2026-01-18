import Link from 'next/link'
import { Github } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          ContextFlow
        </h1>
        <p className="text-2xl text-slate-600 mb-4">
          Vibe-to-Task Bridge
        </p>
        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
          A simplified SaaS dashboard that bridges the gap between code and non-technical stakeholders.
          Track your microservices with manifest files and commit tags, visualized in a beautiful Kanban board.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Github size={20} />
            Login with GitHub
          </Link>
          <Link
            href="/templates"
            className="btn-secondary"
          >
            View Templates
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-lg mb-2">Manifest Files</h3>
            <p className="text-slate-600 text-sm">
              Each microservice has a vibe.json file describing status, tasks, and progress
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">🏷️</div>
            <h3 className="font-semibold text-lg mb-2">Commit Tags</h3>
            <p className="text-slate-600 text-sm">
              Add [STATUS:DONE] [NEXT:Task] tags to commits for automatic updates
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Visual Dashboard</h3>
            <p className="text-slate-600 text-sm">
              Real-time Kanban board with health monitoring and smart suggestions
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
