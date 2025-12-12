/**
 * Privacy Policy - GDPR/CCPA compliant privacy policy
 */

import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'December 9, 2025'
const COMPANY_NAME = '1v1bro'
const WEBSITE_URL = '1v1bro.online'
const CONTACT_EMAIL = 'support@restaurantiq.us'

export function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-[#737373] hover:text-white mb-8 flex items-center gap-2 transition-colors text-[14px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <article className="prose prose-invert prose-sm max-w-none">
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-[#737373] text-sm mb-8">Last Updated: {LAST_UPDATED}</p>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              {COMPANY_NAME} ("we," "our," or "us") operates the website {WEBSITE_URL} and related services 
              (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our Service.
            </p>
            <p className="text-[#B4B4B4] leading-[1.7]">
              By accessing or using the Service, you agree to this Privacy Policy. If you do not agree 
              with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-[16px] font-semibold text-white mb-3">2.1 Information You Provide</h3>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Email address, display name, and password when you create an account</li>
              <li><strong>Profile Information:</strong> Avatar, username, and other profile customizations</li>
              <li><strong>Payment Information:</strong> When you make purchases, payment processing is handled by Stripe. We do not store your full credit card number</li>
              <li><strong>Communications:</strong> Information you provide when contacting support</li>
            </ul>

            <h3 className="text-[16px] font-semibold text-white mb-3">2.2 Information Collected Automatically</h3>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Game statistics, match history, scores, and gameplay data</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, and referring URLs</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
            </ul>

            <h3 className="text-[16px] font-semibold text-white mb-3">2.3 Third-Party Authentication</h3>
            <p className="text-[#B4B4B4] leading-[1.7]">
              If you sign in using Google or Discord, we receive your email address and basic profile 
              information from those services as permitted by your privacy settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Create and manage your account</li>
              <li>Display leaderboards and match statistics</li>
              <li>Send administrative messages and updates</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">4. Information Sharing</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> With third parties who perform services on our behalf (e.g., Stripe for payments, Supabase for authentication)</li>
              <li><strong>Public Information:</strong> Your display name, game statistics, and leaderboard rankings are publicly visible</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              We implement appropriate technical and organizational measures to protect your personal 
              information. However, no method of transmission over the Internet is 100% secure. 
              We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">6. Data Retention</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              We retain your personal information for as long as your account is active or as needed 
              to provide you services. We may retain certain information as required by law or for 
              legitimate business purposes, including fraud prevention and dispute resolution.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">7. Your Rights</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
            </ul>
            <p className="text-[#B4B4B4] leading-[1.7] mt-4">
              To exercise these rights, contact us at {CONTACT_EMAIL}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">8. Children's Privacy</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              The Service is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you are a parent or guardian 
              and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">9. International Transfers</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              Your information may be transferred to and processed in countries other than your own. 
              These countries may have different data protection laws. By using the Service, you 
              consent to such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
              Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">11. Contact Us</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              If you have questions about this Privacy Policy, please contact us at:<br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 hover:text-blue-400">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
