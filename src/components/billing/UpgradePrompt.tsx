'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'repositories' | 'microservices' | 'teamMembers';
  currentPlan: 'free' | 'pro' | 'team';
  currentUsage: number;
  limit: number;
}

const featureMessages = {
  repositories: {
    title: 'Repository Limit Reached',
    description: 'You\'ve connected the maximum number of repositories for your plan.',
    icon: Zap,
    proFeature: 'Unlimited repositories',
  },
  microservices: {
    title: 'Microservice Limit Reached',
    description: 'You\'ve tracked the maximum number of microservices for your plan.',
    icon: Sparkles,
    proFeature: 'Unlimited microservices',
  },
  teamMembers: {
    title: 'Team Member Limit Reached',
    description: 'You\'ve added the maximum number of team members for your plan.',
    icon: Crown,
    proFeature: 'Unlimited team members',
  },
};

export default function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  currentPlan,
  currentUsage,
  limit,
}: UpgradePromptProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const featureInfo = featureMessages[feature];
  const Icon = featureInfo.icon;

  const handleUpgrade = async () => {
    setLoading(true);
    router.push('/pricing');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with gradient */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center text-white">
              {featureInfo.title}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-400 text-center mb-6">
              {featureInfo.description}
            </p>

            {/* Current usage indicator */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Current usage</span>
                <span className="text-white font-semibold">
                  {currentUsage} / {limit}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-purple to-red-500"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-red-400 text-xs mt-2 text-center">
                Limit reached on {currentPlan} plan
              </p>
            </div>

            {/* Upgrade benefits */}
            <div className="space-y-3 mb-6">
              <h3 className="text-white font-semibold text-sm">
                Upgrade to Pro and get:
              </h3>
              <ul className="space-y-2">
                {[
                  featureInfo.proFeature,
                  'Priority support',
                  '90-day commit history',
                  'Advanced analytics',
                ].map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-2 text-gray-300 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-neon-purple/20 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-neon-purple" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Redirecting...'
                ) : (
                  <>
                    View Pricing
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
