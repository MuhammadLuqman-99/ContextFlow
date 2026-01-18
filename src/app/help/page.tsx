'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  Book,
  MessageCircle,
  Mail,
  Github,
  FileJson,
  Webhook,
  Kanban,
  CreditCard,
  Users,
  Settings,
  Search,
  ExternalLink,
} from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    icon: Book,
    questions: [
      {
        q: 'What is ContextFlow?',
        a: 'ContextFlow is a Kanban board that writes itself. It automatically tracks your microservices progress by reading vibe.json manifest files from your GitHub repositories and parsing commit message tags.',
      },
      {
        q: 'How do I connect my GitHub repository?',
        a: 'After logging in with GitHub, go to Dashboard → Repositories → Connect Repository. Select the repository you want to track, and we\'ll automatically set up webhooks to monitor your commits.',
      },
      {
        q: 'What is a vibe.json file?',
        a: 'A vibe.json file is a manifest that describes the status of a microservice. It includes fields like serviceName, status (Backlog/In Progress/Testing/Done), currentTask, progress (0-100), and nextSteps. Place it in each microservice folder.',
      },
    ],
  },
  {
    category: 'Commit Tags',
    icon: Github,
    questions: [
      {
        q: 'What commit tags can I use?',
        a: 'You can use these tags in your commit messages:\n• [STATUS:DONE] - Mark task as complete\n• [STATUS:IN_PROGRESS] - Start working on task\n• [NEXT:Description] - Add next step\n• [PROGRESS:75] - Update progress percentage',
      },
      {
        q: 'How do commit tags update my board?',
        a: 'When you push a commit with tags, our webhook receives it and creates a suggestion to update your vibe.json. You can review and apply these suggestions from your dashboard.',
      },
    ],
  },
  {
    category: 'Webhooks',
    icon: Webhook,
    questions: [
      {
        q: 'Why isn\'t my webhook working?',
        a: 'Check these common issues:\n1. Ensure the webhook is active in GitHub (Settings → Webhooks)\n2. Verify the webhook URL matches your ContextFlow instance\n3. Make sure the webhook secret is correctly configured\n4. Check that the repository is connected in ContextFlow',
      },
      {
        q: 'Can I manually trigger a sync?',
        a: 'Yes! Go to your repository in the dashboard and click "Scan for Manifests" to manually scan for vibe.json files without waiting for a commit.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    icon: CreditCard,
    questions: [
      {
        q: 'What are the plan limits?',
        a: 'Free: 1 repository, 3 microservices\nPro ($12/mo): Unlimited repositories & microservices, 5 team members\nTeam ($29/mo): Everything in Pro + unlimited team members',
      },
      {
        q: 'How do I upgrade my plan?',
        a: 'Go to Settings → Billing or visit the Pricing page. Select your desired plan and complete checkout through Stripe. Your upgrade takes effect immediately.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from Settings → Billing → Manage Subscription. You\'ll retain access until the end of your billing period.',
      },
    ],
  },
  {
    category: 'Teams',
    icon: Users,
    questions: [
      {
        q: 'How do I invite team members?',
        a: 'Go to Team Management from your dashboard. Create a team (if you haven\'t already), then click "Invite" to send email invitations. Invitees will receive a link to join your team.',
      },
      {
        q: 'What roles are available?',
        a: 'Owner: Full access, can delete team\nAdmin: Can invite members, manage repositories\nMember: Can view and interact with the dashboard',
      },
    ],
  },
  {
    category: 'Account',
    icon: Settings,
    questions: [
      {
        q: 'How do I export my data?',
        a: 'Go to Settings → Privacy & Data → Export Data. We\'ll generate a JSON file containing all your data, which you can download within 24 hours.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Privacy & Data → Delete Account. This action is irreversible and will delete all your repositories, microservices, and team associations.',
      },
    ],
  },
];

const guides = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    href: '/docs/quickstart',
    icon: Book,
  },
  {
    title: 'vibe.json Schema',
    description: 'Complete manifest file reference',
    href: '/docs/schema',
    icon: FileJson,
  },
  {
    title: 'Webhook Setup',
    description: 'Configure GitHub webhooks',
    href: '/docs/webhooks',
    icon: Webhook,
  },
  {
    title: 'API Reference',
    description: 'REST API documentation',
    href: '/docs/api',
    icon: Github,
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('Getting Started');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaqs = searchQuery
    ? faqs.map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.questions.length > 0)
    : faqs;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-neon-purple/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-gray-400 text-lg mb-8">
            Find answers, guides, and get support
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {guides.map((guide) => (
            <Link
              key={guide.title}
              href={guide.href}
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-neon-purple/30 transition-colors group"
            >
              <guide.icon className="w-6 h-6 text-neon-purple mb-3" />
              <h3 className="font-medium mb-1 group-hover:text-neon-purple transition-colors">
                {guide.title}
              </h3>
              <p className="text-xs text-gray-400">{guide.description}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          {filteredFaqs.map((category) => (
            <div
              key={category.category}
              className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenCategory(openCategory === category.category ? null : category.category)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <category.icon className="w-5 h-5 text-neon-purple" />
                  <span className="font-semibold">{category.category}</span>
                  <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                    {category.questions.length}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openCategory === category.category ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openCategory === category.category && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 space-y-2">
                      {category.questions.map((item) => (
                        <div
                          key={item.q}
                          className="bg-white/5 rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setOpenQuestion(openQuestion === item.q ? null : item.q)
                            }
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                          >
                            <span className="font-medium text-sm">{item.q}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${
                                openQuestion === item.q ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {openQuestion === item.q && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-sm text-gray-400 whitespace-pre-line">
                                  {item.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 rounded-2xl border border-white/10 p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neon-purple" />
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-gray-400 mb-6">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@contextflow.dev"
              className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <a
              href="https://github.com/contextflow/contextflow/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Github className="w-4 h-4" />
              GitHub Issues
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
