import { resend, FROM_EMAIL } from './client';
import WelcomeEmail from '@/emails/WelcomeEmail';
import SubscriptionEmail from '@/emails/SubscriptionEmail';

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

async function sendEmail({ to, subject, react }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}

// Send welcome email to new users
export async function sendWelcomeEmail(to: string, username: string) {
  return sendEmail({
    to,
    subject: 'Welcome to ContextFlow! 🎉',
    react: WelcomeEmail({ username }),
  });
}

// Send subscription created email
export async function sendSubscriptionCreatedEmail(
  to: string,
  username: string,
  planName: string,
  amount: string,
  billingCycle: string
) {
  return sendEmail({
    to,
    subject: `Welcome to ${planName}! Your subscription is active`,
    react: SubscriptionEmail({
      username,
      planName,
      amount,
      billingCycle,
      type: 'created',
    }),
  });
}

// Send subscription canceled email
export async function sendSubscriptionCanceledEmail(
  to: string,
  username: string,
  planName: string,
  accessUntil: string
) {
  return sendEmail({
    to,
    subject: 'Your ContextFlow subscription has been canceled',
    react: SubscriptionEmail({
      username,
      planName,
      amount: '',
      billingCycle: '',
      nextBillingDate: accessUntil,
      type: 'canceled',
    }),
  });
}

// Send payment succeeded email
export async function sendPaymentSucceededEmail(
  to: string,
  username: string,
  planName: string,
  amount: string,
  nextBillingDate: string
) {
  return sendEmail({
    to,
    subject: `Payment received - ${amount} for ContextFlow`,
    react: SubscriptionEmail({
      username,
      planName,
      amount,
      billingCycle: '',
      nextBillingDate,
      type: 'payment_succeeded',
    }),
  });
}

// Send payment failed email
export async function sendPaymentFailedEmail(
  to: string,
  username: string,
  planName: string,
  amount: string
) {
  return sendEmail({
    to,
    subject: '⚠️ Action required: Payment failed for ContextFlow',
    react: SubscriptionEmail({
      username,
      planName,
      amount,
      billingCycle: '',
      type: 'payment_failed',
    }),
  });
}

// Send trial ending email
export async function sendTrialEndingEmail(
  to: string,
  username: string,
  planName: string,
  amount: string,
  billingCycle: string
) {
  return sendEmail({
    to,
    subject: '⏰ Your ContextFlow trial ends in 3 days',
    react: SubscriptionEmail({
      username,
      planName,
      amount,
      billingCycle,
      type: 'trial_ending',
    }),
  });
}
