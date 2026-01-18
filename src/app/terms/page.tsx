import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - ContextFlow',
  description: 'Terms of Service for ContextFlow - The Kanban Board that writes itself',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing or using ContextFlow ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
              <p className="text-gray-300">
                We reserve the right to modify these Terms at any time. Your continued use of the Service after any changes indicates your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300">
                ContextFlow is a project management tool that connects to your GitHub repositories to provide a visual Kanban board based on vibe.json manifest files. The Service includes features such as real-time updates, team collaboration, and PDF export capabilities.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <p className="text-gray-300 mb-4">To use the Service, you must:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Have a valid GitHub account</li>
                <li>Authorize ContextFlow to access your GitHub account</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
              <p className="text-gray-300 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Upload malicious code or content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Use the Service to send spam or unsolicited communications</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Subscription Plans and Billing</h2>

              <h3 className="text-xl font-medium text-white mb-3">5.1 Free Plan</h3>
              <p className="text-gray-300 mb-4">
                The Free plan includes limited features and is subject to usage restrictions as described on our pricing page.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">5.2 Paid Plans</h3>
              <p className="text-gray-300 mb-4">
                Paid subscriptions are billed monthly or annually. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">5.3 Refunds</h3>
              <p className="text-gray-300">
                Refunds may be provided at our discretion. Contact support within 14 days of purchase to request a refund.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p className="text-gray-300 mb-4">
                The Service and its original content, features, and functionality are owned by ContextFlow and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-300">
                You retain ownership of your data and content. By using the Service, you grant us a license to use your content solely to provide the Service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data and Privacy</h2>
              <p className="text-gray-300">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-neon-purple hover:text-neon-blue">Privacy Policy</Link>. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
              <p className="text-gray-300">
                The Service integrates with third-party services (e.g., GitHub). Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the actions or content of third-party services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-300">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CONTEXTFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
              <p className="text-gray-300 mb-4">
                We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment (for paid plans)</li>
                <li>At our sole discretion</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Upon termination, your right to use the Service will cease immediately. You may export your data before termination.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
              <p className="text-gray-300">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ContextFlow operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
              <p className="text-gray-300">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-300 mt-4">
                Email: <a href="mailto:legal@contextflow.dev" className="text-neon-purple hover:text-neon-blue">legal@contextflow.dev</a>
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
