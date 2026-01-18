import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SubscriptionEmailProps {
  username: string;
  planName: string;
  amount: string;
  billingCycle: string;
  nextBillingDate?: string;
  type: 'created' | 'canceled' | 'payment_succeeded' | 'payment_failed' | 'trial_ending';
}

export default function SubscriptionEmail({
  username = 'there',
  planName = 'Pro',
  amount = '$12.00',
  billingCycle = 'monthly',
  nextBillingDate = '',
  type = 'created',
}: SubscriptionEmailProps) {
  const content = getContent(type, { username, planName, amount, billingCycle, nextBillingDate });

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>ContextFlow</Heading>
          </Section>

          {/* Main Content */}
          <Section style={contentStyle}>
            {/* Status Icon */}
            <Section style={iconContainer}>
              <Text style={content.iconStyle}>{content.icon}</Text>
            </Section>

            <Heading style={h1}>{content.title}</Heading>
            <Text style={text}>{content.message}</Text>

            {content.details && (
              <Section style={detailsBox}>
                {content.details.map((detail, index) => (
                  <Text key={index} style={detailItem}>
                    <span style={detailLabel}>{detail.label}:</span>{' '}
                    <span style={detailValue}>{detail.value}</span>
                  </Text>
                ))}
              </Section>
            )}

            {content.cta && (
              <Section style={buttonContainer}>
                <Button style={button} href={content.cta.href}>
                  {content.cta.text}
                </Button>
              </Section>
            )}

            <Hr style={hr} />

            <Text style={helpText}>
              {content.helpText}{' '}
              <Link href="mailto:billing@contextflow.dev" style={link}>
                billing@contextflow.dev
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ContextFlow - The mission control for vibe-coders
            </Text>
            <Text style={footerLinks}>
              <Link href="https://contextflow.dev/billing" style={footerLink}>
                Manage Billing
              </Link>
              {' • '}
              <Link href="https://contextflow.dev/terms" style={footerLink}>
                Terms
              </Link>
              {' • '}
              <Link href="https://contextflow.dev/privacy" style={footerLink}>
                Privacy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function getContent(
  type: SubscriptionEmailProps['type'],
  data: Omit<SubscriptionEmailProps, 'type'>
) {
  const { username, planName, amount, billingCycle, nextBillingDate } = data;

  switch (type) {
    case 'created':
      return {
        preview: `Welcome to ${planName}! Your subscription is now active.`,
        icon: '🎉',
        iconStyle: { ...iconText, color: '#22c55e' },
        title: `Welcome to ${planName}!`,
        message: `Hey ${username}, your subscription to the ${planName} plan is now active. You now have access to all ${planName} features.`,
        details: [
          { label: 'Plan', value: planName },
          { label: 'Amount', value: `${amount}/${billingCycle}` },
          { label: 'Trial Period', value: '14 days free' },
        ],
        cta: { text: 'Go to Dashboard', href: 'https://contextflow.dev/dashboard' },
        helpText: 'Questions about your subscription? Contact us at',
      };

    case 'canceled':
      return {
        preview: 'Your ContextFlow subscription has been canceled',
        icon: '👋',
        iconStyle: { ...iconText, color: '#f59e0b' },
        title: 'Subscription Canceled',
        message: `Hey ${username}, we're sorry to see you go. Your ${planName} subscription has been canceled. You'll still have access until the end of your current billing period.`,
        details: nextBillingDate
          ? [{ label: 'Access until', value: nextBillingDate }]
          : undefined,
        cta: { text: 'Resubscribe', href: 'https://contextflow.dev/pricing' },
        helpText: 'Changed your mind? You can resubscribe anytime. Questions? Contact',
      };

    case 'payment_succeeded':
      return {
        preview: `Payment received - ${amount} for ContextFlow ${planName}`,
        icon: '✅',
        iconStyle: { ...iconText, color: '#22c55e' },
        title: 'Payment Successful',
        message: `Hey ${username}, we've received your payment. Thank you for your continued support!`,
        details: [
          { label: 'Amount paid', value: amount },
          { label: 'Plan', value: planName },
          { label: 'Next billing date', value: nextBillingDate || 'N/A' },
        ],
        cta: { text: 'View Billing', href: 'https://contextflow.dev/billing' },
        helpText: 'Need a receipt or have billing questions? Contact',
      };

    case 'payment_failed':
      return {
        preview: 'Action required: Payment failed for ContextFlow',
        icon: '⚠️',
        iconStyle: { ...iconText, color: '#ef4444' },
        title: 'Payment Failed',
        message: `Hey ${username}, we couldn't process your payment for the ${planName} plan. Please update your payment method to avoid service interruption.`,
        details: [
          { label: 'Amount due', value: amount },
          { label: 'Plan', value: planName },
        ],
        cta: { text: 'Update Payment Method', href: 'https://contextflow.dev/billing' },
        helpText: 'Need help with your payment? Contact',
      };

    case 'trial_ending':
      return {
        preview: 'Your ContextFlow trial ends in 3 days',
        icon: '⏰',
        iconStyle: { ...iconText, color: '#f59e0b' },
        title: 'Trial Ending Soon',
        message: `Hey ${username}, your ${planName} trial ends in 3 days. Add a payment method to continue using all ${planName} features without interruption.`,
        details: [
          { label: 'Plan', value: planName },
          { label: 'Price after trial', value: `${amount}/${billingCycle}` },
        ],
        cta: { text: 'Add Payment Method', href: 'https://contextflow.dev/billing' },
        helpText: 'Questions about your trial? Contact',
      };

    default:
      return {
        preview: 'ContextFlow Subscription Update',
        icon: 'ℹ️',
        iconStyle: iconText,
        title: 'Subscription Update',
        message: `Hey ${username}, there's been an update to your subscription.`,
        cta: { text: 'View Details', href: 'https://contextflow.dev/billing' },
        helpText: 'Questions? Contact',
      };
  }
}

// Styles
const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  color: '#a855f7',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: 0,
};

const contentStyle = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid #334155',
};

const iconContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const iconText = {
  fontSize: '48px',
  margin: 0,
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const text = {
  color: '#94a3b8',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const detailsBox = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px',
};

const detailItem = {
  color: '#cbd5e1',
  fontSize: '14px',
  margin: '0 0 8px',
};

const detailLabel = {
  color: '#64748b',
};

const detailValue = {
  color: '#ffffff',
  fontWeight: 'bold',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#a855f7',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '14px 28px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#334155',
  margin: '24px 0',
};

const helpText = {
  color: '#64748b',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: 0,
};

const link = {
  color: '#a855f7',
  textDecoration: 'underline',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 8px',
};

const footerLinks = {
  color: '#64748b',
  fontSize: '12px',
  margin: 0,
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};
