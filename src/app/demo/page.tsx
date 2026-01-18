'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { ArrowLeft, Github, Clock, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Mock data for demo
const mockMicroservices = [
  {
    id: '1',
    service_name: 'auth-service',
    status: 'Done',
    current_task: 'JWT authentication implemented',
    progress: 100,
    health_status: 'Healthy',
    last_commit_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    next_steps: ['Add OAuth providers', 'Implement refresh tokens'],
  },
  {
    id: '2',
    service_name: 'api-gateway',
    status: 'In Progress',
    current_task: 'Setting up rate limiting',
    progress: 65,
    health_status: 'Healthy',
    last_commit_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    next_steps: ['Add caching layer', 'Configure CORS'],
  },
  {
    id: '3',
    service_name: 'user-service',
    status: 'In Progress',
    current_task: 'Building user profile endpoints',
    progress: 40,
    health_status: 'Healthy',
    last_commit_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    next_steps: ['Add avatar upload', 'Email verification'],
  },
  {
    id: '4',
    service_name: 'notification-service',
    status: 'Backlog',
    current_task: 'Design notification system architecture',
    progress: 0,
    health_status: 'Unknown',
    last_commit_date: null,
    next_steps: ['Setup email templates', 'Add push notifications'],
  },
  {
    id: '5',
    service_name: 'payment-service',
    status: 'Testing',
    current_task: 'Stripe integration testing',
    progress: 85,
    health_status: 'Stale',
    last_commit_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    next_steps: ['Add webhook handlers', 'Implement refunds'],
  },
  {
    id: '6',
    service_name: 'analytics-service',
    status: 'Done',
    current_task: 'Event tracking completed',
    progress: 100,
    health_status: 'Healthy',
    last_commit_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    next_steps: ['Add dashboard widgets'],
  },
];

const columns = [
  { id: 'Backlog', title: 'Backlog', color: 'from-gray-500/20 to-gray-600/10' },
  { id: 'In Progress', title: 'In Progress', color: 'from-blue-500/20 to-blue-600/10' },
  { id: 'Testing', title: 'Testing', color: 'from-yellow-500/20 to-yellow-600/10' },
  { id: 'Done', title: 'Done', color: 'from-green-500/20 to-green-600/10' },
];

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'Healthy':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'Stale':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getHealthColor = (status: string) => {
  switch (status) {
    case 'Healthy':
      return 'bg-green-500';
    case 'Stale':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export default function DemoPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const getServicesByStatus = (status: string) => {
    return mockMicroservices.filter((s) => s.status === status);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 rounded-lg border border-neon-purple/30"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Live Demo - This is a sample dashboard with mock data
                </span>
              </div>
              <Link href="/login">
                <button className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors">
                  Start Your Own Dashboard
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-gray-400" />
                  <h1 className="text-2xl font-bold">demo-org/microservices-app</h1>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  6 microservices tracked via vibe.json manifests
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">2</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">2</div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">1</div>
                <div className="text-xs text-gray-400">Testing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">1</div>
                <div className="text-xs text-gray-400">Backlog</div>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: columns.indexOf(column) * 0.1 }}
                className={`bg-gradient-to-b ${column.color} rounded-xl p-4 border border-white/10`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                    {getServicesByStatus(column.id).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {getServicesByStatus(column.id).map((service) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() =>
                        setSelectedService(
                          selectedService === service.id ? null : service.id
                        )
                      }
                      className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 border border-white/10 cursor-pointer hover:border-neon-purple/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">
                          {service.service_name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getHealthColor(service.health_status)}`}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-gray-400 mb-3">
                        {service.current_task}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{service.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${service.progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-neon-purple to-neon-blue rounded-full"
                          />
                        </div>
                      </div>

                      {/* Health & Activity */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          {getHealthIcon(service.health_status)}
                          <span>{service.health_status}</span>
                        </div>
                        {service.last_commit_date && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Activity className="w-3 h-3" />
                            <span>
                              {Math.floor(
                                (Date.now() -
                                  new Date(service.last_commit_date).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}
                              d ago
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {selectedService === service.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <h5 className="text-xs font-semibold text-gray-300 mb-2">
                            Next Steps:
                          </h5>
                          <ul className="space-y-1">
                            {service.next_steps.map((step, i) => (
                              <li
                                key={i}
                                className="text-xs text-gray-400 flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-neon-purple rounded-full" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {getServicesByStatus(column.id).length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No services
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 mb-4">
              Ready to track your own microservices with vibe.json?
            </p>
            <Link href="/login">
              <button className="px-8 py-4 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-full hover:opacity-90 transition-opacity">
                Get Started Free
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
