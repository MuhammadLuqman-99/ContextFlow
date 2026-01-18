import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, getPriceId, BillingCycle } from '@/lib/stripe/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billingCycle } = body as { plan: 'pro' | 'team'; billingCycle: BillingCycle };

    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, github_username')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          github_username: userData?.github_username || '',
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get the price ID for the selected plan and billing cycle
    const priceId = getPriceId(plan, billingCycle);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
