import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, getPlanFromPriceId } from '@/lib/stripe/client';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) return;

  // Update user's subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId);

  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Get the plan from the price ID
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : 'free';

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    paused: 'paused',
  };

  const status = statusMap[subscription.status] || 'inactive';

  await supabase
    .from('users')
    .update({
      subscription_status: status,
      subscription_plan: plan,
      stripe_subscription_id: subscription.id,
      subscription_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq('id', user.id);

  console.log(`Subscription updated for user ${user.id}: ${plan} (${status})`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({
      subscription_status: 'canceled',
      subscription_plan: 'free',
    })
    .eq('id', user.id);

  console.log(`Subscription canceled for user ${user.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Log successful payment
  await supabase.from('billing_events').insert({
    user_id: user.id,
    event_type: 'payment_succeeded',
    amount: invoice.amount_paid,
    currency: invoice.currency,
    invoice_id: invoice.id,
    created_at: new Date().toISOString(),
  });

  console.log(`Payment succeeded for user ${user.id}: ${invoice.amount_paid / 100} ${invoice.currency?.toUpperCase()}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Log failed payment
  await supabase.from('billing_events').insert({
    user_id: user.id,
    event_type: 'payment_failed',
    amount: invoice.amount_due,
    currency: invoice.currency,
    invoice_id: invoice.id,
    created_at: new Date().toISOString(),
  });

  // Update subscription status
  await supabase
    .from('users')
    .update({ subscription_status: 'past_due' })
    .eq('id', user.id);

  console.log(`Payment failed for user ${user.id}`);
}
