'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Bug,
  Wrench,
  Rocket,
  Shield,
  Zap,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'security';
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2025-01-18',
    title: 'Team Collaboration & Admin Features',
    description: 'Introducing team management, admin dashboard, and improved account settings.',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'Team management with invite system and role-based access' },
      { type: 'feature', text: 'Admin dashboard for user and subscription management' },
      { type: 'feature', text: 'Account deletion with 7-day grace period' },
      { type: 'feature', text: 'GDPR-compliant data export in JSON format' },
      { type: 'feature', text: 'Notification system with email preferences' },
      { type: 'improvement', text: 'Enhanced help center with searchable FAQ' },
      { type: 'improvement', text: 'Changelog page to track updates' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-01-15',
    title: 'Billing & Usage Limits',
    description: 'Stripe integration and plan-based feature limits.',
    type: 'minor',
    changes: [
      { type: 'feature', text: 'Stripe integration for subscription billing' },
      { type: 'feature', text: 'Usage-based feature limits per plan' },
      { type: 'feature', text: 'Pricing page with plan comparison' },
      { type: 'feature', text: 'Billing management page' },
      { type: 'feature', text: 'Email notifications with Resend' },
      { type: 'feature', text: 'Onboarding flow for new users' },
      { type: 'improvement', text: 'Custom 404 and error pages' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-10',
    title: 'Initial Release',
    description: 'The first public release of ContextFlow.',
    type: 'major',
    changes: [
      { type: 'feature', text: 'GitHub OAuth authentication' },
      { type: 'feature', text: 'Repository connection with webhook setup' },
      { type: 'feature', text: 'vibe.json manifest parsing' },
      { type: 'feature', text: 'Commit tag detection and suggestions' },
      { type: 'feature', text: 'Kanban board with drag-and-drop' },
      { type: 'feature', text: 'Real-time updates via Supabase' },
      { type: 'feature', text: 'PDF export for project reports' },
      { type: 'feature', text: 'Dashboard sharing with shareable links' },
      { type: 'feature', text: 'Analytics and statistics view' },
    ],
  },
];

const typeIcons = {
  feature: Sparkles,
  fix: Bug,
  improvement: Wrench,
  security: Shield,
};

const typeColors = {
  feature: 'text-green-400 bg-green-400/10',
  fix: 'text-red-400 bg-red-400/10',
  improvement: 'text-blue-400 bg-blue-400/10',
  security: 'text-yellow-400 bg-yellow-400/10',
};

const versionColors = {
  major: 'from-red-500 to-orange-500',
  minor: 'from-purple-500 to-blue-500',
  patch: 'from-gray-500 to-gray-600',
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-neon-purple/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Changelog</h1>
              <p className="text-gray-400">What's new in ContextFlow</p>
            </div>
          </div>

          <p className="text-gray-400 max-w-2xl">
            Stay up to date with the latest features, improvements, and bug fixes.
            We're constantly working to make ContextFlow better.
          </p>
        </div>
      </div>

      {/* Changelog Entries */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />

          <div className="space-y-12">
            {changelog.map((entry, index) => (
              <motion.div
                key={entry.version}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-20"
              >
                {/* Timeline dot */}
                <div className={`absolute left-6 w-5 h-5 rounded-full bg-gradient-to-br ${versionColors[entry.type]} flex items-center justify-center`}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Version badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${versionColors[entry.type]} text-white`}>
                    v{entry.version}
                  </span>
                  <span className="text-gray-400 text-sm">{entry.date}</span>
                </div>

                {/* Content card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold mb-2">{entry.title}</h2>
                  <p className="text-gray-400 mb-6">{entry.description}</p>

                  <div className="space-y-3">
                    {entry.changes.map((change, changeIndex) => {
                      const Icon = typeIcons[change.type];
                      return (
                        <div
                          key={changeIndex}
                          className="flex items-start gap-3"
                        >
                          <div className={`p-1.5 rounded-lg ${typeColors[change.type]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-gray-300 text-sm leading-relaxed">
                            {change.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mt-16 bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 rounded-2xl border border-white/10 p-8 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-neon-purple" />
          <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Follow us on GitHub to get notified about new releases and updates.
          </p>
          <a
            href="https://github.com/contextflow/contextflow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Follow on GitHub
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
