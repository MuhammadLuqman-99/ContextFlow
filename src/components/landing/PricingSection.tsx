'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Building2, Rocket } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for solo developers getting started',
    icon: Zap,
    features: [
      '1 repository',
      '3 microservices',
      'Basic Kanban board',
      'GitHub OAuth login',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/login',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For professional developers and small teams',
    icon: Rocket,
    features: [
      'Unlimited repositories',
      'Unlimited microservices',
      'Real-time updates',
      'PDF export',
      'Share dashboards',
      'Priority support',
      'Custom vibe.json templates',
    ],
    cta: 'Start Free Trial',
    href: '/login?plan=pro',
    popular: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/user/month',
    description: 'For teams that need collaboration features',
    icon: Building2,
    features: [
      'Everything in Pro',
      'Team workspaces',
      'Role-based permissions',
      'Slack/Discord integration',
      'Advanced analytics',
      'Audit logs',
      'SSO (SAML)',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@contextflow.dev',
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-sm font-medium text-neon-purple bg-neon-purple/10 rounded-full border border-neon-purple/20 mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>

              <p className="text-gray-400 mb-6">{tier.description}</p>

              <Link href={tier.href}>
                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {tier.cta}
                </button>
              </Link>

              <div className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={`p-0.5 rounded-full ${tier.popular ? 'bg-neon-purple' : 'bg-gray-600'}`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center space-y-4"
        >
          <p className="text-gray-400">
            All plans include a 14-day free trial. No credit card required.{' '}
            <Link href="/login" className="text-neon-purple hover:text-neon-blue transition-colors">
              Start your trial today →
            </Link>
          </p>
          <p className="text-gray-500 text-sm">
            Need more details?{' '}
            <Link href="/pricing" className="text-neon-purple hover:text-neon-blue transition-colors">
              View full feature comparison & usage limits →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
