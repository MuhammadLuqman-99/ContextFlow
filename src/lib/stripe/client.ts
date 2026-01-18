import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Price IDs for each plan (you'll get these from Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  team: {
    monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
  },
} as const;

// Plan limits
export const PLAN_LIMITS = {
  free: {
    repositories: 1,
    microservices: 3,
    teamMembers: 1,
    storage: 100 * 1024 * 1024, // 100 MB
    apiCalls: 1000,
    historyDays: 7,
  },
  pro: {
    repositories: -1, // unlimited
    microservices: -1,
    teamMembers: 5,
    storage: 10 * 1024 * 1024 * 1024, // 10 GB
    apiCalls: 50000,
    historyDays: 90,
  },
  team: {
    repositories: -1,
    microservices: -1,
    teamMembers: -1,
    storage: 100 * 1024 * 1024 * 1024, // 100 GB
    apiCalls: -1,
    historyDays: 365,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type BillingCycle = 'monthly' | 'yearly';

// Helper to get price ID
export function getPriceId(plan: 'pro' | 'team', cycle: BillingCycle): string {
  return STRIPE_PRICE_IDS[plan][cycle];
}

// Helper to get plan from price ID
export function getPlanFromPriceId(priceId: string): PlanType {
  if (priceId === STRIPE_PRICE_IDS.pro.monthly || priceId === STRIPE_PRICE_IDS.pro.yearly) {
    return 'pro';
  }
  if (priceId === STRIPE_PRICE_IDS.team.monthly || priceId === STRIPE_PRICE_IDS.team.yearly) {
    return 'team';
  }
  return 'free';
}
