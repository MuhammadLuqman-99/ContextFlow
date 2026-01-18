import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - ContextFlow',
  description: 'Privacy Policy for ContextFlow - The Kanban Board that writes itself',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                ContextFlow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              <p className="text-gray-300">
                By using ContextFlow, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-white mb-3">2.1 Information from GitHub</h3>
              <p className="text-gray-300 mb-4">
                When you authenticate with GitHub, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Your GitHub username and profile information</li>
                <li>Your email address associated with GitHub</li>
                <li>Your GitHub avatar URL</li>
                <li>OAuth access tokens to access your repositories</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">2.2 Repository Data</h3>
              <p className="text-gray-300 mb-4">
                When you connect a repository, we access:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Repository metadata (name, description, visibility)</li>
                <li>vibe.json manifest files in your repository</li>
                <li>Commit messages and history for webhook processing</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">2.3 Usage Data</h3>
              <p className="text-gray-300">
                We automatically collect certain information about your device and usage, including IP address, browser type, pages visited, and time spent on pages.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Display your project status on the dashboard</li>
                <li>Process webhook events from GitHub</li>
                <li>Send you service-related notifications</li>
                <li>Improve and optimize our service</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-300 mb-4">
                Your data is stored securely using Supabase, which provides enterprise-grade security including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Encryption at rest and in transit</li>
                <li>Row Level Security (RLS) policies</li>
                <li>Regular security audits</li>
                <li>SOC 2 Type II compliance</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing</h2>
              <p className="text-gray-300 mb-4">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Service Providers:</strong> Third parties that help us operate our service (e.g., Supabase, Vercel)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Revoke GitHub access</li>
              </ul>
              <p className="text-gray-300 mt-4">
                To exercise these rights, please contact us at privacy@contextflow.dev
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
              <p className="text-gray-300">
                We use essential cookies to maintain your session and preferences. We do not use tracking cookies for advertising purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p className="text-gray-300">
                Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
              <p className="text-gray-300">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-300 mt-4">
                Email: <a href="mailto:privacy@contextflow.dev" className="text-neon-purple hover:text-neon-blue">privacy@contextflow.dev</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <Link href="/" className="text-neon-purple hover:text-neon-blue transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
