'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Zap,
  Rocket,
  Building2,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { getStripe } from '@/lib/stripe/browser';

interface UserSubscription {
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_period_end: string | null;
  trial_end: string | null;
  stripe_customer_id: string | null;
}

const planDetails = {
  free: {
    name: 'Free',
    icon: Zap,
    color: 'gray',
    price: '$0',
  },
  pro: {
    name: 'Pro',
    icon: Rocket,
    color: 'neon-purple',
    price: '$12/month',
  },
  team: {
    name: 'Team',
    icon: Building2,
    color: 'neon-blue',
    price: '$29/user/month',
  },
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check for success parameter
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Remove the query parameter from URL
      router.replace('/billing');
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        setAccessToken(session.access_token);

        // Fetch user subscription data
        const { data } = await supabase
          .from('users')
          .select('subscription_status, subscription_plan, subscription_period_end, trial_end, stripe_customer_id')
          .eq('id', session.user.id)
          .single();

        setSubscription(data);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [router]);

  const handleManageBilling = async () => {
    if (!accessToken) return;

    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'team', billingCycle: 'monthly' | 'yearly') => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const stripe = await getStripe();
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    }
  };

  const currentPlan = (subscription?.subscription_plan || 'free') as keyof typeof planDetails;
  const plan = planDetails[currentPlan] || planDetails.free;
  const PlanIcon = plan.icon;

  const getStatusBadge = () => {
    const status = subscription?.subscription_status;
    switch (status) {
      case 'active':
        return { text: 'Active', color: 'bg-green-500/20 text-green-400' };
      case 'trialing':
        return { text: 'Trial', color: 'bg-blue-500/20 text-blue-400' };
      case 'past_due':
        return { text: 'Past Due', color: 'bg-red-500/20 text-red-400' };
      case 'canceled':
        return { text: 'Canceled', color: 'bg-gray-500/20 text-gray-400' };
      default:
        return { text: 'Free', color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const statusBadge = getStatusBadge();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Success Toast */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-green-400">Subscription updated successfully!</span>
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-2 text-green-400 hover:text-green-300"
          >
            &times;
          </button>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-400 mt-2">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${currentPlan === 'free' ? 'bg-gray-500/20' : 'bg-neon-purple/20'}`}>
                <PlanIcon className={`w-8 h-8 ${currentPlan === 'free' ? 'text-gray-400' : 'text-neon-purple'}`} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{plan.name} Plan</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>
                <p className="text-gray-400 text-lg">{plan.price}</p>
              </div>
            </div>

            {subscription?.stripe_customer_id && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            )}
          </div>

          {/* Subscription Details */}
          {subscription?.subscription_status && subscription.subscription_status !== 'canceled' && (
            <div className="mt-6 pt-6 border-t border-white/10 grid sm:grid-cols-2 gap-4">
              {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Trial ends</p>
                    <p className="text-white font-medium">
                      {new Date(subscription.trial_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {subscription.subscription_period_end && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-neon-purple" />
                  <div>
                    <p className="text-sm text-gray-400">Next billing date</p>
                    <p className="text-white font-medium">
                      {new Date(subscription.subscription_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Upgrade Options (only show if on free plan) */}
        {currentPlan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4">Upgrade Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Plan */}
              <div className="bg-gradient-to-b from-neon-purple/20 to-transparent rounded-2xl border-2 border-neon-purple/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-neon-purple/20">
                    <Rocket className="w-6 h-6 text-neon-purple" />
                  </div>
                  <h3 className="text-xl font-bold">Pro</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$12</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Unlimited repositories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Real-time updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">PDF export & sharing</span>
                  </li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpgrade('pro', 'monthly')}
                    className="flex-1 py-2 bg-neon-purple text-white rounded-lg font-medium hover:bg-neon-purple/90 transition-colors"
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleUpgrade('pro', 'yearly')}
                    className="flex-1 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                  >
                    Yearly (Save 20%)
                  </button>
                </div>
              </div>

              {/* Team Plan */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Building2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold">Team</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$29</span>
                  <span className="text-gray-400">/user/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Team workspaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">SSO / SAML</span>
                  </li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpgrade('team', 'monthly')}
                    className="flex-1 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleUpgrade('team', 'yearly')}
                    className="flex-1 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                  >
                    Yearly (Save 20%)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Methods Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Payment Information</h3>
          </div>
          {subscription?.stripe_customer_id ? (
            <p className="text-gray-400">
              Manage your payment methods, view invoices, and update billing information through the{' '}
              <button
                onClick={handleManageBilling}
                className="text-neon-purple hover:text-neon-blue transition-colors"
              >
                billing portal
              </button>
              .
            </p>
          ) : (
            <p className="text-gray-400">
              No payment method on file. Upgrade to a paid plan to add a payment method.
            </p>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 rounded-2xl border border-white/10"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-neon-purple mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Need help with billing?</h3>
              <p className="text-gray-400 text-sm">
                Contact our support team at{' '}
                <a href="mailto:billing@contextflow.dev" className="text-neon-purple hover:text-neon-blue">
                  billing@contextflow.dev
                </a>{' '}
                for any billing questions or issues.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
