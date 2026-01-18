import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = 'ContextFlow <noreply@contextflow.dev>';

export type EmailTemplate =
  | 'welcome'
  | 'subscription_created'
  | 'subscription_canceled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'trial_ending';
