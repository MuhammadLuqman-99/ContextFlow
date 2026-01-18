'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap, Rocket, Building2, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { supabase } from '@/lib/supabase/client';
import { getStripe } from '@/lib/stripe/browser';

const tiers = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for solo developers getting started with vibe coding',
    icon: Zap,
    popular: false,
    cta: 'Get Started Free',
    planId: 'free',
    limits: {
      repositories: '1 repository',
      microservices: '3 microservices',
      teamMembers: '1 user',
      storage: '100 MB',
      apiCalls: '1,000/month',
      historyRetention: '7 days',
    },
    features: [
      { name: 'Basic Kanban board', included: true },
      { name: 'GitHub OAuth login', included: true },
      { name: 'vibe.json manifest support', included: true },
      { name: 'Commit tag parsing', included: true },
      { name: 'Health status indicators', included: true },
      { name: 'Community support', included: true },
      { name: 'Real-time updates', included: false },
      { name: 'PDF export', included: false },
      { name: 'Dashboard sharing', included: false },
      { name: 'Custom templates', included: false },
      { name: 'Priority support', included: false },
      { name: 'SSO / SAML', included: false },
    ],
  },
  {
    name: 'Pro',
    price: { monthly: 12, yearly: 10 },
    description: 'For professional developers and small teams who need more power',
    icon: Rocket,
    popular: true,
    cta: 'Start 14-Day Trial',
    planId: 'pro',
    limits: {
      repositories: 'Unlimited',
      microservices: 'Unlimited',
      teamMembers: '5 users',
      storage: '10 GB',
      apiCalls: '50,000/month',
      historyRetention: '90 days',
    },
    features: [
      { name: 'Basic Kanban board', included: true },
      { name: 'GitHub OAuth login', included: true },
      { name: 'vibe.json manifest support', included: true },
      { name: 'Commit tag parsing', included: true },
      { name: 'Health status indicators', included: true },
      { name: 'Community support', included: true },
      { name: 'Real-time updates', included: true },
      { name: 'PDF export', included: true },
      { name: 'Dashboard sharing', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Priority support', included: true },
      { name: 'SSO / SAML', included: false },
    ],
  },
  {
    name: 'Team',
    price: { monthly: 29, yearly: 24 },
    description: 'For teams that need advanced collaboration and enterprise features',
    icon: Building2,
    popular: false,
    cta: 'Start 14-Day Trial',
    planId: 'team',
    limits: {
      repositories: 'Unlimited',
      microservices: 'Unlimited',
      teamMembers: 'Unlimited',
      storage: '100 GB',
      apiCalls: 'Unlimited',
      historyRetention: '1 year',
    },
    features: [
      { name: 'Basic Kanban board', included: true },
      { name: 'GitHub OAuth login', included: true },
      { name: 'vibe.json manifest support', included: true },
      { name: 'Commit tag parsing', included: true },
      { name: 'Health status indicators', included: true },
      { name: 'Community support', included: true },
      { name: 'Real-time updates', included: true },
      { name: 'PDF export', included: true },
      { name: 'Dashboard sharing', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Priority support', included: true },
      { name: 'SSO / SAML', included: true },
    ],
  },
];

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, your new rate will apply at the next billing cycle.',
  },
  {
    question: 'What happens when I exceed my usage limits?',
    answer: 'We\'ll notify you when you\'re approaching your limits. If you exceed them, your service will continue to work, but you\'ll need to upgrade to continue adding new repositories or microservices.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We never store your GitHub credentials - we use OAuth tokens with minimal required scopes.',
  },
  {
    question: 'Can I use ContextFlow with private repositories?',
    answer: 'Yes! All plans support private repositories. We only request the necessary GitHub permissions to read your vibe.json manifests and commit history.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. For Team plans, we also offer invoice-based billing.',
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    // Check if user canceled
    if (searchParams.get('canceled') === 'true') {
      setShowCanceled(true);
    }

    // Check if user is logged in
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setAccessToken(session.access_token);
      }
    }
    checkAuth();
  }, [searchParams]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      // For free plan, just redirect to login/dashboard
      window.location.href = isLoggedIn ? '/dashboard' : '/login';
      return;
    }

    if (!isLoggedIn) {
      // Redirect to login with plan parameter
      window.location.href = `/login?plan=${planId}`;
      return;
    }

    // Start checkout for paid plans
    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: planId,
          billingCycle,
        }),
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
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Canceled Banner */}
      {showCanceled && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-lg flex items-center gap-3"
          >
            <span>Checkout was canceled. You can try again anytime.</span>
            <button onClick={() => setShowCanceled(false)} className="hover:text-yellow-300">
              &times;
            </button>
          </motion.div>
        </div>
      )}

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-sm font-medium text-neon-purple bg-neon-purple/10 rounded-full border border-neon-purple/20 mb-4">
              Pricing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-white/5 rounded-full border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  tier.popular
                    ? 'bg-gradient-to-b from-neon-purple/20 to-transparent border-2 border-neon-purple/50'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-sm font-semibold text-white bg-gradient-to-r from-neon-purple to-neon-blue rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tier.popular ? 'bg-neon-purple/20' : 'bg-white/10'}`}>
                    <tier.icon className={`w-6 h-6 ${tier.popular ? 'text-neon-purple' : 'text-gray-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly}
                  </span>
                  {tier.price.monthly > 0 && (
                    <span className="text-gray-400">
                      /{tier.name === 'Team' ? 'user/' : ''}month
                    </span>
                  )}
                  {tier.price.monthly === 0 && (
                    <span className="text-gray-400"> forever</span>
                  )}
                </div>

                <p className="text-gray-400 mb-6 text-sm">{tier.description}</p>

                <button
                  onClick={() => handleSelectPlan(tier.planId)}
                  disabled={loadingPlan === tier.planId}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {loadingPlan === tier.planId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Usage Limits */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-4">Usage Limits</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Repositories</span>
                      <span className="text-white font-medium">{tier.limits.repositories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Microservices</span>
                      <span className="text-white font-medium">{tier.limits.microservices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Team Members</span>
                      <span className="text-white font-medium">{tier.limits.teamMembers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-white font-medium">{tier.limits.storage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">API Calls</span>
                      <span className="text-white font-medium">{tier.limits.apiCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">History Retention</span>
                      <span className="text-white font-medium">{tier.limits.historyRetention}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto mb-20"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Feature Comparison
            </h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-400 font-medium">Feature</th>
                      {tiers.map((tier) => (
                        <th key={tier.name} className="p-4 text-center">
                          <span className={`font-semibold ${tier.popular ? 'text-neon-purple' : 'text-white'}`}>
                            {tier.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tiers[0].features.map((feature, featureIndex) => (
                      <tr
                        key={feature.name}
                        className={featureIndex % 2 === 0 ? 'bg-white/[0.02]' : ''}
                      >
                        <td className="p-4 text-gray-300 text-sm">{feature.name}</td>
                        {tiers.map((tier) => (
                          <td key={`${tier.name}-${feature.name}`} className="p-4 text-center">
                            {tier.features[featureIndex].included ? (
                              <Check className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-medium text-white">{faq.question}</span>
                    <HelpCircle
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-gray-400 text-sm">{faq.answer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 rounded-2xl p-8 md:p-12 border border-white/10 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-400 mb-6">
                Our team is here to help. Contact us for a personalized demo or to discuss enterprise pricing.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="mailto:sales@contextflow.dev">
                  <button className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                    Contact Sales
                  </button>
                </Link>
                <Link href="/demo">
                  <button className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                    View Live Demo
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
