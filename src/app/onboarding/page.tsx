'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  FolderGit2,
  FileJson,
  Kanban,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to ContextFlow',
    description: 'The Kanban board that writes itself. Let\'s get you set up in just a few steps.',
    icon: Sparkles,
  },
  {
    id: 'connect',
    title: 'Connect Your Repository',
    description: 'Link your GitHub repository to start tracking your microservices.',
    icon: Github,
  },
  {
    id: 'manifest',
    title: 'Understand vibe.json',
    description: 'Learn how vibe.json manifests power your automated Kanban board.',
    icon: FileJson,
  },
  {
    id: 'commit-tags',
    title: 'Using Commit Tags',
    description: 'Update your board automatically with simple commit message tags.',
    icon: FolderGit2,
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Your dashboard is ready. Start tracking your project progress.',
    icon: Rocket,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser({ id: session.user.id, email: session.user.email });

      // Check if user has already completed onboarding
      const { data } = await supabase
        .from('users')
        .select('onboarding_completed, onboarding_step')
        .eq('id', session.user.id)
        .single();

      if (data?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      // Resume from last step if available
      if (data?.onboarding_step && data.onboarding_step > 0) {
        setCurrentStep(data.onboarding_step);
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleNext = async () => {
    const nextStep = currentStep + 1;

    if (nextStep >= steps.length) {
      // Complete onboarding
      setCompleting(true);
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_step: steps.length,
        })
        .eq('id', user?.id);

      router.push('/dashboard');
      return;
    }

    // Save progress
    await supabase
      .from('users')
      .update({ onboarding_step: nextStep })
      .eq('id', user?.id);

    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setCompleting(true);
    await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_step: steps.length,
      })
      .eq('id', user?.id);

    router.push('/dashboard');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </main>
    );
  }

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-blue/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-purple to-neon-blue"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, index) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-neon-purple'
                  : index < currentStep
                  ? 'bg-neon-purple/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 border border-white/10 flex items-center justify-center"
            >
              <StepIcon className="w-8 h-8 text-neon-purple" />
            </motion.div>

            {/* Title & Description */}
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
              {step.title}
            </h1>
            <p className="text-gray-400 text-center mb-8">
              {step.description}
            </p>

            {/* Step Content */}
            <StepContent step={step.id} />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={completing}
                className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Go to Dashboard
                    <Rocket className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepContent({ step }: { step: string }) {
  switch (step) {
    case 'welcome':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Github, label: 'Connect GitHub', desc: 'Link your repos' },
              { icon: FileJson, label: 'Auto-track', desc: 'Via vibe.json' },
              { icon: Kanban, label: 'Visualize', desc: 'Kanban board' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 bg-white/5 rounded-xl border border-white/10 text-center"
              >
                <item.icon className="w-6 h-6 text-neon-purple mx-auto mb-2" />
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'connect':
      return (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400">GitHub Connected</span>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            After this onboarding, you'll be able to select which repositories to track from your
            dashboard. We'll automatically scan for vibe.json files in your repos.
          </p>
        </div>
      );

    case 'manifest':
      return (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-300">
{`{
  "serviceName": "auth-service",
  "status": "In Progress",
  "currentTask": "Implementing JWT",
  "progress": 65,
  "nextSteps": [
    "Add refresh tokens",
    "Setup OAuth providers"
  ]
}`}
            </pre>
          </div>
          <p className="text-sm text-gray-400">
            Place a <code className="text-neon-purple">vibe.json</code> file in each microservice
            folder. We'll track its status automatically.
          </p>
        </div>
      );

    case 'commit-tags':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { tag: '[STATUS:DONE]', desc: 'Mark task as complete' },
              { tag: '[STATUS:IN_PROGRESS]', desc: 'Start working on task' },
              { tag: '[NEXT:Setup OAuth]', desc: 'Add next step' },
              { tag: '[PROGRESS:75]', desc: 'Update progress %' },
            ].map((item) => (
              <div
                key={item.tag}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <code className="text-neon-purple text-sm">{item.tag}</code>
                <span className="text-gray-400 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Add these tags to your commit messages and we'll suggest updates to your vibe.json!
          </p>
        </div>
      );

    case 'ready':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Kanban, label: 'Kanban Board', desc: 'Track all services' },
              { icon: FolderGit2, label: 'Real-time Sync', desc: 'Auto-updates on push' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 rounded-xl border border-white/10 text-center"
              >
                <item.icon className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center">
            Your first step: Connect a repository from your dashboard!
          </p>
        </div>
      );

    default:
      return null;
  }
}
