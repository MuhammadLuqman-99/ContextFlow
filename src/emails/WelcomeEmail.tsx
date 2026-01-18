import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  username: string;
}

export default function WelcomeEmail({ username = 'there' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ContextFlow - The Kanban Board that writes itself</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>ContextFlow</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Welcome, {username}!</Heading>
            <Text style={text}>
              Thank you for joining ContextFlow. You're now part of a community of developers who are
              bridging the gap between AI-generated code and project management.
            </Text>

            <Text style={text}>Here's what you can do next:</Text>

            <Section style={features}>
              <Text style={featureItem}>
                <strong>1. Connect your repository</strong> - Link your GitHub repos and we'll
                automatically discover your vibe.json manifests.
              </Text>
              <Text style={featureItem}>
                <strong>2. Track your progress</strong> - Watch your Kanban board update in real-time
                as you commit code with status tags.
              </Text>
              <Text style={featureItem}>
                <strong>3. Share with your team</strong> - Generate shareable links so stakeholders
                can see your progress.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href="https://contextflow.dev/dashboard">
                Go to Dashboard
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              Need help getting started? Check out our{' '}
              <Link href="https://contextflow.dev/demo" style={link}>
                live demo
              </Link>{' '}
              or reply to this email - we're here to help!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ContextFlow - The mission control for vibe-coders
            </Text>
            <Text style={footerLinks}>
              <Link href="https://contextflow.dev" style={footerLink}>
                Website
              </Link>
              {' • '}
              <Link href="https://contextflow.dev/pricing" style={footerLink}>
                Pricing
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

const content = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid #334155',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const text = {
  color: '#94a3b8',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const features = {
  margin: '24px 0',
};

const featureItem = {
  color: '#cbd5e1',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px',
  paddingLeft: '8px',
  borderLeft: '2px solid #a855f7',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
