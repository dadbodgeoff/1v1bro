/**
 * Terms of Service - Comprehensive terms with strong virtual goods protection
 */

import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'December 9, 2025'
const COMPANY_NAME = '1v1bro'
const WEBSITE_URL = '1v1bro.online'
const CONTACT_EMAIL = 'support@restaurantiq.us'
const JURISDICTION = 'State of Rhode Island'

export function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-[#737373] text-sm mb-8">Last Updated: {LAST_UPDATED}</p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <p className="text-amber-400 text-sm font-medium mb-0">
              IMPORTANT: Please read these Terms carefully before using {COMPANY_NAME}. By creating an account 
              or making any purchase, you agree to be bound by these Terms, including our refund policy 
              for virtual goods.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              By accessing or using {COMPANY_NAME} at {WEBSITE_URL} (the "Service"), you agree to be bound 
              by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use 
              the Service.
            </p>
            <p className="text-[#B4B4B4] leading-[1.7]">
              We reserve the right to modify these Terms at any time. Continued use of the Service after 
              changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">2. Eligibility</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              You must be at least 13 years old to use the Service. If you are under 18, you represent 
              that you have your parent or guardian's permission to use the Service. By using the Service, 
              you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">3. Account Registration</h2>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">4. Virtual Currency and Virtual Goods</h2>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium mb-0">
                PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS REGARDING PURCHASES.
              </p>
            </div>

            <h3 className="text-[16px] font-semibold text-white mb-3">4.1 Nature of Virtual Currency</h3>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              "Coins" and any other virtual currency offered through the Service are virtual items with 
              no real-world value. Virtual currency:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mb-4 space-y-2">
              <li>Is not redeemable for real money, goods, or any other item of monetary value</li>
              <li>Cannot be transferred, sold, or exchanged outside the Service</li>
              <li>Has no cash value and is not a personal property right</li>
              <li>May be modified, regulated, or eliminated at any time without notice or liability</li>
            </ul>

            <h3 className="text-[16px] font-semibold text-white mb-3">4.2 License to Virtual Goods</h3>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              When you purchase or earn virtual currency or virtual goods (including but not limited to 
              skins, emotes, Battle Pass access, and cosmetic items), you are purchasing a limited, 
              non-exclusive, non-transferable, revocable license to use such virtual items within the 
              Service. <strong>You do not own the virtual items; you are granted a license to use them.</strong>
            </p>

            <h3 className="text-[16px] font-semibold text-white mb-3">4.3 Delivery of Virtual Goods</h3>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              Virtual currency and virtual goods are delivered instantly upon successful payment processing. 
              By completing a purchase, you acknowledge that:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mb-4 space-y-2">
              <li>Delivery begins immediately upon payment confirmation</li>
              <li>You expressly consent to immediate delivery</li>
              <li>You acknowledge that you lose your right of withdrawal once delivery begins</li>
              <li>The virtual goods are immediately available for use in your account</li>
            </ul>

            <h3 className="text-[16px] font-semibold text-white mb-3">4.4 No Refunds for Virtual Goods</h3>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              <strong>ALL PURCHASES OF VIRTUAL CURRENCY AND VIRTUAL GOODS ARE FINAL AND NON-REFUNDABLE.</strong> 
              By making a purchase, you acknowledge and agree that:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 mb-4 space-y-2">
              <li>You are purchasing a license to use virtual items, not the items themselves</li>
              <li>Virtual goods are delivered instantly and cannot be "returned"</li>
              <li>You waive any right to a refund, chargeback, or reversal of payment</li>
              <li>Initiating a chargeback or payment dispute may result in immediate account termination</li>
              <li>We reserve the right to pursue recovery of any amounts owed plus associated fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">5. Payment Terms</h2>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>All prices are displayed in USD unless otherwise indicated</li>
              <li>Payment processing is handled by Stripe, a PCI-compliant payment processor</li>
              <li>You agree to pay all charges incurred by your account</li>
              <li>You represent that you are authorized to use the payment method provided</li>
              <li>We reserve the right to change prices at any time without notice</li>
              <li>Promotional pricing and discounts are subject to availability and may be withdrawn</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">6. Chargebacks and Disputes</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              If you initiate a chargeback, payment dispute, or reversal with your bank or payment provider:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Your account will be immediately suspended pending investigation</li>
              <li>All virtual currency and virtual goods may be removed from your account</li>
              <li>Your account may be permanently terminated</li>
              <li>You may be prohibited from creating new accounts</li>
              <li>We may pursue collection of the disputed amount plus any fees incurred</li>
              <li>We may report fraudulent chargebacks to relevant authorities</li>
            </ul>
            <p className="text-[#B4B4B4] leading-[1.7] mt-4">
              If you have a legitimate concern about a charge, please contact us at {CONTACT_EMAIL} 
              before initiating a dispute with your payment provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">7. User Conduct</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">You agree not to:</p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Use cheats, exploits, automation software, bots, or any unauthorized third-party software</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorized access to accounts or systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Buy, sell, or trade accounts or virtual items outside the Service</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">8. Account Termination</h2>
            <p className="text-[#B4B4B4] leading-[1.7] mb-4">
              We may suspend or terminate your account at any time, with or without cause, with or 
              without notice. Upon termination:
            </p>
            <ul className="text-[#B4B4B4] leading-[1.7] list-disc pl-6 space-y-2">
              <li>Your license to use virtual currency and virtual goods is immediately revoked</li>
              <li>You will lose access to all virtual items associated with your account</li>
              <li>No refunds will be provided for any virtual currency or virtual goods</li>
              <li>We are not liable for any loss resulting from account termination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">9. Intellectual Property</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              All content, features, and functionality of the Service, including but not limited to 
              text, graphics, logos, icons, images, audio, video, software, and code, are owned by 
              {COMPANY_NAME} or its licensors and are protected by copyright, trademark, and other 
              intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES 
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT 
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">11. Limitation of Liability</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF 
              PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. 
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) 
              MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">12. Indemnification</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its officers, 
              directors, employees, and agents from any claims, damages, losses, liabilities, and 
              expenses (including attorneys' fees) arising out of your use of the Service or 
              violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">13. Governing Law</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              These Terms shall be governed by and construed in accordance with the laws of the 
              {JURISDICTION}, United States, without regard to conflict of law principles. Any 
              disputes arising from these Terms shall be resolved in the state or federal courts 
              located in Providence, Rhode Island, and you consent to the personal jurisdiction 
              of such courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">14. Severability</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              will continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-white mb-4">15. Contact Information</h2>
            <p className="text-[#B4B4B4] leading-[1.7]">
              For questions about these Terms, please contact us at:<br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
